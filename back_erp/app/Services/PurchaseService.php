<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

/**
 * PurchaseService — business logic للمشتريات وتحديث المخزون
 *
 * Fix #3: Race Condition في رقم PO
 *  - كان Purchase::count() + 1 بيجيب عدد كل الـ purchases في كل الشركات
 *    بدون فلترة على company_id أو lockForUpdate.
 *  - الحل: فلترة على company_id + lockForUpdate() داخل transaction
 *    عشان كل شركة عندها تسلسل خاص ومفيش تضارب في الـ concurrent requests.
 */
class PurchaseService
{
    /**
     * إنشاء أمر شراء مع إضافة المخزون تلقائياً
     */
    public function createPurchase(array $data, ?int $companyId): Purchase
    {
        return DB::transaction(function () use ($data, $companyId) {
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            $tax   = $data['tax']   ?? 0;
            $total = $subtotal + $tax;

            // Fix #3: توليد PO number آمن بدون race condition
            // - withoutGlobalScopes() لتجنب تدخل BelongsToCompany scope
            // - where('company_id') لعزل كل شركة بتسلسلها الخاص
            // - lockForUpdate() لمنع قراءة نفس الـ count في concurrent requests
            if (!isset($data['po_number'])) {
                $count = Purchase::withoutGlobalScopes()
                    ->withTrashed()
                    ->where('company_id', $companyId)
                    ->lockForUpdate()
                    ->count();

                $data['po_number'] = 'PO-' . now()->format('Ymd') . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
            }

            $purchase = Purchase::create([
                'company_id'  => $companyId,
                'supplier_id' => $data['supplier_id'],
                'user_id'     => auth()->id(),
                'subtotal'    => $subtotal,
                'tax'         => $tax,
                'total'       => $total,
                'status'      => $data['status'] ?? 'pending',
                'po_number'   => $data['po_number'],
                'notes'       => $data['notes'] ?? null,
                'expected_at' => $data['expected_at'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['product_id'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total'       => $item['quantity'] * $item['unit_price'],
                ]);

                if (($data['status'] ?? 'pending') === 'received') {
                    $product = Product::withoutGlobalScopes()->find($item['product_id']);
                    if ($product) {
                        $qtyBefore = $product->qty;
                        $product->increment('qty', $item['quantity']);

                        $newCost = ($product->cost * $qtyBefore + $item['unit_price'] * $item['quantity'])
                                 / ($qtyBefore + $item['quantity']);
                        $product->update(['cost' => $newCost]);

                        StockMovement::create([
                            'company_id'     => $companyId,
                            'product_id'     => $item['product_id'],
                            'user_id'        => auth()->id(),
                            'type'           => 'in',
                            'qty'            => $item['quantity'],
                            'qty_before'     => $qtyBefore,
                            // Fix: بدل fresh() نحسب مباشرة من القيم المعروفة
                            'qty_after'      => $qtyBefore + $item['quantity'],
                            'reference_type' => Purchase::class,
                            'reference_id'   => $purchase->id,
                        ]);
                    }
                }
            }

            return $purchase->load('items.product', 'supplier', 'user');
        });
    }

    /**
     * حذف أمر شراء مع إرجاع المخزون إذا كان مستلماً
     */
    public function deletePurchase(Purchase $purchase): void
    {
        DB::transaction(function () use ($purchase) {
            if ($purchase->status === 'received') {
                foreach ($purchase->items as $item) {
                    $product = Product::withoutGlobalScopes()->find($item->product_id);
                    if ($product) {
                        $qtyBefore = $product->qty;
                        $product->decrement('qty', $item->quantity);
                        StockMovement::create([
                            'company_id'     => $purchase->company_id,
                            'product_id'     => $item->product_id,
                            'user_id'        => auth()->id(),
                            'type'           => 'out',
                            'qty'            => $item->quantity,
                            'qty_before'     => $qtyBefore,
                            'qty_after'      => $qtyBefore - $item->quantity,
                            'reference_type' => Purchase::class,
                            'reference_id'   => $purchase->id,
                            'notes'          => "إلغاء أمر شراء {$purchase->po_number}",
                        ]);
                    }
                }
            }
            $purchase->items()->delete();
            $purchase->delete();
        });
    }
}
