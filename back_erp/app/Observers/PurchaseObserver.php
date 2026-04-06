<?php

namespace App\Observers;

use App\Models\Purchase;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Account;
use Illuminate\Support\Facades\DB;

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
        DB::transaction(function () use ($purchase) {
            $inventoryAccount = Account::where('company_id', $purchase->company_id)->where('code', '1200')->first();
            $payableAccount   = Account::where('company_id', $purchase->company_id)->where('code', '2101')->first();

            if (!$inventoryAccount || !$payableAccount) return;

            $entry = JournalEntry::create([
                'company_id'     => $purchase->company_id,
                'ref'            => 'AUTO-PUR-' . $purchase->id,
                'date'           => now()->toDateString(),
                'description'    => 'مشتريات - أمر ' . $purchase->ref,
                'type'           => 'auto',
                'status'         => 'posted',
                'user_id'        => auth()->id() ?? 1,
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
