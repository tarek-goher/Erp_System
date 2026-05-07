<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Ticket — النموذج الرئيسي للتذاكر (نسخة مدمجة ومحدّثة)
 *
 * يستبدل: app/Models/Ticket.php
 *
 * ما تم إضافته عن النسخة القديمة:
 *  - ticket_number توليد تلقائي
 *  - requester_id, service_id, form_data
 *  - first_response_due_at, resolution_due_at, sla_breached, sla_policy_id
 *  - status transitions محمية canTransitionTo()
 *  - Relations: service, requester, attachments, logs, tags, slaPolicy
 *  - Scopes: overdue, waitingUser
 *  - Helpers: isOverdue(), isResponseOverdue(), canTransitionTo()
 */
class Ticket extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $table = 'support_tickets';

    protected $fillable = [
        'company_id',
        'ticket_number',
        'requester_id',
        'service_id',
        'form_data',
        'customer_id',
        'assigned_to',
        'subject',
        'message',
        'description',
        'status',                // open | assigned | in_progress | waiting_user | resolved | closed
        'priority',              // low | medium | high | urgent
        'category',
        'resolution',
        'resolved_at',
        'sla_due_at',
        'first_response_due_at',
        'resolution_due_at',
        'first_response_at',
        'sla_breached',
        'sla_policy_id',
    ];

    protected $casts = [
        'resolved_at'           => 'datetime',
        'sla_due_at'            => 'datetime',
        'first_response_due_at' => 'datetime',
        'resolution_due_at'     => 'datetime',
        'first_response_at'     => 'datetime',
        'sla_breached'          => 'boolean',
        'form_data'             => 'array',
    ];

    public function getDescriptionAttribute($value): ?string
    {
        return $value ?? $this->attributes['message'] ?? null;
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['message'] = $value;
    }

    // ── Boot: توليد ticket_number تلقائي ─────────────────────

    protected static function booted(): void
    {
        static::creating(function (Ticket $ticket) {
            if (empty($ticket->ticket_number)) {
                $year  = now()->year;
                $count = static::withoutGlobalScope('company')
                    ->where('company_id', $ticket->company_id)
                    ->withTrashed()
                    ->count() + 1;
                $ticket->ticket_number = 'SD-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    // ── Relations ────────────────────────────────────────────

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function slaPolicy()
    {
        return $this->belongsTo(SlaPolicy::class);
    }

    public function service()
    {
        return $this->belongsTo(ServiceCatalog::class, 'service_id');
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class);
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class, 'ticket_id');
    }

    public function logs()
    {
        return $this->hasMany(TicketLog::class, 'ticket_id')->latest();
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'ticket_tags');
    }

    // ── Scopes ───────────────────────────────────────────────

    public function scopeOpen($q)        { return $q->where('status', 'open'); }
    public function scopeUnresolved($q)  { return $q->whereNotIn('status', ['resolved', 'closed']); }
    public function scopeOverdue($q)     { return $q->where('resolution_due_at', '<', now())->whereNotIn('status', ['resolved', 'closed']); }
    public function scopeWaitingUser($q) { return $q->where('status', 'waiting_user'); }

    // ── Status Transitions ───────────────────────────────────

    public static function allowedTransitions(): array
    {
        return [
            'open'         => ['assigned', 'in_progress', 'resolved', 'closed'],
            'assigned'     => ['in_progress', 'resolved', 'closed'],
            'in_progress'  => ['waiting_user', 'resolved', 'closed'],
            'waiting_user' => ['in_progress', 'resolved', 'closed'],
            'resolved'     => ['closed', 'in_progress'], // in_progress = reopen
            'closed'       => [],
        ];
    }

    public function canTransitionTo(string $newStatus): bool
    {
        return in_array($newStatus, static::allowedTransitions()[$this->status] ?? []);
    }

    // ── Helpers ──────────────────────────────────────────────

    public function isOverdue(): bool
    {
        return $this->resolution_due_at
            && $this->resolution_due_at->isPast()
            && !in_array($this->status, ['resolved', 'closed']);
    }

    public function isResponseOverdue(): bool
    {
        return $this->first_response_due_at
            && $this->first_response_due_at->isPast()
            && !$this->first_response_at;
    }
}
