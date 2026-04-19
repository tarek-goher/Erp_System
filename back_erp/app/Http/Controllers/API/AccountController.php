<?php

namespace App\Http\Controllers\API;

use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            'code'           => [
                'required',
                'string',
                Rule::unique('accounts')->where(fn ($query) => $query->where('company_id', $this->companyId())),
            ],
            'type'           => 'required|in:asset,liability,equity,revenue,expense',
            'normal_balance' => 'nullable|in:debit,credit',
            'balance'        => 'nullable|numeric',
            'parent_id'      => 'nullable|exists:accounts,id',
            'is_active'      => 'nullable|boolean',
        ]);

        // Default the normal balance from account type when not supplied.
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
        // Prevent deleting accounts that still have child accounts.
        if ($account->children()->exists()) {
            return $this->error('Cannot delete account with sub-accounts', 422);
        }

        // Prevent deleting accounts that already have journal activity.
        if ($account->journalLines()->exists()) {
            return $this->error('Cannot delete account with journal entries', 422);
        }

        $account->delete();

        return $this->success(null, 'Account deleted');
    }

    // Trial balance endpoint. Route: GET /accounts/trial-balance
    public function trialBalance(): JsonResponse
    {
        $accounts = Account::whereHas('journalLines')
            ->get()
            ->map(function ($account) {
                $debit = $account->journalLines()->sum('debit');
                $credit = $account->journalLines()->sum('credit');

                return [
                    'account_id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type,
                    'debit' => round($debit, 2),
                    'credit' => round($credit, 2),
                    'balance' => round($debit - $credit, 2),
                ];
            });

        $totalDebit = $accounts->sum('debit');
        $totalCredit = $accounts->sum('credit');

        return $this->success([
            'accounts' => $accounts,
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'is_balanced' => round($totalDebit, 2) === round($totalCredit, 2),
        ]);
    }
}
