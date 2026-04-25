<?php

namespace App\Http\Controllers\API;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EcommerceProductController extends BaseController
{
    /**
     * عرض قائمة المنتجات للمتجر الإلكتروني
     * GET /api/ecommerce/products
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::where('company_id', $this->companyId())
            ->where('is_active', true)
            ->with('category');

        // البحث
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        // تصفية حسب الفئة
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        // ترتيب
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $this->success($query->paginate($this->perPage()));
    }

    /**
     * عرض تفاصيل منتج واحد
     * GET /api/ecommerce/products/{product}
     */
    public function show(Product $product): JsonResponse
    {
        abort_unless($product->company_id === $this->companyId(), 403);
        abort_unless($product->is_active, 404);

        return $this->success($product->load('category', 'reviews'));
    }

    /**
     * إنشاء منتج جديد (للمتجر الإلكتروني)
     * POST /api/ecommerce/products
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'price'         => 'required|numeric|min:0',
            'cost'          => 'nullable|numeric|min:0',
            'category_id'   => 'nullable|exists:categories,id',
            'sku'           => 'nullable|unique:products,sku',
            'qty'           => 'nullable|numeric|min:0',
            'is_active'     => 'boolean',
            'image_url'     => 'nullable|url',
        ]);

        $data['company_id'] = $this->companyId();

        $product = Product::create($data);

        return $this->created($product);
    }

    /**
     * تحديث منتج
     * PUT/PATCH /api/ecommerce/products/{product}
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        abort_unless($product->company_id === $this->companyId(), 403);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'description'   => 'nullable|string',
            'price'         => 'sometimes|numeric|min:0',
            'cost'          => 'nullable|numeric|min:0',
            'category_id'   => 'nullable|exists:categories,id',
            'sku'           => 'sometimes|unique:products,sku,' . $product->id,
            'qty'           => 'nullable|numeric|min:0',
            'is_active'     => 'boolean',
            'image_url'     => 'nullable|url',
        ]);

        $product->update($data);

        return $this->success($product, 'Product updated');
    }

    /**
     * حذف منتج
     * DELETE /api/ecommerce/products/{product}
     */
    public function destroy(Product $product): JsonResponse
    {
        abort_unless($product->company_id === $this->companyId(), 403);

        $product->delete();

        return $this->success(null, 'Product deleted');
    }

    /**
     * الحصول على الفئات المتاحة
     * GET /api/ecommerce/products/categories/list
     */
    public function getCategories(): JsonResponse
    {
        $categories = Category::where('company_id', $this->companyId())->get();
        return $this->success($categories);
    }
}
