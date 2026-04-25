<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntryLine;
use Carbon\Carbon;

class GeneralLedgerService
{
    /**
     * احصل على دفتر الأستاذ لحساب واحد
     * Returns: account details + lines with running balance
     */
    public function getAccountLedger($accountId, $fromDate = null, $toDate = null)
    {
        $account = Account::findOrFail($accountId);

        // جيب كل journal lines بتاعة الحساب — مرتبة حسب التاريخ
        $query = JournalEntryLine::where('account_id', $accountId)
            ->with('journalEntry');

        if ($fromDate) {
            $query->whereHas('journalEntry', fn($q) => $q->whereDate('date', '>=', $fromDate));
        }
        if ($toDate) {
            $query->whereHas('journalEntry', fn($q) => $q->whereDate('date', '<=', $toDate));
        }

        $lines = $query->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->orderBy('journal_entries.date')
            ->orderBy('journal_entry_lines.id')
            ->select('journal_entry_lines.*')
            ->get();

        // ✅ احسب الـ running balance لكل سطر
        $balance = 0;
        $formattedLines = $lines->map(function ($line) use ($account, &$balance) {
            // حسب normal_balance
            if ($account->normal_balance === 'debit') {
                $balance += $line->debit - $line->credit;
            } else {
                $balance += $line->credit - $line->debit;
            }

            return [
                'id'                 => $line->id,
                'journal_entry_id'   => $line->journal_entry_id,
                'journal_entry_ref'  => $line->journalEntry->ref ?? null,
                'date'               => $line->journalEntry?->date?->format('Y-m-d'),
                'description'        => $line->journalEntry?->description ?? $line->description,
                'line_description'   => $line->description,
                'debit'              => round($line->debit, 2),
                'credit'             => round($line->credit, 2),
                'running_balance'    => round($balance, 2),
            ];
        });

        // ✅ احسب الإجماليات
        $totalDebit  = $lines->sum('debit');
        $totalCredit = $lines->sum('credit');

        return [
            'account'        => [
                'id'               => $account->id,
                'code'             => $account->code,
                'name'             => $account->name,
                'type'             => $account->type,
                'normal_balance'   => $account->normal_balance,
            ],
            'lines'          => $formattedLines,
            'total_debit'    => round($totalDebit, 2),
            'total_credit'   => round($totalCredit, 2),
            'closing_balance' => round($balance, 2),
        ];
    }

    /**
     * احصل على دفتر الأستاذ الكامل — لكل الحسابات
     */
    public function getAllLedgers($fromDate = null, $toDate = null, $accountType = null)
    {
        // جيب كل الحسابات اللي فيها قيود — مع الفلترة
        $query = Account::whereHas('journalLines');

        if ($accountType) {
            $query->where('type', $accountType);
        }

        $accounts = $query->orderBy('code')->get();

        $ledgers = $accounts->map(function ($account) use ($fromDate, $toDate) {
            return $this->getAccountLedger($account->id, $fromDate, $toDate);
        });

        // ✅ احسب الإجماليات الكلية
        $totalDebitAll  = $ledgers->sum('total_debit');
        $totalCreditAll = $ledgers->sum('total_credit');

        return [
            'ledgers'          => $ledgers,
            'total_debit'      => round($totalDebitAll, 2),
            'total_credit'     => round($totalCreditAll, 2),
            'is_balanced'      => round($totalDebitAll, 2) === round($totalCreditAll, 2),
            'accounts_count'   => $ledgers->count(),
            'lines_count'      => $ledgers->sum(fn($l) => count($l['lines'])),
        ];
    }

    /**
     * احصل على summary — ملخص لكل حساب بدون الـ lines التفصيلية
     */
    public function getLedgerSummary($fromDate = null, $toDate = null)
    {
        $query = JournalEntryLine::with(['account', 'journalEntry']);

        if ($fromDate) {
            $query->whereHas('journalEntry', fn($q) => $q->whereDate('date', '>=', $fromDate));
        }
        if ($toDate) {
            $query->whereHas('journalEntry', fn($q) => $q->whereDate('date', '<=', $toDate));
        }

        $lines = $query->get();

        // جمّع حسب account_id
        $summary = $lines->groupBy('account_id')->map(function ($accountLines) {
            $account = $accountLines->first()->account;
            $totalDebit  = $accountLines->sum('debit');
            $totalCredit = $accountLines->sum('credit');

            // احسب الـ closing balance
            if ($account->normal_balance === 'debit') {
                $balance = $totalDebit - $totalCredit;
            } else {
                $balance = $totalCredit - $totalDebit;
            }

            return [
                'account_id'     => $account->id,
                'account_code'   => $account->code,
                'account_name'   => $account->name,
                'account_type'   => $account->type,
                'total_debit'    => round($totalDebit, 2),
                'total_credit'   => round($totalCredit, 2),
                'closing_balance' => round($balance, 2),
                'lines_count'    => $accountLines->count(),
            ];
        })->sortBy('account_code')->values();

        $totalDebit  = $summary->sum('total_debit');
        $totalCredit = $summary->sum('total_credit');

        return [
            'summary'      => $summary,
            'total_debit'  => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'is_balanced'  => round($totalDebit, 2) === round($totalCredit, 2),
        ];
    }
}