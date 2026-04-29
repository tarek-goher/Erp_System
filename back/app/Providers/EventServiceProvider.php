<?php

namespace App\Providers;

use App\Events\CompanySettingsUpdated;
use App\Events\PayrollGenerated;
use App\Events\PayrollPaid;
use App\Events\ProductionCompleted;
use App\Events\PurchaseConfirmed;
use App\Events\SaleCreated;
use App\Events\StockLowAlert;
use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Listeners\InvalidateSlaCache;
use App\Listeners\NotifyAdminTicketCreated;
use App\Listeners\NotifyPayrollGenerated;
use App\Listeners\NotifyTicketAssignee;
use App\Listeners\RecordPayrollJournal;
use App\Listeners\SendLowStockAlert;
use App\Listeners\SendProductionNotification;
use App\Listeners\SendPurchaseNotification;
use App\Listeners\SendSaleNotification;
use App\Listeners\TicketNotificationListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * EventServiceProvider — MERGED
 * أضاف: CompanySettingsUpdated → InvalidateSlaCache
 */
class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        SaleCreated::class => [
            SendSaleNotification::class,
        ],
        PurchaseConfirmed::class => [
            SendPurchaseNotification::class,
        ],
        ProductionCompleted::class => [
            SendProductionNotification::class,
        ],
        PayrollPaid::class => [
            RecordPayrollJournal::class,
        ],
        StockLowAlert::class => [
            SendLowStockAlert::class,
        ],
        TicketAssigned::class => [
            NotifyTicketAssignee::class,
            TicketNotificationListener::class,  // إيميل للعميل عند التعيين
        ],
        TicketCreated::class => [
            NotifyAdminTicketCreated::class,
            TicketNotificationListener::class,  // إيميل للعميل عند فتح التذكرة
        ],
        PayrollGenerated::class => [
            NotifyPayrollGenerated::class,
        ],
        // ← جديد: لما يتغير إعدادات الشركة، امسح cache الـ SLA
        CompanySettingsUpdated::class => [
            InvalidateSlaCache::class,
        ],
    ];

    protected $subscribe = [];

    public function boot(): void {}

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
