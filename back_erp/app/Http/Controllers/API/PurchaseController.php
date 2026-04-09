<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Purchase\UpdatePurchaseRequest;
use App\Http\Requests\Purchase\StorePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Purchase;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * PurchaseController — المشتريات
 */
class PurchaseController extends BaseController
{
    public function __construct(private PurchaseService $purchaseService) {}

    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::with('supplier', 'user')
            ->where('company_id', $this->companyId())
            ->when($request->search, fn($q) => $q->where('po_number', 'like', "%{$request->search}%")
                ->orWhereHas('supplier', fn($s) => $s->where('name', 'like', "%{$request->search}%")))
            ->when($request->supplier_id, fn($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->status,      fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($this->perPage());

        return $this->success(PurchaseResource::collection($purchases)->response()->getData(true));
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $purchase = $this->purchaseService->createPurchase($request->validated(), $this->companyId());
        return $this->created(new PurchaseResource($purchase));
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $purchase = Purchase::withoutGlobalScopes()
            ->with('items.product', 'supplier', 'user')
            ->findOrFail(request()->route('id'));

        return $this->success(new PurchaseResource($purchase));
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        $purchase = Purchase::withoutGlobalScopes()
            ->findOrFail(request()->route('id'));

        $purchase = $this->purchaseService->updatePurchase($purchase, $request->validated());
        return $this->success(new PurchaseResource($purchase));
    }

    public function destroy(Purchase $purchase): JsonResponse
    {
        $purchase = Purchase::withoutGlobalScopes()
            ->findOrFail(request()->route('id'));

        $this->purchaseService->deletePurchase($purchase);
        return $this->success(null, 'تم حذف أمر الشراء وإرجاع المخزون.');
    }
}