<?php
namespace App\Observers;
use App\Models\Product;
use App\Services\NotificationService;

class ProductObserver
{
    public function updated(Product $product): void
    {
        // إشعار لما المخزون ينزل تحت الحد الأدنى
        if ($product->isDirty('qty') && $product->qty <= $product->min_qty && $product->qty >= 0) {
            NotificationService::sendToRole(
                $product->company_id,
                'store-manager',
                'low_stock',
                'تحذير: مخزون منخفض',
                "المنتج ({$product->name}) وصل لـ {$product->qty} {$product->unit} — الحد الأدنى: {$product->min_qty}",
                ['product_id' => $product->id],
                '/inventory'
            );
        }
    }
}
