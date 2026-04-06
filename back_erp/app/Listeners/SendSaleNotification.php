<?php

namespace App\Listeners;

use App\Events\SaleCreated;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * SendSaleNotification — يُرسل إشعار داخلي بعد كل فاتورة
 * ShouldQueue = يشتغل في الـ background queue
 */
class SendSaleNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(SaleCreated $event): void
    {
        $sale = $event->sale;

        // إشعار لمالك الشركة أو المدير
        $this->notifications->broadcastToCompany(
            companyId: $sale->company_id,
            title: 'فاتورة مبيعات جديدة',
            body: "تم إنشاء فاتورة {$sale->invoice_number} بقيمة " . number_format($sale->total, 2) . ' ج.م',
            type: 'success'
        );
    }
}
