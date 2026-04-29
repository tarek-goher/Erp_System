<?php

namespace App\Http\Controllers\API;

use App\Models\Account;
use App\Models\JournalEntryLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->success(
            Account::paginate($this->perPage())
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:200',
            'name_en'        => 'nullable|string|max:200',
            'code'           => 'required|string|unique:accounts,code',
            'type'           => 'required|in:asset,liability,equity,revenue,expense',
            'normal_balance' => 'nullable|in:debit,credit',
            'balance'        => 'nullable|numeric',
            'parent_id'      => 'nullable|exists:accounts,id',
            'is_active'      => 'nullable|boolean',
        ]);

        // ✅ normal_balance تلقائي لو مش محدد
        if (empty($data['normal_balance'])) {
            $data['normal_balance'] = in_array($data['type'], ['asset', 'expense'])
                ? 'debit'
                : 'credit';
        }

        $account = Account::create([
            'company_id' => $this->companyId(),
            ...$data,
        ]);

        return $this->created($account);
    }

    public function show(Account $account): JsonResponse
    {
        return $this->success(
            $account->load('children')
        );
    }

    public function update(Request $request, Account $account): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:200',
            'name_en'   => 'nullable|string|max:200',
            'is_active' => 'nullable|boolean',
            'balance'   => 'nullable|numeric',
        ]);

        $account->update($data);

        return $this->success($account, 'Account updated');
    }

    public function destroy(Account $account): JsonResponse
    {
        // ✅ منع حذف حساب عنده أبناء
        if ($account->children()->exists()) {
            return $this->error('Cannot delete account with sub-accounts', 422);
        }

        // ✅ منع حذف حساب عنده قيود
        if ($account->journalLines()->exists()) {
            return $this->error('Cannot delete account with journal entries', 422);
        }

        $account->delete();

        return $this->success(null, 'Account deleted');
    }

    /**
     * ✅ ميزان المراجعة (Trial Balance)
     * Route: GET /accounts/trial-balance
     * 
     * ⚠️ FIX #1: كان whereHas بيبحث عن علاقة journalLines مش موجودة
     * ⚠️ FIX #2: حسابات كلها تظهر في التقرير (حتى اللي بدون journal entries)
     * ⚠️ FIX #3: قيمة الـ balance تُحسب من JournalEntryLine مباشرة
     */
    public function trialBalance(): JsonResponse
    {
        $companyId = $this->companyId();

        // 🔍 جيب كل الحسابات المفعلة من الشركة
        $allAccounts = Account::where('company_id', $companyId)
            ->where('is_active', true)
            ->get();

        $accounts = $allAccounts->map(function ($account) {
            // احسب الأرصدة من JournalEntryLine
            $journalLines = JournalEntryLine::where('account_id', $account->id)->get();

            $debit  = $journalLines->sum('debit');
            $credit = $journalLines->sum('credit');

            return [
                'account_id' => $account->id,
                'code'       => $account->code,
                'name'       => $account->name,
                'name_en'    => $account->name_en,
                'type'       => $account->type,
                'debit'      => round($debit, 2),
                'credit'     => round($credit, 2),
                'balance'    => round($debit - $credit, 2),
            ];
        })->filter(function ($account) {
            // فلّتر الحسابات اللي فيها حركات (اختياري)
            return $account['debit'] != 0 || $account['credit'] != 0;
        })->values();

        $totalDebit  = $accounts->sum('debit');
        $totalCredit = $accounts->sum('credit');
        $isBalanced  = abs(round($totalDebit, 2) - round($totalCredit, 2)) < 0.01;

        return $this->success([
            'accounts'     => $accounts,
            'total_debit'  => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'is_balanced'  => $isBalanced,
        ]);
    }
}