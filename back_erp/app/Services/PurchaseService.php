<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\TaxRate;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    private function calcTax(float $subtotal, array $data): float
    {
        if (!empty($data['tax_rate_id'])) {
            $taxRate = TaxRate::find($data['tax_rate_id']);
            if ($taxRate) {
                return round($subtotal * $taxRate->rate / 100, 2);
            }
        }
        return (float) ($data['tax'] ?? 0);
    }

    public function createPurchase(array $data, ?int $companyId): Purchase
    {
        return DB::transaction(function () use ($data, $companyId) {
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            $tax   = $this->calcTax($subtotal, $data);
            $total = $subtotal + $tax;

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

                        if ($qtyBefore + $item['quantity'] > 0) {
                            $newCost = ($product->cost * $qtyBefore + $item['unit_price'] * $item['quantity'])
                                     / ($qtyBefore + $item['quantity']);
                            $product->update(['cost' => $newCost]);
                        }

                        StockMovement::create([
                            'company_id'     => $companyId,
                            'product_id'     => $item['product_id'],
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
            }

            return $purchase->load('items.product', 'supplier', 'user');
        });
    }

    public function updatePurchase(Purchase $purchase, array $data): Purchase
    {
        return DB::transaction(function () use ($purchase, $data) {

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
                            'notes'          => "تعديل أمر شراء {$purchase->po_number}",
                        ]);
                    }
                }
            }

            $purchase->items()->delete();

            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            $tax   = $this->calcTax($subtotal, $data);
            $total = $subtotal + $tax;

       $purchase->update([
    'supplier_id' => $data['supplier_id'],
    'subtotal'    => $subtotal,
    'tax'         => $tax,
    'total'       => $total,
    'status'      => $data['status'] ?? $purchase->status,
    'notes'       => $data['notes'] ?? null,
    'expected_at' => $data['expected_at'] ?? null,
]);

// ← أضف السطرين دول
\Log::info('DEBUG', [
    'purchase_id' => $purchase->id,
    'in_db'       => \DB::table('purchases')->where('id', $purchase->id)->first(),
]);

$purchase = Purchase::withoutGlobalScopes()->find($purchase->id);

if (!$purchase) {
    throw new \Exception('Purchase not found after update');
}

            foreach ($data['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['product_id'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total'       => $item['quantity'] * $item['unit_price'],
                ]);

                if (($data['status'] ?? '') === 'received') {
                    $product = Product::withoutGlobalScopes()->find($item['product_id']);
                    if ($product) {
                        $qtyBefore = $product->qty;
                        $product->increment('qty', $item['quantity']);

                        if ($qtyBefore + $item['quantity'] > 0) {
                            $newCost = ($product->cost * $qtyBefore + $item['unit_price'] * $item['quantity'])
                                     / ($qtyBefore + $item['quantity']);
                            $product->update(['cost' => $newCost]);
                        }

                        StockMovement::create([
                            'company_id'     => $purchase->company_id,
                            'product_id'     => $item['product_id'],
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
            }

            return $purchase->load('items.product', 'supplier', 'user');
        });
    }

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