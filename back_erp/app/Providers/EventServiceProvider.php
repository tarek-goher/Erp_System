<?php

namespace App\Providers;

use App\Events\PayrollGenerated;
use App\Events\SaleCreated;
use App\Events\StockLowAlert;
use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Listeners\NotifyTicketAssignee;
use App\Listeners\SendLowStockAlert;
use App\Listeners\SendSaleNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * EventServiceProvider — ربط Events بـ Listeners
 *
 * كل Listener بيشتغل في الـ background queue (ShouldQueue)
 * يعني العمليات الثقيلة (إرسال إشعارات، emails) مش بتبطئ الـ request
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

        // عند إنشاء تذكرة جديدة → إشعار المدير
        TicketCreated::class => [
            // يمكن إضافة Listener هنا لإشعار المدير
        ],

        // عند توليد رواتب → يمكن إضافة Listener للـ email
        PayrollGenerated::class => [
            // يمكن إضافة Listener هنا
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
