<?php

namespace App\Http\Controllers\API;

use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalEntryController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $entries = JournalEntry::with('lines.account')
            ->when($request->account_id, function ($q) use ($request) {
                $q->whereHas('lines', fn($l) => $l->where('account_id', $request->account_id));
            })
            ->when($request->from, fn($q) => $q->whereDate('date', '>=', $request->from))
            ->when($request->to,   fn($q) => $q->whereDate('date', '<=', $request->to))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest('date')
            ->paginate($this->perPage());

        // ✅ بنضيف total_debit و total_credit لكل entry في القائمة
        $entries->getCollection()->transform(function ($entry) {
            $entry->total_debit  = $entry->lines->sum('debit');
            $entry->total_credit = $entry->lines->sum('credit');
            return $entry;
        });

        return $this->success($entries);
    }

    public function store(Request $request): JsonResponse
    {
        // ✅ الـ validation الصح — entry header + lines array
        $data = $request->validate([
            'date'                    => 'required|date',
            'description'             => 'required|string|max:500',
            'type'                    => 'nullable|string|max:50',
            'lines'                   => 'required|array|min:2',
            'lines.*.account_id'      => 'required|exists:accounts,id',
            'lines.*.debit'           => 'required|numeric|min:0',
            'lines.*.credit'          => 'required|numeric|min:0',
            'lines.*.description'     => 'nullable|string|max:200',
        ]);

        // ✅ التحقق من التوازن قبل الحفظ
        $totalDebit  = collect($data['lines'])->sum('debit');
        $totalCredit = collect($data['lines'])->sum('credit');

        if (round($totalDebit, 2) !== round($totalCredit, 2)) {
            return $this->error(
                sprintf('غير متوازن — المدين: %s، الدائن: %s',
                    number_format($totalDebit, 2),
                    number_format($totalCredit, 2)
                ),
                422
            );
        }

        DB::beginTransaction();

        try {
            $entry = JournalEntry::create([
                'company_id'  => auth()->user()->company_id,
                'ref'         => JournalEntry::generateRef(),
                'date'        => $data['date'],
                'description' => $data['description'],
                'status'      => 'draft',
                'type'        => $data['type'] ?? 'manual',
                'user_id'     => auth()->id(),
            ]);

            // إضافة الأسطر
            foreach ($data['lines'] as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id'       => $line['account_id'],
                    'debit'            => $line['debit'] ?? 0,
                    'credit'           => $line['credit'] ?? 0,
                    'description'      => $line['description'] ?? null,
                ]);
            }

            DB::commit();

            return $this->created($entry->load('lines.account'));

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to create journal entry: ' . $e->getMessage(), 500);
        }
    }

    public function show(JournalEntry $journalEntry): JsonResponse
    {
        $entry = $journalEntry->load('lines.account', 'user');

        // ✅ إضافة totals
        $entry->total_debit  = $entry->lines->sum('debit');
        $entry->total_credit = $entry->lines->sum('credit');

        return $this->success($entry);
    }

    public function update(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        // التحقق من أن القيد لا يزال في حالة draft
        if ($journalEntry->status === 'posted') {
            return $this->error('Cannot modify a posted entry', 422);
        }

        $data = $request->validate([
            'date'        => 'sometimes|date',
            'description' => 'sometimes|string|max:500',
            'lines'       => 'sometimes|array|min:2',
            'lines.*.account_id' => 'required_with:lines|exists:accounts,id',
            'lines.*.debit'      => 'required_with:lines|numeric|min:0',
            'lines.*.credit'     => 'required_with:lines|numeric|min:0',
            'lines.*.description' => 'nullable|string|max:200',
        ]);

        if (isset($data['lines'])) {
            // التحقق من التوازن
            $totalDebit = collect($data['lines'])->sum('debit');
            $totalCredit = collect($data['lines'])->sum('credit');

            if (abs($totalDebit - $totalCredit) > 0.01) {
                return $this->error('Debit and credit must be equal', 422);
            }

            // حذف السطور القديمة وإضافة الجديدة
            $journalEntry->lines()->delete();

            foreach ($data['lines'] as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id'       => $line['account_id'],
                    'debit'            => $line['debit'],
                    'credit'           => $line['credit'],
                    'description'      => $line['description'] ?? null,
                ]);
            }
        }

        if (isset($data['date']) || isset($data['description'])) {
            $journalEntry->update($data);
        }

        return $this->success($journalEntry->load('lines.account'), 'Entry updated');
    }

    /**
     * ترحيل قيد من draft إلى posted
     */
    public function post(JournalEntry $journalEntry): JsonResponse
    {
        if ($journalEntry->status === 'posted') {
            return $this->error('Entry is already posted', 422);
        }

        // التحقق من التوازن
        $totalDebit = $journalEntry->lines->sum('debit');
        $totalCredit = $journalEntry->lines->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return $this->error('Debit and credit must be equal', 422);
        }

        DB::transaction(function () use ($journalEntry) {
            $journalEntry->update(['status' => 'posted']);

            // تحديث أرصدة الحسابات
            foreach ($journalEntry->lines as $line) {
                $account = $line->account;
                
                if ($account->normal_balance === 'debit') {
                    $account->balance += ($line->debit - $line->credit);
                } else {
                    $account->balance += ($line->credit - $line->debit);
                }
                
                $account->save();
            }
        });

        return $this->success($journalEntry->load('lines.account'), 'Entry posted successfully');
    }

    public function destroy(JournalEntry $journalEntry): JsonResponse
    {
        if ($journalEntry->status === 'posted') {
            return $this->error('Cannot delete a posted entry', 422);
        }

        $journalEntry->lines()->delete();
        $journalEntry->delete();

        return $this->success(null, 'Entry deleted');
    }
}
