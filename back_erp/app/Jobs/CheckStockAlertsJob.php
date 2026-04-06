<?php

namespace App\Jobs;

use App\Services\InventoryService;
use App\Services\NotificationService;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * CheckStockAlertsJob — يفحص المخزون المنخفض لكل الشركات
 * يُشغَّل يومياً عبر الـ scheduler
 */
class CheckStockAlertsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 300;

    public function handle(InventoryService $inventory, NotificationService $notifications): void
    {
        $companies = Company::where('status', 'active')->pluck('id');

        foreach ($companies as $companyId) {
            $lowStock = $inventory->getLowStockProducts($companyId);

            if ($lowStock->isNotEmpty()) {
                $notifications->broadcastToCompany(
                    companyId: $companyId,
                    title: 'تنبيه: منتجات بمخزون منخفض',
                    body: "يوجد {$lowStock->count()} منتج بمخزون أقل من الحد الأدنى.",
                    type: 'warning'
                );
            }
        }
    }
}
