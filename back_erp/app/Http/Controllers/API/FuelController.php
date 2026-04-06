<?php
namespace App\Http\Controllers\API;
use App\Models\FuelLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class FuelController extends BaseController
{
    public function index(Request $request): JsonResponse { return $this->success(FuelLog::with('vehicle','driver')->when($request->vehicle_id,fn($q)=>$q->where('vehicle_id',$request->vehicle_id))->paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['vehicle_id'=>'required|exists:vehicles,id','driver_id'=>'nullable|exists:employees,id','liters'=>'required|numeric|min:0','cost_per_liter'=>'required|numeric|min:0','mileage'=>'nullable|numeric','fill_date'=>'required|date']);
        return $this->created(FuelLog::create(['company_id'=>$this->companyId(),'total_cost'=>$data['liters']*$data['cost_per_liter'],...$data]));
    }
    public function destroy(FuelLog $fuelLog): JsonResponse { $fuelLog->delete(); return $this->success(null,'Deleted'); }
    public function stats(): JsonResponse { return $this->success(['total_liters'=>FuelLog::sum('liters'),'total_cost'=>FuelLog::sum('total_cost')]); }
}
