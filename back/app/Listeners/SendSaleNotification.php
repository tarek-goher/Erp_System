<?php

namespace App\Listeners;

use App\Events\SaleCreated;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\ProductLocation;
use App\Models\StockMovement;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * SendSaleNotification — يُرسل إشعار داخلي بعد كل فاتورة
 * + ينشئ القيد المحاسبي تلقائياً
 * + يتحديث المخزون والحركات
 *
 * ✅ FIX #1: account_type → type
 * ✅ FIX #2: الإشعار في try/catch عشان لو فشل ميوقفش القيد
 * ✅ FIX #3: لو الحسابات مش موجودة بينشئها تلقائياً بدل return
 */
class SendSaleNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(SaleCreated $event): void
    {
        $sale = $event->sale;

        // ✅ FIX #2: عزل الإشعار — لو فشل ميوقفش القيد المحاسبي
        try {
            $this->notifications->broadcastToCompany(
                companyId: $sale->company_id,
                title: 'فاتورة مبيعات جديدة',
                body: "تم إنشاء فاتورة {$sale->invoice_number} بقيمة " . number_format($sale->total, 2) . ' ج.م',
                type: 'success'
            );
        } catch (\Exception $e) {
            \Log::warning('Sale Notification failed: ' . $e->getMessage());
        }

        // القيد المحاسبي
        $this->recordSaleJournal($sale);

        // تحديث المخزون
        $this->updateInventory($sale);
    }

    /**
     * تسجيل القيد المحاسبي للمبيعات
     * مدين: المدينون (1103)
     * دائن: إيرادات المبيعات (4001)
     */
    private function recordSaleJournal($sale): void
    {
        try {
            // ✅ FIX #1: استخدم 'type' بدلاً من 'account_type'
            $revenueAccount = Account::where('company_id', $sale->company_id)
                ->where('type', 'revenue')
                ->where('code', '4001')
                ->first();

            $arAccount = Account::where('company_id', $sale->company_id)
                ->where('type', 'asset')
                ->where('code', '1103')
                ->first();

            // ✅ FIX #3: لو مش موجودة، أنشئها تلقائياً بدل return
            if (!$revenueAccount) {
                $revenueAccount = Account::create([
                    'company_id'     => $sale->company_id,
                    'code'           => '4001',
                    'name'           => 'إيرادات المبيعات',
                    'name_en'        => 'Sales Revenue',
                    'type'           => 'revenue',
                    'normal_balance' => 'credit',
                    'is_active'      => true,
                ]);
            }

            if (!$arAccount) {
                $arAccount = Account::create([
                    'company_id'     => $sale->company_id,
                    'code'           => '1103',
                    'name'           => 'المدينون',
                    'name_en'        => 'Accounts Receivable',
                    'type'           => 'asset',
                    'normal_balance' => 'debit',
                    'is_active'      => true,
                ]);
            }

            // أنشئ القيد المحاسبي
            $journalEntry = JournalEntry::create([
                'company_id'     => $sale->company_id,
                'ref'            => JournalEntry::generateRef(),
                'date'           => $sale->date ?? now()->toDateString(),
                'description'    => "فاتورة مبيعات {$sale->invoice_number}",
                'status'         => 'posted',
                'type'           => 'auto',
                'reference_type' => 'Sale',
                'reference_id'   => $sale->id,
                'user_id'        => $sale->user_id ?? 1,
            ]);

            // مدين: المدينون
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $arAccount->id,
                'debit'            => $sale->total,
                'credit'           => 0,
                'description'      => "فاتورة مبيعات {$sale->invoice_number}",
            ]);

            // دائن: إيرادات المبيعات
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $revenueAccount->id,
                'debit'            => 0,
                'credit'           => $sale->total,
                'description'      => "إيراد فاتورة {$sale->invoice_number}",
            ]);

        } catch (\Exception $e) {
            \Log::error('Sale Journal Error: ' . $e->getMessage(), [
                'sale_id' => $sale->id,
                'error'   => $e,
            ]);
        }
    }

    /**
     * تحديث المخزون والحركات عند إنشاء فاتورة مبيعات
     */
    private function updateInventory($sale): void
    {
        try {
            if (!$sale->items) {
                return;
            }

            foreach ($sale->items as $item) {
                $product = $item->product;
                if (!$product) continue;

                $qtyBefore   = (float) $product->qty;
                $qty         = (float) $item->quantity;
                $warehouseId = $product->warehouse_id ?? null;

                // تقليل المخزون الرئيسي
                $product->decrement('qty', $qty);

                // تقليل مخزون المستودع إن وجد
                if ($warehouseId) {
                    $location = ProductLocation::firstOrCreate(
                        [
                            'product_id'   => $item->product_id,
                            'warehouse_id' => $warehouseId,
                            'company_id'   => $sale->company_id,
                        ],
                        ['qty' => $product->qty]
                    );
                    $location->decrement('qty', $qty);
                }

                // تسجيل حركة المخزون
                StockMovement::create([
                    'company_id'     => $sale->company_id,
                    'product_id'     => $item->product_id,
                    'warehouse_id'   => $warehouseId ?? null,
                    'user_id'        => $sale->user_id ?? 1,
                    'type'           => 'out',
                    'qty'            => $qty,
                    'qty_before'     => $qtyBefore,
                    'qty_after'      => $qtyBefore - $qty,
                    'reference_type' => 'Sale',
                    'reference_id'   => $sale->id,
                    'notes'          => "مبيعات - فاتورة {$sale->invoice_number}",
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Inventory Update Error: ' . $e->getMessage());
        }
    }
}