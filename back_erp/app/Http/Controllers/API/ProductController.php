<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ProductController — إدارة المنتجات
 */
class ProductController extends BaseController
{
    private function authorizeProduct(Product $product): void
    {
        if ($product->company_id !== $this->companyId()) {
            abort(403, 'غير مصرح.');
        }
    }

    public function index(Request $request): JsonResponse
    {
        $products = Product::with(['category', 'warehouse',
    'locations' => function($q) use ($request) {
        if ($request->warehouse_id) {
            $q->where('warehouse_id', $request->warehouse_id);
        }
    }
])
            ->where('company_id', $this->companyId())
            ->when($request->search,      fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('sku', 'like', "%{$request->search}%")
                ->orWhere('barcode', 'like', "%{$request->search}%"))
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->when($request->low_stock,   fn($q) => $q->lowStock())
            ->when($request->active,      fn($q) => $q->active())
            ->paginate($this->perPage());

        return $this->success(ProductResource::collection($products)->response()->getData(true));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['sku'])) {
            do {
                $data['sku'] = 'SKU-' . strtoupper(uniqid());
            } while (Product::where('sku', $data['sku'])->exists());
        }

        $product = Product::create(array_merge($data, ['company_id' => $this->companyId()]));
        return $this->created(new ProductResource($product->load('category', 'warehouse')));
    }

    public function show(Product $product): JsonResponse
    {
        $this->authorizeProduct($product);
        return $this->success(new ProductResource($product->load('category', 'warehouse', 'stockMovements')));
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorizeProduct($product);
        $product->update($request->validated());
        return $this->success(new ProductResource($product->fresh('category')), 'تم تحديث المنتج.');
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorizeProduct($product);
        $product->delete();
        return $this->success(null, 'تم الحذف.');
    }

    /** POST /api/products/{product}/adjust-stock */
    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $this->authorizeProduct($product);

        $request->validate([
            'quantity'     => 'required|numeric|min:0',
            'warehouse_id' => 'required|exists:warehouses,id',
            'notes'        => 'nullable|string|max:500',
        ]);

        $newQty      = (float) $request->quantity;
        $oldQty      = (float) $product->qty;
        $diff        = $newQty - $oldQty;
        $warehouseId = $request->warehouse_id;
        $companyId   = $this->companyId();

        if ($diff !== 0) {
            // ── تحديث product_locations ──
            $location = ProductLocation::firstOrCreate(
                ['product_id' => $product->id, 'warehouse_id' => $warehouseId, 'company_id' => $companyId],
                ['qty' => 0]
            );
            $location->update(['qty' => max(0, $location->qty + $diff)]);

            // ── سجل الحركة ──
            $product->stockMovements()->create([
                'company_id'   => $companyId,
                'warehouse_id' => $warehouseId,
                'type'         => $diff > 0 ? 'in' : 'out',
                'qty'          => abs($diff),
                'qty_before'   => $oldQty,
                'qty_after'    => $newQty,
                'notes'        => $request->notes ?? 'تعديل يدوي',
            ]);
        }

        $product->update(['qty' => $newQty]);

        return $this->success(
            new ProductResource($product->fresh('category')),
            'تم تعديل المخزون بنجاح.'
        );
    }

    /** GET /api/products/low-stock */
    public function lowStock(): JsonResponse
    {
        $products = Product::where('company_id', $this->companyId())->lowStock()->with('category')->get();
        return $this->success(ProductResource::collection($products));
    }

    /** GET /api/products/stats */
    public function stats(): JsonResponse
    {
        $companyId = $this->companyId();
        return $this->success([
            'total'     => Product::where('company_id', $companyId)->count(),
            'active'    => Product::where('company_id', $companyId)->active()->count(),
            'low_stock' => Product::where('company_id', $companyId)->lowStock()->count(),
            'out_stock' => Product::where('company_id', $companyId)->where('qty', 0)->count(),
        ]);
    }
}