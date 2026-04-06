<?php
namespace App\Http\Controllers\API;
use App\Models\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class BudgetController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Budget::with('account')->paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['account_id'=>'required|exists:accounts,id','name'=>'required|string','amount'=>'required|numeric|min:0','period_start'=>'required|date','period_end'=>'required|date','notes'=>'nullable|string']);
        return $this->created(Budget::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function show(Budget $budget): JsonResponse { return $this->success($budget->load('account')); }
    public function update(Request $request, Budget $budget): JsonResponse
    {
        $budget->update($request->only('name','amount','notes')); return $this->success($budget,'Budget updated');
    }
    public function destroy(Budget $budget): JsonResponse { $budget->delete(); return $this->success(null,'Budget deleted'); }
    public function vs(Budget $budget): JsonResponse
    {
        $spent = \App\Models\JournalEntry::where('account_id',$budget->account_id)->whereBetween('date',[$budget->period_start,$budget->period_end])->sum('debit');
        return $this->success(['budget'=>$budget->amount,'spent'=>$spent,'remaining'=>$budget->amount-$spent,'percentage'=>$budget->amount>0?round($spent/$budget->amount*100,2):0]);
    }
}
