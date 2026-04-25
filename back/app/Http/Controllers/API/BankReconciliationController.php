<?php

namespace App\Http\Controllers\API;

use App\Models\WorkCenter;
use App\Models\BomItem;
use App\Models\WorkCenterRouting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class BankReconciliationController extends BaseController
{
    public function getBankAccounts(Request $request): JsonResponse
    {
        $accounts = \App\Models\BankAccount::where('company_id', auth()->user()->company_id)
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->with('statements', 'reconciliations')
            ->paginate($this->perPage());

        return $this->success($accounts);
    }

    public function createBankAccount(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string',
            'bank_name' => 'required|string',
            'account_number' => 'required|string|unique:bank_accounts',
            'branch_code' => 'nullable|string',
            'account_id' => 'required|exists:accounts,id',
            'currency' => 'required|string|size:3',
            'opening_balance' => 'required|numeric',
        ]);

        $bankAccount = \App\Models\BankAccount::create([
            ...$data,
            'company_id' => auth()->user()->company_id,
            'status' => 'active',
        ]);

        return $this->success($bankAccount, 'Bank account created', 201);
    }

    public function uploadBankStatement(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'statement_date' => 'required|date',
            'opening_balance' => 'required|numeric',
            'closing_balance' => 'required|numeric',
            'transactions' => 'required|array|min:1',
            'transactions.*.transaction_date' => 'required|date',
            'transactions.*.reference' => 'nullable|string',
            'transactions.*.description' => 'required|string',
            'transactions.*.debit' => 'nullable|numeric|min:0',
            'transactions.*.credit' => 'nullable|numeric|min:0',
        ]);

        try {
            \DB::beginTransaction();

            $statement = \App\Models\BankStatement::create([
                'bank_account_id' => $data['bank_account_id'],
                'company_id' => auth()->user()->company_id,
                'statement_date' => $data['statement_date'],
                'opening_balance' => $data['opening_balance'],
                'closing_balance' => $data['closing_balance'],
                'transaction_count' => count($data['transactions']),
                'status' => 'draft',
            ]);

            $balance = $data['opening_balance'];
            foreach ($data['transactions'] as $trans) {
                $debit = $trans['debit'] ?? 0;
                $credit = $trans['credit'] ?? 0;
                $balance += $debit - $credit;

                $statement->details()->create([
                    'transaction_date' => $trans['transaction_date'],
                    'reference' => $trans['reference'] ?? null,
                    'description' => $trans['description'],
                    'debit' => $debit ?: null,
                    'credit' => $credit ?: null,
                    'balance' => $balance,
                    'status' => 'unmatched',
                ]);
            }

            \DB::commit();

            return $this->success($statement, 'Bank statement uploaded', 201);
        } catch (\Exception $e) {
            \DB::rollBack();
            return $this->error($e->getMessage());
        }
    }

    public function matchTransaction(Request $request, $detailId): JsonResponse
    {
        $data = $request->validate([
            'transaction_id' => 'required|exists:payment_transactions,id',
            'amount' => 'required|numeric',
        ]);

        $detail = \App\Models\BankStatementDetail::find($detailId);

        if (!$detail) {
            return $this->error('Statement detail not found', 404);
        }

        if ($detail->matchWithTransaction($data['transaction_id'], $data['amount'])) {
            return $this->success($detail, 'Transaction matched');
        }

        return $this->error('Amount mismatch');
    }

    public function startReconciliation(Request $request, $statementId): JsonResponse
    {
        $statement = \App\Models\BankStatement::find($statementId);

        if (!$statement) {
            return $this->error('Statement not found', 404);
        }

        $statement->update(['status' => 'in_progress']);

        return $this->success($statement);
    }

    public function completeReconciliation(Request $request, $statementId): JsonResponse
    {
        $statement = \App\Models\BankStatement::with('details')->find($statementId);

        if (!$statement) {
            return $this->error('Statement not found', 404);
        }

        $reconciliation = \App\Models\BankReconciliation::create([
            'company_id' => auth()->user()->company_id,
            'bank_account_id' => $statement->bank_account_id,
            'bank_statement_id' => $statementId,
            'reconciliation_date' => now(),
            'statement_balance' => $statement->closing_balance,
            'calculated_balance' => $statement->getCalculatedBalance(),
            'difference' => abs($statement->closing_balance - $statement->getCalculatedBalance()),
            'matched_count' => $statement->getMatchedCount(),
            'unmatched_count' => $statement->getUnmatchedCount(),
            'status' => $statement->isBalanced() ? 'completed' : 'draft',
        ]);

        $statement->update(['status' => $statement->isBalanced() ? 'reconciled' : 'in_progress']);

        return $this->success($reconciliation, 'Reconciliation completed');
    }

    public function postReconciliation(Request $request, $reconciliationId): JsonResponse
    {
        $reconciliation = \App\Models\BankReconciliation::find($reconciliationId);

        if (!$reconciliation || !$reconciliation->canBePosted()) {
            return $this->error('Cannot post reconciliation');
        }

        if ($reconciliation->post(auth()->user())) {
            return $this->success($reconciliation, 'Reconciliation posted');
        }

        return $this->error('Failed to post reconciliation');
    }
}
