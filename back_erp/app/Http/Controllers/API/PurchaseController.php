<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Purchase\UpdatePurchaseRequest;
use App\Http\Requests\Purchase\StorePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Purchase;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends BaseController
{
    public function __construct(private PurchaseService $purchaseService) {}

    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::with('supplier', 'user')
            ->where('company_id', $this->companyId())
            ->when($request->search, fn($q) => $q
                ->where('po_number', 'like', "%{$request->search}%")
                ->orWhereHas('supplier', fn($s) => $s->where('name', 'like', "%{$request->search}%")))
            ->when($request->supplier_id, fn($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->status,      fn($q) => $q->where('status', $request->status))
            ->when($request->from,        fn($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to,          fn($q) => $q->whereDate('created_at', '<=', $request->to))
            ->latest()
            ->paginate($this->perPage());

        return $this->success(PurchaseResource::collection($purchases)->response()->getData(true));
    }

    public function stats(): JsonResponse
    {
        $companyId = $this->companyId();

        $total    = Purchase::where('company_id', $companyId)->whereNotIn('status', ['cancelled'])->sum('total');
        $received = Purchase::where('company_id', $companyId)->where('status', 'received')->sum('total');
        $pending  = Purchase::where('company_id', $companyId)->whereIn('status', ['pending', 'approved'])->sum('total');

        return $this->success([
            'total_orders'    => Purchase::where('company_id', $companyId)->count(),
            'total_amount'    => round($total,    2),
            'received_amount' => round($received, 2),
            'pending_amount'  => round($pending,  2),
        ]);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $purchase = $this->purchaseService->createPurchase($request->validated(), $this->companyId());
        return $this->created(new PurchaseResource($purchase));
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $purchase = Purchase::withoutGlobalScopes()
            ->with('items.product', 'items.warehouse', 'supplier', 'user')
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

    // ✅ ضيف
    public function receive($id): JsonResponse
    {
        $purchase = Purchase::withoutGlobalScopes()
            ->with('items')
            ->findOrFail($id);

        if ($purchase->status === 'received') {
            return $this->error('الطلب مستلم بالفعل', 422);
        }

        $purchase = $this->purchaseService->receivePurchase($purchase);
        return $this->success(new PurchaseResource($purchase), 'تم الاستلام وتحديث المخزون');
    }
}