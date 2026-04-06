<?php
namespace App\Http\Controllers\API;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class BranchController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Branch::with('manager:id,name')->paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string','address'=>'nullable|string','phone'=>'nullable|string','email'=>'nullable|email','manager_id'=>'nullable|exists:users,id','lat'=>'nullable|numeric','lng'=>'nullable|numeric']);
        return $this->created(Branch::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function show(Branch $branch): JsonResponse { return $this->success($branch->load('manager')); }
    public function update(Request $request, Branch $branch): JsonResponse { $branch->update($request->only('name','address','phone','manager_id','is_active')); return $this->success($branch,'Branch updated'); }
    public function destroy(Branch $branch): JsonResponse { $branch->delete(); return $this->success(null,'Branch deleted'); }
    public function stats(Branch $branch): JsonResponse { return $this->success(['branch'=>$branch,'employees'=>0,'sales_today'=>0]); }
}
