<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\Product;
use App\Models\ProductLocation;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class ReturnService
{
    // ══════════════════════════════════════════════════════════
    // إنشاء مرتجع للمبيعات
    // ══════════════════════════════════════════════════════════
    public function createSaleReturn(array $data, ?int $companyId): SaleReturn
    {
        return DB::transaction(function () use ($data, $companyId) {
            // إنشاء السجل
            $return = SaleReturn::create([
                'company_id'     => $companyId,
                'sale_id'        => $data['sale_id'],
                'user_id'        => auth()->id(),
                'reason'         => $data['reason'] ?? null,
                'notes'          => $data['notes'] ?? null,
                'status'         => 'pending',
                'total_amount'   => 0, // سيتم حسابه
            ]);

            $totalAmount = 0;

            // معالجة كل صنف مرتجع
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $qty       = (float) ($item['qty'] ?? $item['quantity'] ?? 0);
                    $unitPrice = (float) ($item['unit_price'] ?? $item['price'] ?? 0);
                    $lineTotal = $qty * $unitPrice;

                    // حفظ بيان المرتجع
                    $return->items()->create([
                        'product_id'  => $item['product_id'],
                        'quantity'    => $qty,
                        'unit_price'  => $unitPrice,
                        'total'       => $lineTotal,
                    ]);

                    // إضافة المخزون من المرتجع
                    $product = Product::where('company_id', $companyId)
                        ->find($item['product_id']);

                    if ($product) {
                        $qtyBefore   = (float) $product->qty;
                        $warehouseId = $product->warehouse_id ?? null;

                        if ($warehouseId) {
                            $location = ProductLocation::firstOrCreate(
                                [
                                    'product_id'   => $item['product_id'],
                                    'warehouse_id' => $warehouseId,
                                    'company_id'   => $companyId,
                                ],
                                ['qty' => 0]
                            );
                            $location->increment('qty', $qty);
                        }

                        $product->increment('qty', $qty);

                        // تسجيل حركة المخزون
                        StockMovement::create([
                            'company_id'     => $companyId,
                            'product_id'     => $item['product_id'],
                            'warehouse_id'   => $warehouseId ?? null,
                            'user_id'        => auth()->id(),
                            'type'           => 'in', // إضافة
                            'qty'            => $qty,
                            'qty_before'     => $qtyBefore,
                            'qty_after'      => $qtyBefore + $qty,
                            'reference_type' => SaleReturn::class,
                            'reference_id'   => $return->id,
                            'notes'          => "مرتجع من فاتورة #{$data['sale_id']}",
                        ]);
                    }

                    $totalAmount += $lineTotal;
                }
            }

            // تحديث إجمالي المبلغ
            $return->update(['total_amount' => $totalAmount]);

            return $return->load('items.product');
        });
    }

    // ══════════════════════════════════════════════════════════
    // قبول المرتجع (الحالة: accepted)
    // ══════════════════════════════════════════════════════════
    public function acceptReturn(SaleReturn $return): SaleReturn
    {
        return DB::transaction(function () use ($return) {
            $return->update(['status' => 'accepted']);
            return $return;
        });
    }

    // ══════════════════════════════════════════════════════════
    // رفض المرتجع مع إرجاع المخزون
    // ══════════════════════════════════════════════════════════
    public function rejectReturn(SaleReturn $return): void
    {
        DB::transaction(function () use ($return) {
            // إرجاع المخزون
            foreach ($return->items as $item) {
                $product = Product::where('company_id', $return->company_id)
                    ->find($item->product_id);

                if ($product) {
                    $qtyBefore   = (float) $product->qty;
                    $warehouseId = $product->warehouse_id ?? null;

                    if ($warehouseId) {
                        $location = ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $item->product_id,
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $return->company_id,
                            ],
                            ['qty' => 0]
                        );
                        $location->decrement('qty', $item->quantity);
                    }

                    $product->decrement('qty', $item->quantity);

                    StockMovement::create([
                        'company_id'     => $return->company_id,
                        'product_id'     => $item->product_id,
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'out',
                        'qty'            => $item->quantity,
                        'qty_before'     => $qtyBefore,
                        'qty_after'      => $qtyBefore - $item->quantity,
                        'reference_type' => SaleReturn::class,
                        'reference_id'   => $return->id,
                        'notes'          => "رفض مرتجع - إرجاع من المخزون",
                    ]);
                }
            }

            $return->update(['status' => 'rejected']);
        });
    }
}
