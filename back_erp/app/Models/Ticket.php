<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id', 'customer_id', 'assigned_to',
        'subject', 'description', 'status', 'priority',
        'category', 'resolution', 'resolved_at', 'sla_due_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'sla_due_at'  => 'datetime',
    ];

    public function customer()   { return $this->belongsTo(Customer::class); }
    public function assignedTo() { return $this->belongsTo(User::class, 'assigned_to'); }
    public function messages()   { return $this->hasMany(TicketMessage::class); }

    public function scopeOpen($q)       { return $q->where('status', 'open'); }
    public function scopeUnresolved($q) { return $q->whereNotIn('status', ['resolved', 'closed']); }
}
