<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
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

                    // لا نضيف المخزون هنا - سيتم إضافته عند قبول المرتجع (acceptReturn)
                    // هذا فقط تسجيل المرتجع في حالة pending

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
                        $location->increment('qty', $item->quantity);
                    }

                    $product->increment('qty', $item->quantity);

                    StockMovement::create([
                        'company_id'     => $return->company_id,
                        'product_id'     => $item->product_id,
                        'warehouse_id'   => $warehouseId ?? null,
                        'user_id'        => auth()->id(),
                        'type'           => 'in',
                        'qty'            => $item->quantity,
                        'qty_before'     => $qtyBefore,
                        'qty_after'      => $qtyBefore + $item->quantity,
                        'reference_type' => SaleReturn::class,
                        'reference_id'   => $return->id,
                        'notes'          => "قبول مرتجع - إضافة للمخزون",
                    ]);
                }
            }

            $return->update(['status' => 'accepted']);
            
            // تسجيل القيد المحاسبي: إيرادات المبيعات (عكسي) - المدينون
            $this->recordReturnJournal($return);
            
            return $return;
        });
    }

    /**
     * تسجيل القيد المحاسبي للمرتجع
     * مدين: إيرادات المبيعات (عكسي - 4001)
     * دائن: المدينون (1103)
     */
    private function recordReturnJournal(SaleReturn $return): void
    {
        try {
            $revenueAccount = Account::where('company_id', $return->company_id)
                ->where('account_type', 'revenue')
                ->where('code', '4001')
                ->first();

            $arAccount = Account::where('company_id', $return->company_id)
                ->where('account_type', 'receivable')
                ->first();

            if (!$revenueAccount || !$arAccount) {
                return;
            }

            $journalEntry = JournalEntry::create([
                'company_id'     => $return->company_id,
                'ref'            => JournalEntry::generateRef(),
                'date'           => now()->toDateString(),
                'description'    => "مرتجع من المبيعات - الفاتورة #{$return->sale_id}",
                'status'         => 'posted',
                'type'           => 'auto',
                'reference_type' => 'SaleReturn',
                'reference_id'   => $return->id,
                'user_id'        => auth()->id() ?? 1,
            ]);

            // مدين: إيرادات المبيعات (عكسي)
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $revenueAccount->id,
                'debit'            => $return->total_amount,
                'credit'           => 0,
                'description'      => "استرجاع إيراد المبيعات",
            ]);

            // دائن: المدينون
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $arAccount->id,
                'debit'            => 0,
                'credit'           => $return->total_amount,
                'description'      => "استرجاع من العميل",
            ]);
        } catch (\Exception $e) {
            \Log::error('Return Journal Error: ' . $e->getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════
    // رفض المرتجع — بدون تعديل مخزون
    // ══════════════════════════════════════════════════════════
    public function rejectReturn(SaleReturn $return): void
    {
        DB::transaction(function () use ($return) {
            // ✅ FIX: لا نعدّل المخزون — المرتجع لم يُضف للمخزون أصلاً في createSaleReturn()
            // فقط نغيّر الحالة لـ rejected
            
            $return->update(['status' => 'rejected']);
        });
    }
}
