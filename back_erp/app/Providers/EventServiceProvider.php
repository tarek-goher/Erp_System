<?php

namespace App\Providers;

use App\Events\PayrollGenerated;
use App\Events\SaleCreated;
use App\Events\StockLowAlert;
use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Listeners\NotifyAdminTicketCreated;
use App\Listeners\NotifyPayrollGenerated;
use App\Listeners\NotifyTicketAssignee;
use App\Listeners\SendLowStockAlert;
use App\Listeners\SendSaleNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * EventServiceProvider — ربط Events بـ Listeners
 *
 * كل Listener بيشتغل في الـ background queue (ShouldQueue)
 * يعني العمليات الثقيلة (إرسال إشعارات، emails) مش بتبطئ الـ request
 *
 * Fix #3: إضافة Listeners لـ PayrollGenerated وTicketCreated
 * كانوا بدون Listeners — لا يُنتجون أي أثر.
 * الآن كل Event مربوط بـ Listener مناسب.
 */
class EventServiceProvider extends ServiceProvider
{
    /**
     * ربط Events بـ Listeners
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // عند إنشاء فاتورة مبيعات → إرسال إشعار داخلي
        SaleCreated::class => [
            SendSaleNotification::class,
        ],

        // عند إطلاق تحذير مخزون منخفض → إرسال إشعار للمدير
        StockLowAlert::class => [
            SendLowStockAlert::class,
        ],

        // عند تعيين تذكرة لموظف → إشعار الموظف المعين
        TicketAssigned::class => [
            NotifyTicketAssignee::class,
        ],

        // Fix #3a: عند إنشاء تذكرة جديدة → إشعار المديرين في الشركة
        TicketCreated::class => [
            NotifyAdminTicketCreated::class,
        ],

        // Fix #3b: عند اكتمال توليد رواتب شهرية → إشعار مستخدمي الشركة
        PayrollGenerated::class => [
            NotifyPayrollGenerated::class,
        ],
    ];

    /**
     * يسجل الـ Event Subscribers (للـ Modules الكبيرة)
     */
    protected $subscribe = [];

    public function boot(): void
    {
        //
    }

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
