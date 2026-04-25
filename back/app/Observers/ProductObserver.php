<?php
namespace App\Observers;
use App\Models\Product;

class ProductObserver
{
    public function updated(Product $product): void
    {
        if ($product->isDirty('qty') && $product->qty <= $product->min_qty && $product->qty >= 0) {
            // TODO: fix NotificationService::sendToRole
            \Log::info("Low stock alert: {$product->name} qty={$product->qty} min={$product->min_qty}");
        }
    }
}