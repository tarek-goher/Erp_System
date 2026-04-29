<?php

namespace App\Listeners;

use App\Events\SaleCreated;
use App\Services\NotificationService;

/**
 * SendSaleNotification — يُرسل إشعار داخلي بعد كل فاتورة
 * ملاحظة: كان listener مُعرّف كـ ShouldQueue، وده كان بيحاول يستخدم Redis/Horizon.
 * على بيئات dev اللي مفيهاش PHP Redis extension كان بيكسر إنشاء الفاتورة بـ 500.
 * لذلك بنخليه synchronous (بدون queue) عشان ما يمنعش إنشاء البيع.
 */
class SendSaleNotification
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
