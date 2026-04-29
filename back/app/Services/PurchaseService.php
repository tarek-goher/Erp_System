<?php

namespace App\Services;

use App\Events\PurchaseConfirmed;
use App\Models\Product;
use App\Models\ProductLocation;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\SupplierLedger;
use App\Models\TaxRate;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    // ══════════════════════════════════════════════════════════
    // استلام أمر الشراء — تحديث المخزون + تسجيل دين المورد
    // ══════════════════════════════════════════════════════════
    public function receivePurchase(Purchase $purchase): Purchase
    {
        return DB::transaction(function () use ($purchase) {
            foreach ($purchase->items as $item) {
                // ✅ FIX A: where('company_id') بدل withoutGlobalScopes
                $product = Product::where('company_id', $purchase->company_id)
                    ->find($item->product_id);

                // ✅ FIX B: abort بدل if ($product) continue
                abort_unless($product, 422, "المنتج #{$item->product_id} غير موجود");

                $qtyBefore   = (float) $product->qty;
                $warehouseId = $item->warehouse_id ?? $product->warehouse_id ?? null;

                if ($warehouseId) {
                    $location = ProductLocation::firstOrCreate(
                        [
                            'product_id'   => $item->product_id,
                            'warehouse_id' => $warehouseId,
                            'company_id'   => $purchase->company_id,
                        ],
                        ['qty' => 0]
                    );
                    $location->increment('qty', $item->quantity);
                }

                $product->increment('qty', $item->quantity);

                // ✅ تحديث متوسط التكلفة (Weighted Average Cost)
                if ($qtyBefore + $item->quantity > 0) {
                    $newCost = ($product->cost * $qtyBefore + $item->unit_price * $item->quantity)
                             / ($qtyBefore + $item->quantity);
                    $product->update(['cost' => round($newCost, 4)]);
                }

                StockMovement::create([
                    'company_id'     => $purchase->company_id,
                    'product_id'     => $item->product_id,
                    'warehouse_id'   => $warehouseId ?? null,
                    'user_id'        => auth()->id(),
                    'type'           => 'in',
                    'qty'            => $item->quantity,
                    'qty_before'     => $qtyBefore,
                    'qty_after'      => $qtyBefore + $item->quantity,
                    'reference_type' => Purchase::class,
                    'reference_id'   => $purchase->id,
                    'notes'          => "استلام أمر شراء {$purchase->po_number}",
                ]);
            }

           $purchase->update(['status' => 'received']);

// ✅ إنشاء فاتورة شراء تلقائياً عند الاستلام
\App\Models\PurchaseInvoice::create([
    'company_id'   => $purchase->company_id,
    'supplier_id'  => $purchase->supplier_id,
    'purchase_id'  => $purchase->id,
    'invoice_date' => now()->toDateString(),
    'amount'       => $purchase->subtotal,
    'tax'          => $purchase->tax ?? 0,
    'discount'     => $purchase->discount ?? 0,
    'total'        => $purchase->total,
    'status'       => 'draft',
    'reference'    => $purchase->po_number,
    'notes'        => "فاتورة شراء تلقائية - {$purchase->po_number}",
]);

// ✅ FIX C: تسجيل دين المورد تلقائياً في supplier_ledger
$this->recordSupplierDebt($purchase);

// ✅ طلّق الـ Event — الـ Listener بيعمل الـ journal وإشعار
PurchaseConfirmed::dispatch($purchase);

            return $purchase->load('items.product', 'supplier');
        });
    }

    // ══════════════════════════════════════════════════════════
    // إنشاء أمر شراء جديد
    // ══════════════════════════════════════════════════════════
    public function createPurchase(array $data, ?int $companyId): Purchase
    {
        return DB::transaction(function () use ($data, $companyId) {
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            $discountPercent = (float) ($data['discount'] ?? 0);
            $discountAmount  = round($subtotal * $discountPercent / 100, 2);
            $tax             = $this->calcTax($subtotal, $discountAmount, $data);
            $total           = $subtotal - $discountAmount + $tax;

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
                'discount'    => $discountAmount,
                'tax'         => $tax,
                'total'       => $total,
                'status'      => $data['status'] ?? 'pending',
                'po_number'   => $data['po_number'],
                'notes'       => $data['notes']       ?? null,
                'expected_at' => $data['expected_at'] ?? null,
            ]);

            $isReceived = ($data['status'] ?? 'pending') === 'received';

            foreach ($data['items'] as $item) {
                $itemDiscount = (float) ($item['discount'] ?? 0);
                $itemTotal    = ($item['quantity'] * $item['unit_price']) - $itemDiscount;

                PurchaseItem::create([
                    'purchase_id'  => $purchase->id,
                    'product_id'   => $item['product_id'],
                    'warehouse_id' => $item['warehouse_id'] ?? null,
                    'quantity'     => $item['quantity'],
                    'unit_price'   => $item['unit_price'],
                    'discount'     => $itemDiscount,
                    'total'        => $itemTotal,
                ]);

                if ($isReceived) {
                    // ✅ FIX A: where('company_id') بدل withoutGlobalScopes
                    $product = Product::where('company_id', $companyId)->find($item['product_id']);

                    // ✅ FIX B: abort بدل if ($product) continue
                    abort_unless($product, 422, "المنتج #{$item['product_id']} غير موجود");

                    $qtyBefore   = (float) $product->qty;
                    $warehouseId = $item['warehouse_id'] ?? $product->warehouse_id ?? null;

                    if ($warehouseId) {
                        $location = ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $item['product_id'],
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $companyId,
                            ],
                            ['qty' => 0]
                        );
                        $location->increment('qty', $item['quantity']);
                    }

                    $product->increment('qty', $item['quantity']);

                    if ($qtyBefore + $item['quantity'] > 0) {
                        $newCost = ($product->cost * $qtyBefore + $item['unit_price'] * $item['quantity'])
                                 / ($qtyBefore + $item['quantity']);
                        $product->update(['cost' => round($newCost, 4)]);
                    }

                    StockMovement::create([
                        'company_id'     => $companyId,
                        'product_id'     => $item['product_id'],
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'in',
                        'qty'            => $item['quantity'],
                        'qty_before'     => $qtyBefore,
                        'qty_after'      => $qtyBefore + $item['quantity'],
                        'reference_type' => Purchase::class,
                        'reference_id'   => $purchase->id,
                    ]);
                }
            }

        
    // ✅ FIX C: لو الشراء اتسجل مباشرة كـ received → سجّل الدين فوراً
            if ($isReceived) {
                $this->recordSupplierDebt($purchase);
                // ✅ طلّق الـ Event — الـ Listener بيعمل الـ journal وإشعار
                PurchaseConfirmed::dispatch($purchase);
                // ✅ أضف هنا
                \App\Models\PurchaseInvoice::create([
                    'company_id'   => $purchase->company_id,
                    'supplier_id'  => $purchase->supplier_id,
                    'purchase_id'  => $purchase->id,
                    'invoice_date' => now()->toDateString(),
                    'amount'       => $purchase->subtotal,
                    'tax'          => $purchase->tax ?? 0,
                    'discount'     => $purchase->discount ?? 0,
                    'total'        => $purchase->total,
                    'status'       => 'draft',
                    'reference'    => $purchase->po_number,
                    'notes'        => "فاتورة شراء تلقائية - {$purchase->po_number}",
                ]);
            }

      return $purchase->load('items.product', 'items.warehouse', 'supplier', 'user');
        }); // ← ✅ لازم تكون كده
    }

    // ══════════════════════════════════════════════════════════
    // تعديل أمر شراء
    // ══════════════════════════════════════════════════════════
    public function updatePurchase(Purchase $purchase, array $data): Purchase
    {
        return DB::transaction(function () use ($purchase, $data) {
            $wasReceived = $purchase->status === 'received';

            // لو كان مستلماً → اعكس المخزون الأول
            if ($wasReceived) {
                foreach ($purchase->items as $item) {
                    $product = Product::where('company_id', $purchase->company_id)->find($item->product_id);
                    if (!$product) continue; // منتج محذوف — نتجاوز بأمان في الـ update

                    $qtyBefore   = (float) $product->qty;
                    $warehouseId = $item->warehouse_id ?? $product->warehouse_id ?? null;

                    if ($warehouseId) {
                        $location = ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $item->product_id,
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $purchase->company_id,
                            ],
                            ['qty' => 0]
                        );
                        $location->decrement('qty', $item->quantity);
                    }

                    $product->decrement('qty', $item->quantity);

                    StockMovement::create([
                        'company_id'     => $purchase->company_id,
                        'product_id'     => $item->product_id,
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'out',
                        'qty'            => $item->quantity,
                        'qty_before'     => $qtyBefore,
                        'qty_after'      => $qtyBefore - $item->quantity,
                        'reference_type' => Purchase::class,
                        'reference_id'   => $purchase->id,
                        'notes'          => "تعديل أمر شراء {$purchase->po_number}",
                    ]);
                }
            }

            $purchase->items()->delete();

            $subtotal        = collect($data['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);
            $discountPercent = (float) ($data['discount'] ?? 0);
            $discountAmount  = round($subtotal * $discountPercent / 100, 2);
            $tax             = $this->calcTax($subtotal, $discountAmount, $data);
            $total           = $subtotal - $discountAmount + $tax;

            $purchase->update([
                'supplier_id' => $data['supplier_id'],
                'subtotal'    => $subtotal,
                'discount'    => $discountAmount,
                'tax'         => $tax,
                'total'       => $total,
                'status'      => $data['status'] ?? $purchase->status,
                'notes'       => $data['notes']       ?? null,
                'expected_at' => $data['expected_at'] ?? null,
            ]);

            $purchase->refresh();
            $isReceived = ($data['status'] ?? '') === 'received';

            foreach ($data['items'] as $item) {
                $itemDiscount = (float) ($item['discount'] ?? 0);
                $itemTotal    = ($item['quantity'] * $item['unit_price']) - $itemDiscount;

                PurchaseItem::create([
                    'purchase_id'  => $purchase->id,
                    'product_id'   => $item['product_id'],
                    'warehouse_id' => $item['warehouse_id'] ?? null,
                    'quantity'     => $item['quantity'],
                    'unit_price'   => $item['unit_price'],
                    'discount'     => $itemDiscount,
                    'total'        => $itemTotal,
                ]);

                if ($isReceived) {
                    $product = Product::where('company_id', $purchase->company_id)->find($item['product_id']);
                    abort_unless($product, 422, "المنتج #{$item['product_id']} غير موجود");

                    $qtyBefore   = (float) $product->qty;
                    $warehouseId = $item['warehouse_id'] ?? $product->warehouse_id ?? null;

                    if ($warehouseId) {
                        $location = ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $item['product_id'],
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $purchase->company_id,
                            ],
                            ['qty' => 0]
                        );
                        $location->increment('qty', $item['quantity']);
                    }

                    $product->increment('qty', $item['quantity']);

                    if ($qtyBefore + $item['quantity'] > 0) {
                        $newCost = ($product->cost * $qtyBefore + $item['unit_price'] * $item['quantity'])
                                 / ($qtyBefore + $item['quantity']);
                        $product->update(['cost' => round($newCost, 4)]);
                    }

                    StockMovement::create([
                        'company_id'     => $purchase->company_id,
                        'product_id'     => $item['product_id'],
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'in',
                        'qty'            => $item['quantity'],
                        'qty_before'     => $qtyBefore,
                        'qty_after'      => $qtyBefore + $item['quantity'],
                        'reference_type' => Purchase::class,
                        'reference_id'   => $purchase->id,
                    ]);
                }
            }

            // ✅ FIX C: لو التعديل غيّر الحالة لـ received → سجّل الدين
            if (!$wasReceived && $isReceived) {
                $this->recordSupplierDebt($purchase);
                // ✅ طلّق الـ Event — الـ Listener بيعمل الـ journal وإشعار
                PurchaseConfirmed::dispatch($purchase);
            }

            return $purchase->load('items.product', 'items.warehouse', 'supplier', 'user');
        });
    }

    // ══════════════════════════════════════════════════════════
    // حذف أمر شراء مع إرجاع المخزون
    // ══════════════════════════════════════════════════════════
    public function deletePurchase(Purchase $purchase): void
    {
        DB::transaction(function () use ($purchase) {
            if ($purchase->status === 'received') {
                foreach ($purchase->items as $item) {
                    $product = Product::where('company_id', $purchase->company_id)->find($item->product_id);
                    if (!$product) continue; // منتج محذوف — نتجاوز بأمان في الحذف

                    $qtyBefore   = (float) $product->qty;
                    $warehouseId = $item->warehouse_id ?? $product->warehouse_id ?? null;

                    if ($warehouseId) {
                        $location = ProductLocation::firstOrCreate(
                            [
                                'product_id'   => $item->product_id,
                                'warehouse_id' => $warehouseId,
                                'company_id'   => $purchase->company_id,
                            ],
                            ['qty' => 0]
                        );
                        $location->decrement('qty', $item->quantity);
                    }

                    $product->decrement('qty', $item->quantity);

                    StockMovement::create([
                        'company_id'     => $purchase->company_id,
                        'product_id'     => $item->product_id,
                        'warehouse_id'   => $warehouseId ?? null,
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

            $purchase->items()->delete();
            $purchase->delete();
        });
    }

    // ══════════════════════════════════════════════════════════
    // ✅ Helper: تسجيل دين المورد في supplier_ledger تلقائياً
    //
    // بيتاستدعى في 3 حالات:
    //   1. receivePurchase()  — لما الشراء يتستلم
    //   2. createPurchase()   — لو الحالة received من الأول
    //   3. updatePurchase()   — لو التعديل غيّر الحالة لـ received
    // ══════════════════════════════════════════════════════════
    private function recordSupplierDebt(Purchase $purchase): void
    {
        if (!$purchase->supplier_id) return;

        // آخر رصيد للمورد
        $lastBalance = (float) SupplierLedger::where('supplier_id', $purchase->supplier_id)
            ->where('company_id', $purchase->company_id)
            ->latest()
            ->first()
            ?->balance_after ?? 0;

        $newBalance = $lastBalance + (float) $purchase->total;

        SupplierLedger::create([
            'supplier_id'   => $purchase->supplier_id,
            'company_id'    => $purchase->company_id,
            'type'          => 'invoice',
            'direction'     => 'debit',   // مدين = الشركة مدينة للمورد
            'amount'        => $purchase->total,
            'balance_after' => round($newBalance, 2),
            'reference'     => $purchase->po_number,
            'notes'         => "فاتورة شراء {$purchase->po_number}",
            'created_by'    => auth()->id(),
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // Helper: حساب الضريبة
    // ══════════════════════════════════════════════════════════
    private function calcTax(float $subtotal, float $discount, array $data): float
    {
        if (!empty($data['tax_rate_id'])) {
            $taxRate = TaxRate::find($data['tax_rate_id']);
            if ($taxRate) {
                return round(($subtotal - $discount) * $taxRate->rate / 100, 2);
            }
        }
        return (float) ($data['tax'] ?? 0);
    }
 }
    // ══════════════════════════════════════════════════════════