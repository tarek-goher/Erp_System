<?php
namespace App\Http\Controllers\API;
use App\Models\FixedAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class FixedAssetController extends BaseController
{
    public function index(): JsonResponse { return $this->success(FixedAsset::paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string','purchase_date'=>'required|date','purchase_cost'=>'required|numeric','useful_life_years'=>'required|integer','salvage_value'=>'nullable|numeric','depreciation_method'=>'nullable|in:straight_line,declining_balance']);
        return $this->created(FixedAsset::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function show(FixedAsset $fixedAsset): JsonResponse { return $this->success($fixedAsset); }
    public function update(Request $request, FixedAsset $fixedAsset): JsonResponse
    {
        $fixedAsset->update($request->only('name','salvage_value','status')); return $this->success($fixedAsset,'Asset updated');
    }
    public function destroy(FixedAsset $fixedAsset): JsonResponse { $fixedAsset->delete(); return $this->success(null,'Asset deleted'); }
    public function depreciation(FixedAsset $fixedAsset): JsonResponse
    {
        $annual = ($fixedAsset->purchase_cost - ($fixedAsset->salvage_value ?? 0)) / max($fixedAsset->useful_life_years,1);
        return $this->success(['annual_depreciation'=>$annual,'monthly'=>$annual/12,'asset'=>$fixedAsset]);
    }
}
