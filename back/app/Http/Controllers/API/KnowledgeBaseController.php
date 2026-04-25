<?php

namespace App\Http\Controllers\API;

use App\Models\KnowledgeArticle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeBaseController extends BaseController
{
    // ── GET /api/knowledge ───────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = KnowledgeArticle::query()
            ->where(fn($q) => $q
                ->whereNull('company_id')                    // مقالات عامة
                ->orWhere('company_id', $this->companyId())  // مقالات الشركة
            );

        // فلترة
        if ($request->category) {
            $query->where('category', $request->category);
        }

        // المستخدم العادي يشوف:
        // - المقالات المنشورة (لكل الناس)
        // - المسودات (كل المسودات يشوفها العادي)
        $user = auth()->user();
        if (!$user->hasRole(['manager', 'super-admin'])) {
            $query->where(fn($q) => $q
                ->where('is_published', true)        // المنشورة
                ->orWhere('is_published', false)     // أو كل المسودات
            );
        }

        $articles = $query
            ->select('id', 'title', 'content', 'category', 'is_published', 'views', 'created_at', 'updated_at')
            ->latest('updated_at')
            ->paginate($this->perPage());

        return $this->success($articles);
    }

    // ── GET /api/knowledge/search ────────────────────────────────
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:2|max:200']);

        $term = $request->q;

        $results = KnowledgeArticle::where('is_published', true)
            ->where(fn($q) => $q
                ->whereNull('company_id')
                ->orWhere('company_id', $this->companyId())
            )
            ->where(fn($q) => $q
                ->where('title',   'like', "%{$term}%")
                ->orWhere('content', 'like', "%{$term}%")
            )
            ->select('id', 'title', 'category', 'views', 'created_at')
            ->orderByDesc('views')
            ->limit(20)
            ->get();

        return $this->success($results);
    }

    // ── GET /api/knowledge/categories ────────────────────────────
    public function categories(): JsonResponse
    {
        $cats = KnowledgeArticle::where(fn($q) => $q
                ->whereNull('company_id')
                ->orWhere('company_id', $this->companyId())
            )
            ->where('is_published', true)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->sort()
            ->values();

        return $this->success($cats);
    }

    // ── GET /api/knowledge/{id} ──────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $article = $this->findOrFail($id);

        $user = auth()->user();
        if (!$article->is_published && !$user->hasRole(['manager', 'super-admin'])) {
            return $this->notFound('المقال غير موجود.');
        }

        $article->increment('views');

        return $this->success($article);
    }

    // ── POST /api/knowledge ──────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'required|string',
            'category'     => 'nullable|string|max:100',
            'is_published' => 'nullable|boolean',
        ]);

        $article = KnowledgeArticle::create([
            'company_id'   => $this->companyId(),
            'created_by'   => auth()->id(),
            'title'        => $data['title'],
            'content'      => $data['content'],
            'category'     => $data['category'] ?? null,
            'is_published' => $data['is_published'] ?? false,
            'views'        => 0,
        ]);

        return $this->created($article, 'تم إنشاء المقال.');
    }

    // ── PUT /api/knowledge/{id} ──────────────────────────────────
    public function update(Request $request, int $id): JsonResponse
    {
        $article = $this->findOrFail($id);

        $data = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'content'      => 'sometimes|string',
            'category'     => 'nullable|string|max:100',
            'is_published' => 'nullable|boolean',
        ]);

        $article->update($data);

        return $this->success($article->fresh(), 'تم تحديث المقال.');
    }

    // ── DELETE /api/knowledge/{id} ───────────────────────────────
    public function destroy(int $id): JsonResponse
    {
        $article = $this->findOrFail($id);
        $article->delete();
        return $this->success(null, 'تم حذف المقال.');
    }

    // ── PATCH /api/knowledge/{id}/publish ────────────────────────
    public function togglePublish(int $id): JsonResponse
    {
        $article  = $this->findOrFail($id);
        $newState = !$article->is_published;
        $article->update(['is_published' => $newState]);

        return $this->success(
            ['is_published' => $newState],
            $newState ? 'تم نشر المقال.' : 'تم إلغاء نشر المقال.'
        );
    }

    // ── Helper ───────────────────────────────────────────────────

    private function findOrFail(int $id): KnowledgeArticle
    {
        return KnowledgeArticle::where(fn($q) => $q
                ->whereNull('company_id')
                ->orWhere('company_id', $this->companyId())
            )
            ->findOrFail($id);
    }
}