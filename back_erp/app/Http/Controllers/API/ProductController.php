<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ProductController — إدارة المنتجات
 */
class ProductController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::with('category', 'warehouse')
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
        $data    = $request->validated();
        $product = Product::create(array_merge($data, ['company_id' => $this->companyId()]));
        return $this->created(new ProductResource($product->load('category', 'warehouse')));
    }

    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);
        return $this->success(new ProductResource($product->load('category', 'warehouse', 'stockMovements')));
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);
        $product->update($request->validated());
        return $this->success(new ProductResource($product->fresh('category')), 'تم تحديث المنتج.');
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);
        $product->delete();
        return $this->success(null, 'تم الحذف.');
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
            'total'      => Product::where('company_id', $companyId)->count(),
            'active'     => Product::where('company_id', $companyId)->active()->count(),
            'low_stock'  => Product::where('company_id', $companyId)->lowStock()->count(),
            'out_stock'  => Product::where('company_id', $companyId)->where('qty', 0)->count(),
        ]);
    }
}
