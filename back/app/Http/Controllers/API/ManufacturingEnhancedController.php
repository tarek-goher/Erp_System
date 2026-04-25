<?php

namespace App\Http\Controllers\API;

use App\Models\WorkCenter;
use App\Models\BomItem;
use App\Models\WorkCenterRouting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class ManufacturingEnhancedController extends BaseController
{
    // ===== Work Centers =====
    public function getWorkCenters(Request $request): JsonResponse
    {
        $workCenters = WorkCenter::where('company_id', auth()->user()->company_id)
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->paginate($this->perPage());

        return $this->success($workCenters);
    }

    public function storeWorkCenter(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|unique:work_centers',
            'code' => 'required|string|unique:work_centers',
            'bank_name' => 'required|string',
            'capacity' => 'required|numeric|min:0',
            'hourly_rate' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $workCenter = WorkCenter::create([
            ...$data,
            'company_id' => auth()->user()->company_id,
        ]);

        return $this->success($workCenter, 'Work Center created successfully', 201);
    }

    // ===== BOM Management =====
    public function getBOMStructure($productId): JsonResponse
    {
        $bom = BomItem::with('childItems', 'product')
            ->where('company_id', auth()->user()->company_id)
            ->where('product_id', $productId)
            ->whereNull('parent_bom_id')
            ->first();

        if (!$bom) {
            return $this->error('BOM not found', 404);
        }

        return $this->success([
            'bom' => $bom,
            'total_cost' => $bom->getTotalCostWithChildren(),
            'all_children' => $bom->getAllChildren(),
            'lead_time_days' => $bom->calculateLeadTime(),
            'stock_status' => [
                'is_available' => $bom->isAvailableInStock(),
                'children_availability' => $bom->childItems->map(fn($child) => [
                    'product_id' => $child->product_id,
                    'available' => $child->isAvailableInStock(),
                ]),
            ],
        ]);
    }

    public function storeBOMItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'parent_bom_id' => 'nullable|exists:bom_items,id',
            'qty' => 'required|numeric|min:0.001',
            'unit_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $parentBom = null;
        $level = 1;

        if ($request->parent_bom_id) {
            $parentBom = BomItem::find($request->parent_bom_id);
            $level = ($parentBom->level ?? 1) + 1;
        }

        $bomItem = BomItem::create([
            ...$data,
            'company_id' => auth()->user()->company_id,
            'level' => $level,
            'total_cost' => $data['qty'] * $data['unit_cost'],
            'is_active' => true,
        ]);

        return $this->success($bomItem, 'BOM Item created', 201);
    }

    public function updateBOMHierarchy(Request $request, $bomId): JsonResponse
    {
        $bom = BomItem::where('company_id', auth()->user()->company_id)->find($bomId);

        if (!$bom) {
            return $this->error('BOM not found', 404);
        }

        $data = $request->validate([
            'qty' => 'numeric|min:0.001',
            'unit_cost' => 'numeric|min:0',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if (isset($data['qty']) || isset($data['unit_cost'])) {
            $qty = $data['qty'] ?? $bom->qty;
            $cost = $data['unit_cost'] ?? $bom->unit_cost;
            $data['total_cost'] = $qty * $cost;
        }

        $bom->update($data);

        return $this->success($bom, 'BOM updated successfully');
    }

    public function getRoutingForProduct($productId): JsonResponse
    {
        $routings = WorkCenterRouting::with('workCenter')
            ->where('company_id', auth()->user()->company_id)
            ->forProduct($productId)
            ->active()
            ->get();

        $totalTime = $routings->sum(fn($r) => $r->getTotalTime());
        $totalCost = $routings->sum(fn($r) => $r->calculateCost());

        return $this->success([
            'routings' => $routings,
            'total_time_minutes' => $totalTime,
            'total_cost' => $totalCost,
            'operations_count' => $routings->count(),
        ]);
    }

    public function storeRouting(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'work_center_id' => 'required|exists:work_centers,id',
            'sequence' => 'required|integer|min:1',
            'setup_time' => 'required|numeric|min:0',
            'operation_time' => 'required|numeric|min:0',
            'unit_time' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $routing = WorkCenterRouting::create([
            ...$data,
            'company_id' => auth()->user()->company_id,
            'is_active' => true,
        ]);

        return $this->success($routing, 'Routing created', 201);
    }
}
