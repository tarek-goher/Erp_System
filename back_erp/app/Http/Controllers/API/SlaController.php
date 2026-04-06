<?php
namespace App\Http\Controllers\API;
use App\Models\SlaPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class SlaController extends BaseController
{
    public function index(): JsonResponse { return $this->success(SlaPolicy::paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string','priority'=>'required|in:low,medium,high,urgent','response_hours'=>'required|numeric|min:0','resolution_hours'=>'required|numeric|min:0','is_active'=>'nullable|boolean']);
        return $this->created(SlaPolicy::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function show(SlaPolicy $slaPolicy): JsonResponse { return $this->success($slaPolicy); }
    public function update(Request $request, SlaPolicy $slaPolicy): JsonResponse { $slaPolicy->update($request->only('name','response_hours','resolution_hours','is_active')); return $this->success($slaPolicy,'SLA updated'); }
    public function destroy(SlaPolicy $slaPolicy): JsonResponse { $slaPolicy->delete(); return $this->success(null,'SLA deleted'); }
}
