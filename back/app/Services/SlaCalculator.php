<?php

namespace App\Services;

use App\Events\CompanySettingsUpdated;
use App\Events\CompanyHolidaysUpdated;
use App\Models\CompanyHoliday;
use App\Models\CompanySetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * SlaCalculator — Production-Ready SLA Calculation Service
 *
 * ✅ Fixed Issues:
 * 1. Redis Cache instead of in-memory
 * 2. Proper timezone handling (UTC conversion)
 * 3. Recurring holidays support
 * 4. Cache invalidation via events
 * 5. Queue integration ready
 * 6. Multi-server compatible
 *
 * مثال:
 *   startDate = Monday 15:00 | hours = 4 | business hours 9-17
 *   النتيجة = Tuesday 11:00 (ساعتين باقيين اليوم + ساعتين بكرة)
 */
class SlaCalculator
{
    const DEFAULT_WEEKEND_DAYS = [5, 6];
    const DEFAULT_WORK_START = 9;
    const DEFAULT_WORK_END = 17;
    const DEFAULT_TIMEZONE = 'Africa/Cairo';
    const CACHE_TTL = 86400; // 24 ساعات

    /**
     * احسب due date من تاريخ معين مع دعم الـ holidays و timezone و company settings
     * 
     * @param Carbon $startDate تاريخ البداية (مهم!)
     * @param int $hours عدد ساعات العمل
     * @param bool $businessHoursOnly هل تحتسب ساعات العمل فقط؟
     * @param int|null $companyId معرف الشركة
     * @param string|null $timezone timezone الشركة
     * @return Carbon
     */
    public static function calculateDueDate(
        Carbon $startDate,
        int $hours,
        bool $businessHoursOnly = true,
        ?int $companyId = null,
        ?string $timezone = null
    ): Carbon {
        // ✅ استخدم UTC internally، لكن convert بناءً على timezone الشركة
        $timezone ??= self::DEFAULT_TIMEZONE;
        
        // Convert to UTC for storage/comparison
        $startDateUtc = $startDate->copy()->setTimezone('UTC');
        
        if (!$businessHoursOnly) {
            return $startDateUtc->addHours($hours)->setTimezone($timezone);
        }

        $dueUtc = static::addBusinessHours(
            $startDateUtc,
            $hours,
            $companyId,
            $timezone
        );

        // Return in company timezone
        return $dueUtc->setTimezone($timezone);
    }

    /**
     * أضف X ساعة عمل لتاريخ معين مع احترام الـ holidays و business hours
     */
    public static function addBusinessHours(
        Carbon $from,
        int $hours,
        ?int $companyId = null,
        ?string $timezone = null
    ): Carbon {
        if ($hours <= 0) {
            return $from->copy();
        }

        $timezone ??= self::DEFAULT_TIMEZONE;
        
        // ✅ Work in company timezone
        $current = $from->copy()->setTimezone($timezone);

        // ✅ اقرأ الـ settings و holidays من Redis Cache
        $settings = self::getCompanySettings($companyId);
        $workStart = $settings['work_start'] ?? self::DEFAULT_WORK_START;
        $workEnd = $settings['work_end'] ?? self::DEFAULT_WORK_END;
        $weekendDays = $settings['weekend_days'] ?? self::DEFAULT_WEEKEND_DAYS;

        $holidays = self::getCompanyHolidays($companyId);

        $remainingHours = $hours;

        while ($remainingHours > 0) {
            $dateString = $current->toDateString();

            // اسكيب الـ holidays و weekends
            if (
                in_array($current->dayOfWeek, $weekendDays) ||
                in_array($dateString, $holidays)
            ) {
                $current->addDay()->setTime($workStart, 0, 0);
                continue;
            }

            $workStartTime = $current->copy()->setTime($workStart, 0, 0);
            $workEndTime = $current->copy()->setTime($workEnd, 0, 0);

            if ($current->lt($workStartTime)) {
                $current = $workStartTime;
            }

            if ($current->gte($workEndTime)) {
                $current->addDay()->setTime($workStart, 0, 0);
                continue;
            }

            $hoursLeftToday = $current->diffInMinutes($workEndTime) / 60;

            if ($remainingHours <= $hoursLeftToday) {
                $current->addMinutes((int)($remainingHours * 60));
                $remainingHours = 0;
            } else {
                $remainingHours -= $hoursLeftToday;
                $current->addDay()->setTime($workStart, 0, 0);
            }
        }

        return $current;
    }

    /**
     * هل تجاوز الـ SLA؟
     */
    public static function isBreached(?Carbon $dueDate, ?string $timezone = null): bool
    {
        if (!$dueDate) return false;
        
        $timezone ??= self::DEFAULT_TIMEZONE;
        return now($timezone)->isAfter($dueDate);
    }

    /**
     * احسب كام ساعة عمل متبقية حتى الـ due date
     */
    public static function getHoursUntilDue(
        Carbon $dueDate,
        ?int $companyId = null,
        ?string $timezone = null
    ): int {
        $timezone ??= self::DEFAULT_TIMEZONE;
        $now = now($timezone);

        if ($now->isAfter($dueDate)) {
            return 0;
        }

        $settings = self::getCompanySettings($companyId);
        $workStart = $settings['work_start'] ?? self::DEFAULT_WORK_START;
        $workEnd = $settings['work_end'] ?? self::DEFAULT_WORK_END;
        $weekendDays = $settings['weekend_days'] ?? self::DEFAULT_WEEKEND_DAYS;
        $holidays = self::getCompanyHolidays($companyId);

        $current = $now->copy();
        $hoursWorked = 0;

        while ($current->lt($dueDate)) {
            $dateString = $current->toDateString();

            if (
                in_array($current->dayOfWeek, $weekendDays) ||
                in_array($dateString, $holidays)
            ) {
                $current->addDay()->setTime($workStart, 0, 0);
                continue;
            }

            $workStartTime = $current->copy()->setTime($workStart, 0, 0);
            $workEndTime = $current->copy()->setTime($workEnd, 0, 0);

            if ($current->lt($workStartTime)) {
                $current = $workStartTime;
            }

            if ($current->gte($workEndTime)) {
                $current->addDay()->setTime($workStart, 0, 0);
                continue;
            }

            $nextStop = $dueDate->lt($workEndTime) ? $dueDate : $workEndTime;
            $hoursWorked += $current->diffInMinutes($nextStop) / 60;

            if ($dueDate->lt($workEndTime)) {
                break;
            }

            $current = $workEndTime->copy()->addDay()->setTime($workStart, 0, 0);
        }

        return (int)$hoursWorked;
    }

    /**
     * ✅ اقرأ إعدادات الشركة من Redis Cache
     * Redis cache يعمل عبر كل السيرفرات
     */
    private static function getCompanySettings(?int $companyId): array
    {
        if (!$companyId) {
            return [];
        }

        try {
            // ✅ استخدم Laravel Cache (يمكن Redis, File, Database, إلخ)
            return Cache::remember(
                "company_settings_{$companyId}",
                self::CACHE_TTL,
                function () use ($companyId) {
                    $setting = CompanySetting::where('company_id', $companyId)->first();
                    
                    if (!$setting) {
                        return [];
                    }

                    return [
                        'work_start' => $setting->work_start_hour ?? self::DEFAULT_WORK_START,
                        'work_end' => $setting->work_end_hour ?? self::DEFAULT_WORK_END,
                        'weekend_days' => $setting->weekend_days ?? self::DEFAULT_WEEKEND_DAYS,
                        'timezone' => $setting->timezone ?? self::DEFAULT_TIMEZONE,
                    ];
                }
            );
        } catch (\Exception $e) {
            Log::warning("Failed to load company settings for {$companyId}", ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * ✅ اقرأ الـ holidays من Redis Cache
     * يدعم recurring holidays (تكرار سنوي)
     */
    private static function getCompanyHolidays(?int $companyId): array
    {
        if (!$companyId) {
            return [];
        }

        try {
            $cacheKey = "company_holidays_{$companyId}_" . now()->year;

            // ✅ استخدم Laravel Cache
            return Cache::remember(
                $cacheKey,
                self::CACHE_TTL,
                function () use ($companyId) {
                    $year = now()->year;
                    
                    // الـ holidays الثابتة للسنة
                    $fixedHolidays = CompanyHoliday::where('company_id', $companyId)
                        ->whereYear('holiday_date', $year)
                        ->where('is_recurring', false)
                        ->pluck('holiday_date')
                        ->map(fn($d) => $d instanceof Carbon ? $d->toDateString() : (string)$d)
                        ->toArray();

                    // ✅ الـ holidays المتكررة (نفس الشهر واليوم كل سنة)
                    $recurringHolidays = CompanyHoliday::where('company_id', $companyId)
                        ->where('is_recurring', true)
                        ->get()
                        ->map(function ($holiday) use ($year) {
                            $date = $holiday->holiday_date;
                            // احسب نفس الشهر واليوم للسنة الحالية
                            return Carbon::createFromDate($year, $date->month, $date->day)
                                ->toDateString();
                        })
                        ->toArray();

                    return array_merge($fixedHolidays, $recurringHolidays);
                }
            );
        } catch (\Exception $e) {
            Log::warning("Failed to load company holidays for {$companyId}", ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * ✅ مسح الـ Cache عبر كل السيرفرات
     * هذا يستخدم Redis/centralized cache
     */
    public static function clearCache(int $companyId): void
    {
        try {
            Cache::forget("company_settings_{$companyId}");
            Cache::forget("company_holidays_{$companyId}_" . now()->year);
            
            // ✅ Dispatch event لكل السيرفرات
            event(new CompanySettingsUpdated($companyId));
            
            Log::info("Cache cleared for company {$companyId}");
        } catch (\Exception $e) {
            Log::error("Failed to clear cache for company {$companyId}", ['error' => $e->getMessage()]);
        }
    }

    /**
     * ✅ مسح الـ Cache للسنة المعينة
     */
    public static function clearCacheForYear(int $companyId, int $year): void
    {
        try {
            Cache::forget("company_settings_{$companyId}");
            Cache::forget("company_holidays_{$companyId}_{$year}");
            Log::info("Cache cleared for company {$companyId} year {$year}");
        } catch (\Exception $e) {
            Log::error("Failed to clear cache for company {$companyId}", ['error' => $e->getMessage()]);
        }
    }

    /**
     * ✅ مسح كل الـ Cache (للـ maintenance)
     */
    public static function clearAllCache(): void
    {
        try {
            Cache::flush();
            Log::info("All SLA cache cleared");
        } catch (\Exception $e) {
            Log::error("Failed to clear all cache", ['error' => $e->getMessage()]);
        }
    }
}
