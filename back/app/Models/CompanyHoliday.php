<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class CompanyHoliday extends Model
{
    protected $fillable = [
        'company_id',
        'holiday_date',
        'name',
        'name_ar',
        'description',
        'is_recurring',
    ];

    protected $casts = [
        'holiday_date' => 'date',
        'is_recurring' => 'boolean',
    ];

    // ── Relations ────────────────────────────────────────────

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    // ── Scopes ───────────────────────────────────────────────

    /**
     * احصل على العطل لسنة معينة
     */
    public function scopeForYear($query, int $year)
    {
        return $query->whereYear('holiday_date', $year);
    }

    /**
     * احصل على العطل المقبلة
     */
    public function scopeUpcoming($query)
    {
        return $query->where('holiday_date', '>=', now()->toDateString())
                     ->orderBy('holiday_date');
    }

    /**
     * احصل على العطل الماضية
     */
    public function scopePast($query)
    {
        return $query->where('holiday_date', '<', now()->toDateString())
                     ->orderBy('holiday_date', 'desc');
    }

    /**
     * احصل على العطل للشركة والسنة
     */
    public function scopeForCompanyAndYear($query, int $companyId, int $year)
    {
        return $query->where('company_id', $companyId)
                     ->whereYear('holiday_date', $year);
    }

    // ── Helpers ──────────────────────────────────────────────

    /**
     * احصل على اسم العطلة (بالعربية إذا توفرت)
     */
    public function getDisplayName(): string
    {
        return $this->name_ar ?? $this->name ?? 'عطلة';
    }

    /**
     * احصل على اليوم من الأسبوع
     */
    public function getDayOfWeek(): string
    {
        return $this->holiday_date->format('l'); // Monday, Tuesday, etc.
    }

    /**
     * احصل على اليوم من الأسبوع بالعربية
     */
    public function getDayOfWeekAr(): string
    {
        $days = [
            'Sunday' => 'الأحد',
            'Monday' => 'الاثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
            'Saturday' => 'السبت',
        ];
        return $days[$this->getDayOfWeek()] ?? '';
    }

    /**
     * هل هذه عطلة اليوم؟
     */
    public function isToday(): bool
    {
        return $this->holiday_date->isToday();
    }

    /**
     * هل هذه عطلة قادمة؟
     */
    public function isUpcoming(): bool
    {
        return $this->holiday_date->isFuture();
    }
}
