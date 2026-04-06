<?php

namespace App\Observers;

use App\Models\Sale;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Account;
use Illuminate\Support\Facades\DB;

/**
 * SaleObserver
 *
 * Fix #2:
 *  - السطر 39: كان $sale->sale_date → لكن Sale model ليس فيه حقل sale_date.
 *    الحقل الصحيح هو created_at (أو now() عند الـ update).
 *  - السطران 40 و98: كان $sale->ref → لكن Sale model الحقل الصحيح هو invoice_number.
 */
class SaleObserver
{
    public function updated(Sale $sale): void
    {
        if ($sale->isDirty('status') && $sale->status === 'paid') {
            $this->createSaleJournal($sale);
        }

        if ($sale->isDirty('status') && in_array($sale->status, ['cancelled', 'refunded'])) {
            $this->reverseSaleJournal($sale);
        }
    }

    private function createSaleJournal(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {
            $cashAccount    = Account::where('company_id', $sale->company_id)->where('code', '1101')->first();
            $revenueAccount = Account::where('company_id', $sale->company_id)->where('code', '4001')->first();
            $taxAccount     = Account::where('company_id', $sale->company_id)->where('code', '2103')->first();

            if (!$cashAccount || !$revenueAccount) return;

            $entry = JournalEntry::create([
                'company_id'     => $sale->company_id,
                'ref'            => 'AUTO-SALE-' . $sale->id,
                // Fix: كان $sale->sale_date (حقل غير موجود) → الصح created_at أو now()
                'date'           => $sale->created_at?->toDateString() ?? now()->toDateString(),
                // Fix: كان $sale->ref (حقل غير موجود) → الصح invoice_number
                'description'    => 'مبيعات - فاتورة ' . $sale->invoice_number,
                'type'           => 'auto',
                'status'         => 'posted',
                'user_id'        => $sale->user_id,
                'reference_type' => Sale::class,
                'reference_id'   => $sale->id,
            ]);

            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                'account_id'       => $cashAccount->id,
                'debit'            => $sale->total,
                'credit'           => 0,
                'description'      => 'نقدية مبيعات',
            ]);
            $cashAccount->increment('balance', $sale->total);

            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                'account_id'       => $revenueAccount->id,
                'debit'            => 0,
                'credit'           => $sale->subtotal - $sale->discount,
                'description'      => 'إيراد مبيعات',
            ]);
            $revenueAccount->increment('balance', $sale->subtotal - $sale->discount);

            if ($sale->tax > 0 && $taxAccount) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id'       => $taxAccount->id,
                    'debit'            => 0,
                    'credit'           => $sale->tax,
                    'description'      => 'ضريبة مبيعات',
                ]);
                $taxAccount->increment('balance', $sale->tax);
            }
        });
    }

    private function reverseSaleJournal(Sale $sale): void
    {
        $original = JournalEntry::where('reference_type', Sale::class)
            ->where('reference_id', $sale->id)
            ->where('company_id', $sale->company_id)
            ->where('type', 'auto')
            ->first();

        if (!$original) return;

        DB::transaction(function () use ($original, $sale) {
            $entry = JournalEntry::create([
                'company_id'     => $sale->company_id,
                'ref'            => 'REV-SALE-' . $sale->id,
                'date'           => now()->toDateString(),
                // Fix: كان $sale->ref → الصح invoice_number
                'description'    => 'عكس مبيعات - ' . $sale->invoice_number,
                'type'           => 'auto',
                'status'         => 'posted',
                'user_id'        => $sale->user_id,
                'reference_type' => Sale::class,
                'reference_id'   => $sale->id,
            ]);

            foreach ($original->lines as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id'       => $line->account_id,
                    'debit'            => $line->credit,
                    'credit'           => $line->debit,
                    'description'      => 'عكس: ' . $line->description,
                ]);

                $account = $line->account;
                if ($account->normal_balance === 'debit') {
                    $account->decrement('balance', $line->debit - $line->credit);
                } else {
                    $account->decrement('balance', $line->credit - $line->debit);
                }
            }
        });
    }
}
