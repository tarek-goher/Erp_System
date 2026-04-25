<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * EscalationRule — MERGED
 * يدعم الأعمدة القديمة (condition / threshold_hours / escalate_to_user_id)
 * والأعمدة الجديدة (trigger / after_hours / action / action_data)
 */
class EscalationRule extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        // ── أعمدة قديمة (ERP) ──────────────────────
        'condition',
        'threshold_hours',
        'escalate_to_user_id',
        'escalate_to_email',
        'notify_by',
        // ── أعمدة جديدة (Service Desk) ─────────────
        'trigger',       // sla_response_breach | sla_resolution_breach | no_update
        'after_hours',
        'action',        // notify_supervisor | reassign | change_priority | send_email
        'action_data',   // json
        'is_active',
    ];

    protected $casts = [
        'notify_by'   => 'array',
        'action_data' => 'array',
        'is_active'   => 'boolean',
    ];

    public function escalateTo()
    {
        return $this->belongsTo(User::class, 'escalate_to_user_id');
    }
}
