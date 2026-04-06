<?php
namespace App\Http\Controllers\API;
use App\Models\FleetMaintenance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class MaintenanceController extends BaseController
{
    public function index(Request $request): JsonResponse { return $this->success(FleetMaintenance::with('vehicle')->when($request->vehicle_id,fn($q)=>$q->where('vehicle_id',$request->vehicle_id))->paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['vehicle_id'=>'required|exists:vehicles,id','type'=>'required|string','description'=>'nullable|string','cost'=>'nullable|numeric','maintenance_date'=>'required|date','next_maintenance_date'=>'nullable|date']);
        return $this->created(FleetMaintenance::create(['company_id'=>$this->companyId(),'status'=>'completed',...$data]));
    }
    public function update(Request $request, FleetMaintenance $maintenance): JsonResponse { $maintenance->update($request->only('description','cost','status','next_maintenance_date')); return $this->success($maintenance,'Updated'); }
    public function destroy(FleetMaintenance $maintenance): JsonResponse { $maintenance->delete(); return $this->success(null,'Deleted'); }
}
