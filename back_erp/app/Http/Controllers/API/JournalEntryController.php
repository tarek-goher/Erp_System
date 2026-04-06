<?php
namespace App\Http\Controllers\API;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class JournalEntryController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $entries = JournalEntry::with('account')
            ->when($request->account_id, fn($q)=>$q->where('account_id',$request->account_id))
            ->when($request->from, fn($q)=>$q->whereDate('date','>=',$request->from))
            ->when($request->to, fn($q)=>$q->whereDate('date','<=',$request->to))
            ->latest('date')->paginate($this->perPage());
        return $this->success($entries);
    }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['account_id'=>'required|exists:accounts,id','date'=>'required|date','description'=>'required|string','debit'=>'nullable|numeric|min:0','credit'=>'nullable|numeric|min:0','reference'=>'nullable|string']);
        return $this->created(JournalEntry::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function show(JournalEntry $journalEntry): JsonResponse { return $this->success($journalEntry->load('account')); }
    public function destroy(JournalEntry $journalEntry): JsonResponse { $journalEntry->delete(); return $this->success(null,'Entry deleted'); }
    public function incomeStatement(Request $request): JsonResponse
    {
        $revenue  = JournalEntry::whereHas('account',fn($q)=>$q->where('type','revenue'))->sum('credit');
        $expenses = JournalEntry::whereHas('account',fn($q)=>$q->where('type','expense'))->sum('debit');
        return $this->success(['revenue'=>$revenue,'expenses'=>$expenses,'net'=>$revenue-$expenses]);
    }
    public function balanceSheet(): JsonResponse
    {
        $assets      = \App\Models\Account::where('type','asset')->sum('balance');
        $liabilities = \App\Models\Account::where('type','liability')->sum('balance');
        $equity      = \App\Models\Account::where('type','equity')->sum('balance');
        return $this->success(compact('assets','liabilities','equity'));
    }
    public function cashFlow(): JsonResponse
    {
        $cash = JournalEntry::whereHas('account',fn($q)=>$q->where('name','like','%cash%'))
            ->selectRaw('SUM(debit) as total_in, SUM(credit) as total_out')->first();
        return $this->success($cash);
    }
}
