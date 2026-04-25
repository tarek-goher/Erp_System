<?php
namespace App\Http\Controllers\API;
use App\Models\BankStatement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankStatementController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $statements = BankStatement::with('account')
            ->where('company_id', $this->companyId())
            ->when($request->from, fn($q) => $q->whereDate('transaction_date', '>=', $request->from))
            ->when($request->to,   fn($q) => $q->whereDate('transaction_date', '<=', $request->to))
            ->latest('transaction_date')
            ->paginate($this->perPage());

        return $this->success($statements);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'account_id'       => 'required|exists:accounts,id',
            'transaction_date' => 'required|date',
            'description'      => 'required|string|max:1000',
            'debit'            => 'nullable|numeric|min:0',
            'credit'           => 'nullable|numeric|min:0',
            'balance'          => 'nullable|numeric',
            'reference'        => 'nullable|string|max:255',
        ]);

        if (empty($data['debit']) && empty($data['credit'])) {
            return $this->error('يجب إدخال مدين أو دائن', 422);
        }

        $statement = BankStatement::create([
            'company_id'       => $this->companyId(),
            'account_id'       => $data['account_id'],
            'transaction_date' => $data['transaction_date'],
            'description'      => $data['description'],
            'debit'            => $data['debit']    ?? 0,
            'credit'           => $data['credit']   ?? 0,
            'balance'          => $data['balance']  ?? 0,
            'reference'        => $data['reference'] ?? null,
            'is_reconciled'    => false,
        ]);

        return $this->created($statement->load('account'));
    }

    public function show(BankStatement $bankStatement): JsonResponse
    {
        return $this->success($bankStatement->load('account'));
    }

    public function destroy(BankStatement $bankStatement): JsonResponse
    {
        $bankStatement->delete();
        return $this->success(null, 'تم الحذف');
    }

    public function reconcile(Request $request): JsonResponse
    {
        $request->validate([
            'statement_id' => 'required|exists:bank_statements,id',
            'status'       => 'required|in:matched,unmatched',
        ]);

        BankStatement::findOrFail($request->statement_id)->update([
            'is_reconciled' => $request->status === 'matched',
        ]);

        return $this->success(null, 'تمت التسوية');
    }
}