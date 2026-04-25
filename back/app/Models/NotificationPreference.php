<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * NotificationPreference — تفضيلات الإشعارات للمستخدم
 *
 * ضعه في: app/Models/NotificationPreference.php
 */
class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'email_on_assigned',
        'email_on_status_change',
        'email_on_reply',
        'email_on_escalation',
        'inapp_on_assigned',
        'inapp_on_status_change',
        'inapp_on_reply',
        'inapp_on_escalation',
    ];

    protected $casts = [
        'email_on_assigned'      => 'boolean',
        'email_on_status_change' => 'boolean',
        'email_on_reply'         => 'boolean',
        'email_on_escalation'    => 'boolean',
        'inapp_on_assigned'      => 'boolean',
        'inapp_on_status_change' => 'boolean',
        'inapp_on_reply'         => 'boolean',
        'inapp_on_escalation'    => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
