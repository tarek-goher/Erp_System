<?php

namespace App\Services;

use App\Models\Product;
use App\Models\WorkOrder;
use App\Models\BomItem;
use App\Models\StockMovement;
use App\Models\ProductLocation;
use Illuminate\Support\Facades\DB;

class ManufacturingService
{
    // ══════════════════════════════════════════════════════════
    // إتمام أمر الإنتاج — تحديث المخزون
    // ══════════════════════════════════════════════════════════
    public function completeWorkOrder(WorkOrder $workOrder): WorkOrder
    {
        return DB::transaction(function () use ($workOrder) {
            // ── 1. تقليل المخزون من المواد الخام ────────────
            $bomItems = BomItem::where('work_order_id', $workOrder->id)->get();
            
            foreach ($bomItems as $item) {
                $product = Product::where('company_id', $workOrder->company_id)
                    ->find($item->product_id);

                if ($product) {
                    $qtyBefore   = (float) $product->qty;
                    $warehouseId = $product->warehouse_id ?? null;

                    // تقليل المخزون من مستودع المواد الخام
                    if ($warehouseId) {
                        $location = ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $item->product_id,
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $workOrder->company_id,
                            ],
                            ['qty' => 0]
                        );
                        $location->decrement('qty', $item->qty);
                    }

                    $product->decrement('qty', $item->qty);

                    // تسجيل حركة المخزون (استهلاك)
                    StockMovement::create([
                        'company_id'     => $workOrder->company_id,
                        'product_id'     => $item->product_id,
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'out',
                        'qty'            => $item->qty,
                        'qty_before'     => $qtyBefore,
                        'qty_after'      => $qtyBefore - $item->qty,
                        'reference_type' => WorkOrder::class,
                        'reference_id'   => $workOrder->id,
                        'notes'          => "استهلاك مواد خام - أمر إنتاج #{$workOrder->id}",
                    ]);
                }
            }

            // ── 2. إضافة المنتج النهائي للمخزون ────────────
            $finishedProduct = Product::where('company_id', $workOrder->company_id)
                ->find($workOrder->product_id);

            if ($finishedProduct) {
                $qtyBefore   = (float) $finishedProduct->qty;
                $warehouseId = $finishedProduct->warehouse_id ?? null;

                // إضافة المنتج النهائي إلى المستودع
                if ($warehouseId) {
                    $location = ProductLocation::firstOrCreate(
                        [
                            'product_id'   => $workOrder->product_id,
                            'warehouse_id' => $warehouseId,
                            'company_id'   => $workOrder->company_id,
                        ],
                        ['qty' => 0]
                    );
                    $location->increment('qty', $workOrder->qty);
                }

                $finishedProduct->increment('qty', $workOrder->qty);

                // تسجيل حركة المخزون (إضافة)
                StockMovement::create([
                    'company_id'     => $workOrder->company_id,
                    'product_id'     => $workOrder->product_id,
                    'warehouse_id'   => $warehouseId ?? null,
                    'user_id'        => auth()->id(),
                    'type'           => 'in',
                    'qty'            => $workOrder->qty,
                    'qty_before'     => $qtyBefore,
                    'qty_after'      => $qtyBefore + $workOrder->qty,
                    'reference_type' => WorkOrder::class,
                    'reference_id'   => $workOrder->id,
                    'notes'          => "إضافة منتج نهائي - أمر إنتاج #{$workOrder->id}",
                ]);
            }

            // ── 3. تحديث حالة أمر الإنتاج ────────────────
            $workOrder->update(['status' => 'completed']);

            return $workOrder->load('product');
        });
    }

    // ══════════════════════════════════════════════════════════
    // بدء أمر الإنتاج (الحالة: in_progress)
    // ══════════════════════════════════════════════════════════
    public function startWorkOrder(WorkOrder $workOrder): WorkOrder
    {
        return DB::transaction(function () use ($workOrder) {
            $workOrder->update(['status' => 'in_progress']);
            return $workOrder;
        });
    }

    // ══════════════════════════════════════════════════════════
    // إلغاء أمر الإنتاج مع إرجاع المخزون
    // ══════════════════════════════════════════════════════════
    public function cancelWorkOrder(WorkOrder $workOrder): void
    {
        DB::transaction(function () use ($workOrder) {
            if ($workOrder->status === 'completed') {
                // إرجاع المنتج النهائي
                $finishedProduct = Product::where('company_id', $workOrder->company_id)
                    ->find($workOrder->product_id);

                if ($finishedProduct) {
                    $qtyBefore   = (float) $finishedProduct->qty;
                    $warehouseId = $finishedProduct->warehouse_id ?? null;

                    if ($warehouseId) {
                        $location = ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $workOrder->product_id,
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $workOrder->company_id,
                            ],
                            ['qty' => 0]
                        );
                        $location->decrement('qty', $workOrder->qty);
                    }

                    $finishedProduct->decrement('qty', $workOrder->qty);

                    StockMovement::create([
                        'company_id'     => $workOrder->company_id,
                        'product_id'     => $workOrder->product_id,
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'out',
                        'qty'            => $workOrder->qty,
                        'qty_before'     => $qtyBefore,
                        'qty_after'      => $qtyBefore - $workOrder->qty,
                        'reference_type' => WorkOrder::class,
                        'reference_id'   => $workOrder->id,
                        'notes'          => "إلغاء أمر إنتاج - إرجاع منتج نهائي",
                    ]);
                }
            }

            $workOrder->update(['status' => 'cancelled']);
        });
    }
}
