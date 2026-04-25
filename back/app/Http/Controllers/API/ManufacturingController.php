<?php
namespace App\Http\Controllers\API;
use App\Models\WorkOrder;
use App\Models\BomItem;
use App\Services\ManufacturingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManufacturingController extends BaseController
{
    private $manufacturingService;

    public function __construct(ManufacturingService $manufacturingService)
    {
        $this->manufacturingService = $manufacturingService;
    }

    public function workOrders(Request $request): JsonResponse 
    { 
        return $this->success(WorkOrder::with('product')
            ->where('company_id', $this->companyId())
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->paginate($this->perPage())); 
    }

    public function storeWorkOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty'        => 'required|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'notes'      => 'nullable|string'
        ]);
        
        return $this->created(WorkOrder::create([
            'company_id' => $this->companyId(),
            'status'     => 'pending',
            ...$data
        ]));
    }

    public function updateWorkOrder(Request $request, WorkOrder $workOrder): JsonResponse
    { 
        $workOrder->update($request->only('status', 'start_date', 'end_date', 'total_cost'));
        return $this->success($workOrder, 'Updated');
    }

    // ✅ FIX: إتمام أمر الإنتاج مع تحديث المخزون
    public function completeWorkOrder(WorkOrder $workOrder): JsonResponse
    {
        $completed = $this->manufacturingService->completeWorkOrder($workOrder);
        return $this->success($completed, 'Work order completed and inventory updated');
    }

    // ✅ FIX: بدء أمر الإنتاج
    public function startWorkOrder(WorkOrder $workOrder): JsonResponse
    {
        $started = $this->manufacturingService->startWorkOrder($workOrder);
        return $this->success($started, 'Work order started');
    }

    // ✅ FIX: إلغاء أمر الإنتاج
    public function cancelWorkOrder(WorkOrder $workOrder): JsonResponse
    {
        $this->manufacturingService->cancelWorkOrder($workOrder);
        return $this->success(null, 'Work order cancelled');
    }

    public function destroyWorkOrder(WorkOrder $workOrder): JsonResponse 
    { 
        $workOrder->delete();
        return $this->success(null, 'Deleted');
    }

    public function calculateCost(WorkOrder $workOrder): JsonResponse
    {
        $cost = BomItem::where('work_order_id', $workOrder->id)->sum('total_cost');
        $workOrder->update(['total_cost' => $cost]);
        return $this->success(['cost' => $cost, 'work_order' => $workOrder]);
    }

    public function bom(): JsonResponse 
    { 
        return $this->success(BomItem::with('product', 'workOrder')
            ->whereHas('workOrder', fn($q) => $q->where('company_id', $this->companyId()))
            ->paginate($this->perPage())); 
    }

    public function storeBomItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'work_order_id' => 'required|exists:work_orders,id',
            'product_id'    => 'required|exists:products,id',
            'qty'           => 'required|numeric|min:0',
            'unit_cost'     => 'nullable|numeric|min:0'
        ]);
        
        $item = BomItem::create([
            'company_id'  => $this->companyId(),
            'total_cost'  => ($data['qty'] * ($data['unit_cost'] ?? 0)),
            ...$data
        ]);
        
        return $this->created($item);
    }

    public function destroyBomItem(BomItem $bomItem): JsonResponse 
    { 
        $bomItem->delete();
        return $this->success(null, 'Deleted');
    }

    public function stats(): JsonResponse
    {
        $baseQuery = WorkOrder::where('company_id', $this->companyId());
        
        return $this->success([
            'total_orders'  => (clone $baseQuery)->count(),
            'in_progress'   => (clone $baseQuery)->where('status', 'in_progress')->count(),
            'completed'     => (clone $baseQuery)->where('status', 'completed')->count(),
            'cancelled'     => (clone $baseQuery)->where('status', 'cancelled')->count(),
            'total_cost'    => (clone $baseQuery)->sum('total_cost'),
        ]);
    }
}
