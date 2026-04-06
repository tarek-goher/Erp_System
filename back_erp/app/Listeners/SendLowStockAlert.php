<?php

namespace App\Listeners;

use App\Events\StockLowAlert;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * SendLowStockAlert — تنبيه مخزون منخفض
 */
class SendLowStockAlert implements ShouldQueue
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(StockLowAlert $event): void
    {
        $product = $event->product;

        $this->notifications->broadcastToCompany(
            companyId: $product->company_id,
            title: 'تنبيه: مخزون منخفض',
            body: "المنتج \"{$product->name}\" وصل للحد الأدنى. المتاح: {$product->qty} {$product->unit}",
            type: 'warning'
        );
    }
}
