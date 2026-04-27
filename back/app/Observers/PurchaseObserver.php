<?php

namespace App\Observers;

use App\Models\Purchase;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurchaseObserver
{
    public function updated(Purchase $purchase): void
    {
        if ($purchase->isDirty('status') && $purchase->status === 'received') {
            $this->createPurchaseJournal($purchase);
        }
    }

    private function createPurchaseJournal(Purchase $purchase): void
    {
        // Duplicate guard — منع إنشاء JE مكررة
        $exists = JournalEntry::where('ref', 'AUTO-PUR-' . $purchase->id)->exists();
        if ($exists) return;

        // ✅ التحقق من الحسابات قبل الـ transaction عشان الـ return يشتغل صح
        $inventoryAccount = Account::where('company_id', $purchase->company_id)
            ->where('code', '1200')
            ->first();

        $payableAccount = Account::where('company_id', $purchase->company_id)
            ->where('code', '2101')
            ->first();

        if (!$inventoryAccount || !$payableAccount) {
            Log::warning("Missing required accounts for company {$purchase->company_id}", [
                'purchase_id'       => $purchase->id,
                'inventory_found'   => (bool) $inventoryAccount,
                'payable_found'     => (bool) $payableAccount,
            ]);
            return; // ✅ return صح دلوقتي — برا الـ transaction
        }

        DB::transaction(function () use ($purchase, $inventoryAccount, $payableAccount) {
            $entry = JournalEntry::create([
                'company_id'     => $purchase->company_id,
                'ref'            => 'AUTO-PUR-' . $purchase->id,
                'date'           => now()->toDateString(),
                'description'    => 'مشتريات - أمر ' . $purchase->po_number,
                'type'           => 'auto',
                'status'         => 'posted',
                'user_id'        => $purchase->user_id,
                'reference_type' => Purchase::class,
                'reference_id'   => $purchase->id,
            ]);

            // مدين: المخزون
            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                'account_id'       => $inventoryAccount->id,
                'debit'            => $purchase->total,
                'credit'           => 0,
                'description'      => 'مخزون مشتريات',
            ]);
            $inventoryAccount->increment('balance', $purchase->total);

            // دائن: الموردون (ذمم)
            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                'account_id'       => $payableAccount->id,
                'debit'            => 0,
                'credit'           => $purchase->total,
                'description'      => 'ذمم موردين',
            ]);
            $payableAccount->increment('balance', $purchase->total);
        });
    }
}