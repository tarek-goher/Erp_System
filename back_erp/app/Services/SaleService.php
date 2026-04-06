<?php

namespace App\Services;

use App\Events\SaleCreated;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

/**
 * SaleService — business logic للمبيعات
 *
 * Fix #5: qty_before وqty_after في StockMovement كانت غلط.
 *  - في createSale: qty_after = $product->fresh()->qty كان بيعمل N+1 query لكل منتج.
 *    الحل: نحسب qty_after = qtyBefore - qty مباشرةً من القيم المعروفة.
 *  - في deleteSale: qty_before = $product->qty - $item->quantity كان بيحسب qty_before
 *    من القيمة بعد الـ increment مش قبله، فالنتيجة qty_before = qty_after دايماً.
 *    الحل: نحفظ $qtyBefore قبل increment، ثم qty_after = $product->qty.
 */
class SaleService
{
    /**
     * إنشاء فاتورة مبيعات مع خصم المخزون تلقائياً
     */
    public function createSale(array $data, ?int $companyId): Sale
    {
        return DB::transaction(function () use ($data, $companyId) {
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += ($item['qty'] ?? $item['quantity']) * ($item['unit_price'] ?? $item['price']);
            }

            $tax      = $data['tax']      ?? 0;
            $discount = $data['discount'] ?? 0;
            $total    = $subtotal + $tax - $discount;

            $sale = Sale::create([
                'company_id'     => $companyId,
                'customer_id'    => $data['customer_id'],
                'user_id'        => auth()->id(),
                'subtotal'       => $subtotal,
                'tax'            => $tax,
                'discount'       => $discount,
                'total'          => $total,
                'status'         => $data['status'] ?? 'completed',
                'payment_method' => $data['payment_method'] ?? 'cash',
                'notes'          => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $qty = $item['qty'] ?? $item['quantity'];
                $unitPrice = $item['unit_price'] ?? $item['price'];

                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $qty,
                    'unit_price' => $unitPrice,
                    'total'      => $qty * $unitPrice,
                ]);

                $product = Product::withoutGlobalScopes()->find($item['product_id']);
                if ($product) {
                    $qtyBefore = $product->qty;
                    $product->decrement('qty', $qty);

                    StockMovement::create([
                        'company_id'     => $companyId,
                        'product_id'     => $item['product_id'],
                        'user_id'        => auth()->id(),
                        'type'           => 'out',
                        'qty'            => $qty,
                        'qty_before'     => $qtyBefore,
                        // Fix #5a: بدل fresh()->qty نحسب مباشرة (بدون N+1 query)
                        'qty_after'      => $qtyBefore - $qty,
                        'reference_type' => Sale::class,
                        'reference_id'   => $sale->id,
                        'notes'          => "فاتورة {$sale->invoice_number}",
                    ]);
                }
            }

            SaleCreated::dispatch($sale);

            \Illuminate\Support\Facades\Cache::forget("dashboard:summary:{$companyId}");

            return $sale->load('items.product', 'customer', 'user');
        });
    }

    /**
     * تعديل metadata الفاتورة
     */
    public function updateSale(Sale $sale, array $data): Sale
    {
        return DB::transaction(function () use ($sale, $data) {
            if (isset($data['discount'])) {
                $data['total'] = $sale->subtotal + $sale->tax - $data['discount'];
            }

            $sale->update($data);

            return $sale->fresh()->load('items.product', 'customer', 'user');
        });
    }

    /**
     * حذف فاتورة مع إرجاع المخزون
     *
     * Fix #5b: كان qty_before = $product->qty - $item->quantity بعد الـ increment
     *           يعني qty_before = qty_after دايماً (فرق صفر في الـ audit trail).
     *           الحل: نحفظ $qtyBefore قبل increment، ثم نحسب qty_after منه.
     */
    public function deleteSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {
            foreach ($sale->items as $item) {
                $product = Product::withoutGlobalScopes()->find($item->product_id);
                if ($product) {
                    // Fix #5b: نحفظ القيمة قبل الـ increment
                    $qtyBefore = $product->qty;
                    $product->increment('qty', $item->quantity);

                    StockMovement::create([
                        'company_id'     => $sale->company_id,
                        'product_id'     => $item->product_id,
                        'user_id'        => auth()->id(),
                        'type'           => 'in',
                        'qty'            => $item->quantity,
                        // Fix: الآن qty_before صح (قبل الـ increment)
                        'qty_before'     => $qtyBefore,
                        // Fix: qty_after = qty_before + qty المُرتجع
                        'qty_after'      => $qtyBefore + $item->quantity,
                        'reference_type' => Sale::class,
                        'reference_id'   => $sale->id,
                        'notes'          => "إرجاع فاتورة {$sale->invoice_number}",
                    ]);
                }
            }
            $sale->items()->delete();
            $sale->delete();
        });
    }

    /**
     * إحصائيات المبيعات للـ dashboard
     */
    public function getStats(?int $companyId): array
    {
        $today     = now()->toDateString();
        $thisMonth = now()->startOfMonth()->toDateString();

        return [
            'today_revenue' => Sale::where('company_id', $companyId)
                ->whereDate('created_at', $today)
                ->where('status', 'completed')
                ->sum('total'),

            'month_revenue' => Sale::where('company_id', $companyId)
                ->whereDate('created_at', '>=', $thisMonth)
                ->where('status', 'completed')
                ->sum('total'),

            'today_count'   => Sale::where('company_id', $companyId)
                ->whereDate('created_at', $today)
                ->count(),

            'month_count'   => Sale::where('company_id', $companyId)
                ->whereDate('created_at', '>=', $thisMonth)
                ->count(),

            'pending_count' => Sale::where('company_id', $companyId)
                ->where('status', 'pending')
                ->count(),
        ];
    }
}
