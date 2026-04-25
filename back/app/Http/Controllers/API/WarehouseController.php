<?php

namespace App\Http\Controllers\API;

use App\Models\Warehouse;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * WarehouseController — إدارة المخازن
 * كل البيانات مربوطة بـ company_id (data isolation)
 */
class WarehouseController extends BaseController
{
    /** GET /api/warehouses */
    public function index(Request $request): JsonResponse
    {
        $warehouses = Warehouse::where('company_id', $this->companyId())
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->withCount('stockMovements')
            ->latest()
            ->paginate($this->perPage());

        return $this->success($warehouses);
    }

    /** POST /api/warehouses */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'location'   => 'nullable|string|max:255',
            'manager_id' => 'nullable|exists:users,id',
            'is_active'  => 'nullable|boolean',
            'notes'      => 'nullable|string',
        ]);

        $warehouse = Warehouse::create(array_merge($data, [
            'company_id' => $this->companyId(),
            'is_active'  => $data['is_active'] ?? true,
        ]));

        return $this->created($warehouse, 'تم إنشاء المخزن بنجاح.');
    }

    /** GET /api/warehouses/{warehouse} */
public function show(Warehouse $warehouse): JsonResponse
{
    $this->abortIfNotOwned($warehouse);

    $locations = \App\Models\ProductLocation::where('warehouse_id', $warehouse->id)
        ->where('company_id', $this->companyId())
        ->where('qty', '>', 0)
        ->get();

    $productIds = $locations->pluck('product_id')->toArray();

    $products = \App\Models\Product::whereIn('id', $productIds)
        ->get(['id', 'name', 'sku'])
        ->keyBy('id');

    $stock = $locations->map(fn($loc) => [
        'product_id' => $loc->product_id,
        'balance'    => (float) $loc->qty,
        'product'    => $products->get($loc->product_id),
    ]);

    return $this->success([
        'warehouse' => $warehouse,
        'stock'     => $stock,
    ]);
}

    /** PUT /api/warehouses/{warehouse} */
    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $this->abortIfNotOwned($warehouse);

        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'location'   => 'nullable|string|max:255',
            'manager_id' => 'nullable|exists:users,id',
            'is_active'  => 'nullable|boolean',
            'notes'      => 'nullable|string',
        ]);

        $warehouse->update($data);
        return $this->success($warehouse, 'تم تحديث المخزن بنجاح.');
    }

    /** DELETE /api/warehouses/{warehouse} */
    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $this->abortIfNotOwned($warehouse);

        if (StockMovement::where('warehouse_id', $warehouse->id)->exists()) {
            return $this->error('لا يمكن حذف مخزن يحتوي على حركات مخزون. يمكنك إيقاف تشغيله بدلاً من ذلك.', 422);
        }

        $warehouse->delete();
        return $this->success(null, 'تم حذف المخزن بنجاح.');
    }

    /** POST /api/warehouses/transfer — نقل بين مخزنين */
    public function transfer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_id'    => 'required|exists:warehouses,id|different:to_id',
            'to_id'      => 'required|exists:warehouses,id',
            'qty'        => 'required|numeric|min:0.001',
            'notes'      => 'nullable|string',
        ]);

        $companyId = $this->companyId();

        $fromWarehouse = Warehouse::where('id', $data['from_id'])->where('company_id', $companyId)->firstOrFail();
        $toWarehouse   = Warehouse::where('id', $data['to_id'])->where('company_id', $companyId)->firstOrFail();

        // التحقق من الرصيد
        $balance = StockMovement::where('company_id', $companyId)
            ->where('warehouse_id', $data['from_id'])
            ->where('product_id', $data['product_id'])
            ->selectRaw('SUM(CASE WHEN type IN ("in","transfer_in","purchase") THEN qty ELSE -qty END) as balance')
            ->value('balance') ?? 0;

        if ($balance < $data['qty']) {
            return $this->error("الرصيد الحالي ({$balance}) أقل من الكمية المطلوب نقلها ({$data['qty']}).", 422);
        }

        StockMovement::create([
            'company_id' => $companyId, 'product_id' => $data['product_id'],
            'warehouse_id' => $data['from_id'], 'type' => 'transfer_out',
            'qty' => $data['qty'], 'user_id' => auth()->id(),
            'notes' => $data['notes'] ?? "نقل إلى: {$toWarehouse->name}",
        ]);

        StockMovement::create([
            'company_id' => $companyId, 'product_id' => $data['product_id'],
            'warehouse_id' => $data['to_id'], 'type' => 'transfer_in',
            'qty' => $data['qty'], 'user_id' => auth()->id(),
            'notes' => $data['notes'] ?? "نقل من: {$fromWarehouse->name}",
        ]);

        return $this->success(['from' => $fromWarehouse->name, 'to' => $toWarehouse->name, 'qty' => $data['qty']], 'تم تنفيذ النقل بنجاح.');
    }

    private function abortIfNotOwned(Warehouse $warehouse): void
    {
        abort_if($warehouse->company_id !== $this->companyId(), 403, 'ليس لديك صلاحية الوصول لهذا المخزن.');
    }
}
