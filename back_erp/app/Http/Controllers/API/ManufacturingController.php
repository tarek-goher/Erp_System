<?php
namespace App\Http\Controllers\API;
use App\Models\WorkOrder;
use App\Models\BomItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class ManufacturingController extends BaseController
{
    public function workOrders(Request $request): JsonResponse { return $this->success(WorkOrder::with('product')->when($request->status,fn($q)=>$q->where('status',$request->status))->paginate($this->perPage())); }
    public function storeWorkOrder(Request $request): JsonResponse
    {
        $data = $request->validate(['product_id'=>'required|exists:products,id','qty'=>'required|numeric|min:0','start_date'=>'nullable|date','end_date'=>'nullable|date','notes'=>'nullable|string']);
        return $this->created(WorkOrder::create(['company_id'=>$this->companyId(),'status'=>'pending',...$data]));
    }
    public function updateWorkOrder(Request $request, WorkOrder $workOrder): JsonResponse { $workOrder->update($request->only('status','start_date','end_date','total_cost')); return $this->success($workOrder,'Updated'); }
    public function destroyWorkOrder(WorkOrder $workOrder): JsonResponse { $workOrder->delete(); return $this->success(null,'Deleted'); }
    public function calculateCost(WorkOrder $workOrder): JsonResponse
    {
        $cost = BomItem::where('work_order_id',$workOrder->id)->sum('total_cost');
        $workOrder->update(['total_cost'=>$cost]);
        return $this->success(['cost'=>$cost,'work_order'=>$workOrder]);
    }
    public function bom(): JsonResponse { return $this->success(BomItem::with('product','workOrder')->paginate($this->perPage())); }
    public function storeBomItem(Request $request): JsonResponse
    {
        $data = $request->validate(['work_order_id'=>'required|exists:work_orders,id','product_id'=>'required|exists:products,id','qty'=>'required|numeric|min:0','unit_cost'=>'nullable|numeric|min:0']);
        $item = BomItem::create(['company_id'=>$this->companyId(),'total_cost'=>($data['qty']*($data['unit_cost']??0)),...$data]);
        return $this->created($item);
    }
    public function destroyBomItem(BomItem $bomItem): JsonResponse { $bomItem->delete(); return $this->success(null,'Deleted'); }
    public function stats(): JsonResponse
    {
        return $this->success(['total_orders'=>WorkOrder::count(),'in_progress'=>WorkOrder::where('status','in_progress')->count(),'completed'=>WorkOrder::where('status','completed')->count(),'total_cost'=>WorkOrder::sum('total_cost')]);
    }
}
