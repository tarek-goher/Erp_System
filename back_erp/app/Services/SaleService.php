<?php

namespace App\Services;

use App\Events\SaleCreated;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\TaxRate;
use Illuminate\Support\Facades\DB;

/**
 * SaleService — business logic للمبيعات
 *
 * التصليحات المضافة:
 *  - Fix #1: discount كان بيتعامل معاه كقيمة، والفرونت بيبعت نسبة مئوية.
 *            الحل: تحويل النسبة لقيمة داخل السيرفس.
 *  - Fix #2: tax كان بيتوقع قيمة مباشرة، والفرونت بيبعت tax_rate_id.
 *            الحل: جلب الـ rate من TaxRate وحساب القيمة.
 *  - Fix #3: due_date و tax_rate_id لم يكونا محفوظين في Sale::create.
 *  - Fix #4: SaleItem لم يكن بيحفظ discount و warehouse_id.
 *  - Fix #5: qty_before/qty_after في StockMovement (موجود من قبل).
 *  - Fix #6: getStats() كانت بترجع fields مختلفة عن اللي الفرونت بيتوقعها.
 */
class SaleService
{
    // ══════════════════════════════════════════════════════════
    // إنشاء فاتورة مبيعات
    // ══════════════════════════════════════════════════════════
    public function createSale(array $data, ?int $companyId): Sale
    {
        return DB::transaction(function () use ($data, $companyId) {

            // ── 1. حساب الـ subtotal من الأصناف ──────────────
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $qty       = (float) ($item['qty']        ?? $item['quantity']  ?? 0);
                $unitPrice = (float) ($item['unit_price'] ?? $item['price']     ?? 0);

                // Fix #1: discount على مستوى السطر (نسبة مئوية → قيمة)
                $lineDiscountPercent = (float) ($item['discount'] ?? 0);
                $lineTotal           = $qty * $unitPrice;
                $lineDiscountAmount  = ($lineTotal * $lineDiscountPercent) / 100;

                $subtotal += $lineTotal - $lineDiscountAmount;
            }

            // ── 2. خصم على مستوى الفاتورة (نسبة مئوية → قيمة) ─
            // Fix #1: الفرونت بيبعت نسبة مئوية (مثلاً 10 يعني 10%)
            $invoiceDiscountPercent = (float) ($data['discount'] ?? 0);
            $invoiceDiscountAmount  = ($subtotal * $invoiceDiscountPercent) / 100;
            $afterDiscount          = $subtotal - $invoiceDiscountAmount;

            // ── 3. حساب الضريبة من tax_rate_id ───────────────
            // Fix #2: الفرونت بيبعت tax_rate_id مش قيمة الضريبة
            $taxAmount  = 0;
            $taxRateId  = $data['tax_rate_id'] ?? null;
            if ($taxRateId) {
                $taxRate   = TaxRate::find($taxRateId);
                $taxAmount = $taxRate ? ($afterDiscount * $taxRate->rate) / 100 : 0;
            }

            $total = $afterDiscount + $taxAmount;

            // ── 4. إنشاء الفاتورة ─────────────────────────────
            $sale = Sale::create([
                'company_id'     => $companyId,
                'customer_id'    => $data['customer_id'],
                'user_id'        => auth()->id(),
                'subtotal'       => round($subtotal, 2),
                'tax'            => round($taxAmount, 2),
                // Fix #3: نحفظ القيمة (مش النسبة) في الـ DB
                'discount'       => round($invoiceDiscountAmount, 2),
                'total'          => round($total, 2),
                'status'         => $data['status']         ?? 'draft',
                'payment_method' => $data['payment_method'] ?? 'cash',
                'notes'          => $data['notes']          ?? null,
                // Fix #3: حقول جديدة
                'tax_rate_id'    => $taxRateId,
                'due_date'       => $data['due_date']       ?? null,
            ]);

            // ── 5. إنشاء أصناف الفاتورة + خصم المخزون ────────
            foreach ($data['items'] as $item) {
                $qty       = (float) ($item['qty']        ?? $item['quantity'] ?? 0);
                $unitPrice = (float) ($item['unit_price'] ?? $item['price']    ?? 0);

                // Fix #4: discount على مستوى السطر (نسبة → قيمة)
                $lineDiscountPercent = (float) ($item['discount'] ?? 0);
                $lineTotal           = $qty * $unitPrice;
                $lineDiscountAmount  = ($lineTotal * $lineDiscountPercent) / 100;
                $lineFinalTotal      = $lineTotal - $lineDiscountAmount;

                // Fix #4: حفظ warehouse_id و discount في SaleItem
                SaleItem::create([
                    'sale_id'      => $sale->id,
                    'product_id'   => $item['product_id'],
                    'warehouse_id' => $item['warehouse_id'] ?? null,
                    'quantity'     => $qty,
                    'unit_price'   => $unitPrice,
                    // نحفظ قيمة الخصم (مش النسبة) في الـ DB
                    'discount'     => round($lineDiscountAmount, 2),
                    'total'        => round($lineFinalTotal, 2),
                ]);

                // ── خصم المخزون ───────────────────────────────
                $product = Product::withoutGlobalScopes()->find($item['product_id']);
                if ($product) {
                    $warehouseId = $item['warehouse_id'] ?? $product->warehouse_id ?? null;
                    $qtyBefore   = (float) $product->qty;

                    if ($warehouseId) {
                        $location = \App\Models\ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $item['product_id'],
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $companyId,
                            ],
                            ['qty' => 0]
                        );
                  if ($location->qty < $qty) {
    throw new \App\Exceptions\InsufficientStockException($location->qty, $qty);
}
                        $location->decrement('qty', $qty);
                    }

                    $product->decrement('qty', $qty);

                    StockMovement::create([
                        'company_id'     => $companyId,
                        'product_id'     => $item['product_id'],
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'out',
                        'qty'            => $qty,
                        'qty_before'     => $qtyBefore,
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

    // ══════════════════════════════════════════════════════════
    // تعديل metadata الفاتورة (status / notes / payment_method)
    // ══════════════════════════════════════════════════════════
    public function updateSale(Sale $sale, array $data): Sale
    {
        return DB::transaction(function () use ($sale, $data) {
            // لو الـ status اتغير لـ confirmed → خصم المخزون لو لسه draft
            // (في حالة الـ workflow: draft → confirmed → completed)
            // الـ stock خصم وقت الإنشاء بغض النظر عن الـ status

            $sale->update($data);

            return $sale->fresh()->load('items.product', 'customer', 'user');
        });
    }

    // ══════════════════════════════════════════════════════════
    // حذف فاتورة مع إرجاع المخزون
    // ══════════════════════════════════════════════════════════
    public function deleteSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {
            foreach ($sale->items as $item) {
                $product = Product::withoutGlobalScopes()->find($item->product_id);
                if ($product) {
                    $qtyBefore   = (float) $product->qty;
                    $warehouseId = $item->warehouse_id ?? $product->warehouse_id ?? null;

                    if ($warehouseId) {
                        $location = \App\Models\ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $item->product_id,
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $sale->company_id,
                            ],
                            ['qty' => 0]
                        );
                        $location->increment('qty', $item->quantity);
                    }

                    $product->increment('qty', $item->quantity);

                    StockMovement::create([
                        'company_id'     => $sale->company_id,
                        'product_id'     => $item->product_id,
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'in',
                        'qty'            => $item->quantity,
                        'qty_before'     => $qtyBefore,
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

    // ══════════════════════════════════════════════════════════
    // إحصائيات المبيعات
    // Fix #6: الـ fields اتغيرت عشان تتوافق مع الفرونت
    // ══════════════════════════════════════════════════════════
   public function getStats(?int $companyId): array
{
    $base = Sale::withoutGlobalScopes()
        ->where('company_id', $companyId)
        ->whereNull('deleted_at');

    $totalAmount = (clone $base)
        ->whereNotIn('status', ['cancelled', 'refunded'])
        ->sum('total');

    $paidAmount = (clone $base)
        ->whereIn('status', ['completed', 'paid'])
        ->sum('total');

    return [
        'total_sales'   => (clone $base)->count(),
        'total_amount'  => (float) $totalAmount,
        'paid_amount'   => (float) $paidAmount,
        'unpaid_amount' => (float) max(0, $totalAmount - $paidAmount),

        'today_revenue' => (float) (clone $base)
            ->whereDate('created_at', now()->toDateString())
            ->where('status', 'completed')
            ->sum('total'),

        'month_revenue' => (float) (clone $base)
            ->whereDate('created_at', '>=', now()->startOfMonth()->toDateString())
            ->where('status', 'completed')
            ->sum('total'),

        'pending_count' => (clone $base)->where('status', 'pending')->count(),
        'draft_count'   => (clone $base)->where('status', 'draft')->count(),
    ];
}
}