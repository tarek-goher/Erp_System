<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * TicketLog — سجل الأنشطة على التذكرة (Audit Trail)
 *
 * ضعه في: app/Models/TicketLog.php
 */
class TicketLog extends Model
{
    protected $fillable = [
        'ticket_id',
        'done_by',
        'action',
        'old_value',
        'new_value',
        'notes',
    ];

    // ── Relations ────────────────────────────────────────────

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function doneBy()
    {
        return $this->belongsTo(User::class, 'done_by');
    }

    // ── Helpers ──────────────────────────────────────────────

    /**
     * وصف النشاط للعرض في الـ Timeline
     */
    public function getDescriptionAttribute(): string
    {
        return match ($this->action) {
            'created'            => 'أنشأ التذكرة',
            'status_changed'     => "غيّر الحالة من \"{$this->old_value}\" إلى \"{$this->new_value}\"",
            'assigned'           => "عيّن التذكرة إلى \"{$this->new_value}\"",
            'unassigned'         => 'أزال تعيين التذكرة',
            'commented'          => 'أضاف رد',
            'internal_note'      => 'أضاف ملاحظة داخلية',
            'attachment_added'   => "رفع ملف: \"{$this->new_value}\"",
            'attachment_deleted' => "حذف ملف: \"{$this->old_value}\"",
            'priority_changed'   => "غيّر الأولوية من \"{$this->old_value}\" إلى \"{$this->new_value}\"",
            'tag_added'          => "أضاف وسم: \"{$this->new_value}\"",
            'tag_removed'        => "أزال وسم: \"{$this->old_value}\"",
            'resolved'           => 'أغلق التذكرة كمحلولة',
            'closed'             => 'أغلق التذكرة',
            'reopened'           => 'أعاد فتح التذكرة',
            'escalated'          => 'صعّد التذكرة تلقائيًا',
            'sla_paused'         => 'أوقف حساب SLA مؤقتاً',
            'sla_resumed'        => 'استأنف حساب SLA',
            default              => $this->action,
        };
    }
}
