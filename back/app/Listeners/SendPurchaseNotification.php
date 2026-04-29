<?php

namespace App\Listeners;

use App\Events\PurchaseConfirmed;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * SendPurchaseNotification — يُرسل إشعار داخلي بعد تأكيد مشتريات
 * + ينشئ القيد المحاسبي تلقائياً
 * ShouldQueue = يشتغل في الـ background queue
 */
class SendPurchaseNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(PurchaseConfirmed $event): void
    {
        $purchase = $event->purchase;

        // إشعار لمالك الشركة أو المدير
        $this->notifications->broadcastToCompany(
            companyId: $purchase->company_id,
            title: 'فاتورة مشتريات جديدة',
            body: "تم تأكيد فاتورة مشتريات {$purchase->po_number} بقيمة " . number_format($purchase->total, 2) . ' ج.م',
            type: 'info'
        );

        // ثم أنشئ القيد المحاسبي تلقائياً
        $this->recordPurchaseJournal($purchase);
    }

    /**
     * تسجيل القيد المحاسبي للمشتريات
     * مدين: حساب المخزون (1200)
     * دائن: حساب المورد - Accounts Payable (2101)
     */
    private function recordPurchaseJournal($purchase): void
    {
        try {
            // جيب حسابات الشركة
            $inventoryAccount = Account::where('company_id', $purchase->company_id)
                ->where('code', '1200')
                ->first();

            $apAccount = Account::where('company_id', $purchase->company_id)
                ->where('code', '2101')
                ->first();

            if (!$inventoryAccount || !$apAccount) {
                return;
            }

            // أنشئ قيد محاسبي جديد
            $journalEntry = JournalEntry::create([
                'company_id'     => $purchase->company_id,
                'ref'            => JournalEntry::generateRef(),
                'date'           => $purchase->created_at->toDateString(),
                'description'    => "شراء مخزون - أمر {$purchase->po_number}",
                'status'         => 'posted',
                'type'           => 'auto',
                'reference_type' => 'Purchase',
                'reference_id'   => $purchase->id,
                'user_id'        => $purchase->user_id ?? 1,
            ]);

            // مدين: حساب المخزون
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $inventoryAccount->id,
                'debit'            => $purchase->total,
                'credit'           => 0,
                'description'      => "أمر شراء {$purchase->po_number}",
            ]);

            // دائن: حساب المورد
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $apAccount->id,
                'debit'            => 0,
                'credit'           => $purchase->total,
                'description'      => "أمر شراء {$purchase->po_number}",
            ]);
        } catch (\Exception $e) {
            \Log::error('Purchase Journal Error: ' . $e->getMessage());
        }
    }
}

