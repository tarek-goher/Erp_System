<?php
namespace App\Http\Controllers\API;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class CategoryController extends BaseController
{
    public function index(): JsonResponse
    {
        $categories = Category::with('children')->whereNull('parent_id')->get();
        return $this->success($categories);
    }
    public function store(Request $request): JsonResponse
{
    $data = $request->validate([
        'name'        => 'required|string|max:100',
        'description' => 'nullable|string',
        'parent_id'   => 'nullable|exists:categories,id',
    ]);
    $data['company_id'] = $this->companyId();
    return $this->created(Category::create($data));
}
    public function show(Category $category): JsonResponse
    {
        return $this->success($category->load('children', 'products'));
    }
    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'description' => 'nullable|string',
        ]);
        $category->update($data);
        return $this->success($category, 'Category updated');
    }
    public function destroy(Category $category): JsonResponse
    {
        $category->delete();
        return $this->success(null, 'Category deleted');
    }
}
