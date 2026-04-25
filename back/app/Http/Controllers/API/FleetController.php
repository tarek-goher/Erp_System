<?php
namespace App\Http\Controllers\API;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class FleetController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Vehicle::with('driver')->paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['plate_number'=>'required|string|unique:vehicles','brand'=>'nullable|string','model'=>'nullable|string','year'=>'nullable|integer','type'=>'nullable|string','driver_id'=>'nullable|exists:employees,id','fuel_type'=>'nullable|string']);
        return $this->created(Vehicle::create(['company_id'=>$this->companyId(),'status'=>'active',...$data]));
    }
    public function update(Request $request, Vehicle $vehicle): JsonResponse { $vehicle->update($request->only('driver_id','status','mileage')); return $this->success($vehicle,'Vehicle updated'); }
    public function destroy(Vehicle $vehicle): JsonResponse { $vehicle->delete(); return $this->success(null,'Deleted'); }
    public function stats(): JsonResponse
    {
        return $this->success(['total'=>Vehicle::count(),'active'=>Vehicle::where('status','active')->count(),'maintenance'=>Vehicle::where('status','maintenance')->count()]);
    }
}
