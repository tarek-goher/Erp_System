<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_id',
        'work_start_hour',
        'work_end_hour',
        'weekend_days',
        'timezone',
        'company_name_ar',
        'company_name_en',
        'phone',
        'email',
        'address',
        'logo_url',
        'favicon_url',
        'enable_sms_notifications',
        'enable_email_notifications',
        'enable_push_notifications',
    ];

    protected $casts = [
        'weekend_days' => 'array',
        'enable_sms_notifications' => 'boolean',
        'enable_email_notifications' => 'boolean',
        'enable_push_notifications' => 'boolean',
    ];

    // ── Relations ────────────────────────────────────────────

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    // ── Helpers ──────────────────────────────────────────────

    /**
     * احصل على ساعة البداية كـ integer
     */
    public function getWorkStartHourAsInt(): int
    {
        return (int)$this->work_start_hour;
    }

    /**
     * احصل على ساعة النهاية كـ integer
     */
    public function getWorkEndHourAsInt(): int
    {
        return (int)$this->work_end_hour;
    }

    /**
     * احصل على أيام العطل كـ array
     */
    public function getWeekendDaysAsArray(): array
    {
        return $this->weekend_days ?? [5, 6];
    }
}
