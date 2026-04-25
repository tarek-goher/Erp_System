<?php

namespace App\Http\Controllers\API;

use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagController extends BaseController
{
    // GET /api/tags
    public function index(): JsonResponse
    {
        $tags = Tag::where('company_id', $this->companyId())
            ->withCount('tickets')
            ->orderBy('name')
            ->get();

        return $this->success($tags);
    }

    // POST /api/tags
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'required|string|max:50',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        // منع التكرار
        $exists = Tag::where('company_id', $this->companyId())
            ->where('name', $data['name'])
            ->exists();

        if ($exists) {
            return $this->error('هذا الوسم موجود بالفعل.', 422);
        }

        $tag = Tag::create([...$data, 'company_id' => $this->companyId()]);

        return $this->created($tag, 'تم إضافة الوسم.');
    }

    // PUT /api/tags/{tag}
    public function update(Request $request, Tag $tag): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'sometimes|string|max:50',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $tag->update($data);

        return $this->success($tag, 'تم تحديث الوسم.');
    }

    // DELETE /api/tags/{tag}
    public function destroy(Tag $tag): JsonResponse
    {
        $tag->tickets()->detach();
        $tag->delete();
        return $this->success(null, 'تم حذف الوسم.');
    }
}