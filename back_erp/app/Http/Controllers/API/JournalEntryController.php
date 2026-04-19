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
                'Journal entry is not balanced. Debit: ' . $totalDebit . ' Credit: ' . $totalCredit,
                422
            );
        }

        DB::beginTransaction();
        try {
            // ✅ إنشاء الـ header
            $entry = JournalEntry::create([
                'company_id'  => $this->companyId(),
                'ref'         => JournalEntry::generateRef(),
                'date'        => $data['date'],
                'description' => $data['description'],
                'type'        => $data['type'] ?? 'manual',
                'status'      => 'draft',
                'user_id'     => auth()->id(),
            ]);

            // ✅ إنشاء الـ lines
            foreach ($data['lines'] as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id'       => $line['account_id'],
                    'debit'            => $line['debit']  ?? 0,
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
        // ✅ الـ update بيُستخدم للـ Post فقط (status: posted)
        if ($request->has('status') && $request->status === 'posted') {
            if ($journalEntry->status === 'posted') {
                return $this->error('Entry is already posted', 422);
            }

            $posted = $journalEntry->post();

            if (!$posted) {
                return $this->error('Cannot post — entry is not balanced', 422);
            }

            return $this->success($journalEntry->fresh()->load('lines.account'), 'Entry posted successfully');
        }

        // ✅ تعديل entry مسودة فقط
        if ($journalEntry->status === 'posted') {
            return $this->error('Cannot edit a posted entry', 422);
        }

        $data = $request->validate([
            'date'        => 'sometimes|date',
            'description' => 'sometimes|string|max:500',
        ]);

        $journalEntry->update($data);

        return $this->success($journalEntry->load('lines.account'), 'Entry updated');
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