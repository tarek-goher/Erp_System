<?php
namespace App\Http\Controllers\API;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class AccountController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Account::paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string|max:200','code'=>'required|string|unique:accounts','type'=>'required|in:asset,liability,equity,revenue,expense','balance'=>'nullable|numeric','parent_id'=>'nullable|exists:accounts,id']);
        return $this->created(Account::create($data));
    }
    public function show(Account $account): JsonResponse { return $this->success($account->load('children','journalEntries')); }
    public function update(Request $request, Account $account): JsonResponse
    {
        $account->update($request->only('name','balance')); return $this->success($account,'Account updated');
    }
    public function destroy(Account $account): JsonResponse { $account->delete(); return $this->success(null,'Account deleted'); }
    public function tree(): JsonResponse { return $this->success(Account::with('children')->whereNull('parent_id')->get()); }
    public function trialBalance(): JsonResponse
    {
        $accounts = Account::withSum('journalEntries as debit_total','debit')->withSum('journalEntries as credit_total','credit')->get();
        return $this->success($accounts);
    }
}
