<?php

namespace App\Listeners;

use App\Events\PayrollPaid;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * RecordPayrollJournal — ينشئ القيد المحاسبي عند دفع الراتب
 * مدين: مصاريف الرواتب (5003)
 * دائن: البنك (1102)
 * ShouldQueue = يشتغل في الـ background queue
 */
class RecordPayrollJournal implements ShouldQueue
{
    public function handle(PayrollPaid $event): void
    {
        $payroll = $event->payroll;

        try {
            $salaryExpenseAccount = Account::where('company_id', $payroll->company_id)
                ->where('code', '5003')
                ->first();

            $bankAccount = Account::where('company_id', $payroll->company_id)
                ->where('code', '1102')
                ->first();

            if (!$salaryExpenseAccount || !$bankAccount) {
                return;
            }

            $journalEntry = JournalEntry::create([
                'company_id'     => $payroll->company_id,
                'ref'            => JournalEntry::generateRef(),
                'date'           => now()->toDateString(),
                'description'    => "دفع راتب الموظف - {$payroll->employee->name}",
                'status'         => 'posted',
                'type'           => 'auto',
                'reference_type' => 'Payroll',
                'reference_id'   => $payroll->id,
                'user_id'        => auth()->id() ?? 1,
            ]);

            // مدين: مصاريف الرواتب
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $salaryExpenseAccount->id,
                'debit'            => $payroll->net_salary,
                'credit'           => 0,
                'description'      => "دفع الراتب - {$payroll->employee->name}",
            ]);

            // دائن: البنك
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id'       => $bankAccount->id,
                'debit'            => 0,
                'credit'           => $payroll->net_salary,
                'description'      => "دفع من البنك",
            ]);
        } catch (\Exception $e) {
            \Log::error('Payroll Journal Error: ' . $e->getMessage());
        }
    }
}
