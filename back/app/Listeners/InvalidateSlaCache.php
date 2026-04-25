<?php

namespace App\Listeners;

use App\Events\CompanySettingsUpdated;
use App\Services\SlaCalculator;

/**
 * ✅ عند تحديث الـ settings، امسح الـ cache على كل السيرفرات
 */
class InvalidateSlaCache
{
    public function handle(CompanySettingsUpdated $event): void
    {
        // مسح الـ cache من Redis
        SlaCalculator::clearCache($event->companyId);
        
        \Log::info("SLA cache invalidated for company {$event->companyId}");
    }
}
