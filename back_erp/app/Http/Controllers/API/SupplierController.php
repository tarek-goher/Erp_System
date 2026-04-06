<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SupplierController — إدارة الموردين
 */
class SupplierController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::where('company_id', $this->companyId())
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($suppliers);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = Supplier::create(array_merge($request->validated(), ['company_id' => $this->companyId()]));
        return $this->created($supplier);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return $this->success($supplier->load('purchases'));
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'email'         => 'nullable|email',
            'phone'         => 'nullable|string|max:20',
            'address'       => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'notes'         => 'nullable|string',
            'is_active'     => 'nullable|boolean',
        ]);

        $supplier->update($data);
        return $this->success($supplier, 'تم تحديث بيانات المورد.');
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();
        return $this->success(null, 'تم حذف المورد.');
    }
}
