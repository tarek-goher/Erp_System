<?php
namespace App\Http\Controllers\API;
use App\Models\BankStatement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class BankStatementController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $statements = BankStatement::when($request->from, fn($q)=>$q->whereDate('date','>=',$request->from))->latest('date')->paginate($this->perPage());
        return $this->success($statements);
    }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['bank_name'=>'required|string','account_number'=>'nullable|string','date'=>'required|date','amount'=>'required|numeric','type'=>'required|in:debit,credit','description'=>'nullable|string','reference'=>'nullable|string']);
        return $this->created(BankStatement::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function show(BankStatement $bankStatement): JsonResponse { return $this->success($bankStatement); }
    public function destroy(BankStatement $bankStatement): JsonResponse { $bankStatement->delete(); return $this->success(null,'Deleted'); }
    public function reconcile(Request $request): JsonResponse
    {
        $request->validate(['statement_id'=>'required|exists:bank_statements,id','status'=>'required|in:matched,unmatched']);
        BankStatement::findOrFail($request->statement_id)->update(['status'=>$request->status]);
        return $this->success(null,'Reconciled');
    }
}
