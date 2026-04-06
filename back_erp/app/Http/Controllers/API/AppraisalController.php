<?php

namespace App\Http\Controllers\API;

use App\Models\Appraisal;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AppraisalController — تقييم الأداء
 *
 * مكتمل: CRUD + submit + approve/reject + stats
 * الفرونت موجود في app/appraisals/page.tsx
 */
class AppraisalController extends BaseController
{
    /** GET /api/appraisals */
    public function index(Request $request): JsonResponse
    {
        $appraisals = Appraisal::with('employee', 'reviewer')
            ->when($request->status,      fn($q) => $q->where('status', $request->status))
            ->when($request->employee_id, fn($q) => $q->where('employee_id', $request->employee_id))
            ->when($request->period,      fn($q) => $q->where('period', $request->period))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($appraisals);
    }

    /** POST /api/appraisals */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period'      => 'required|string|max:50',  // مثل "Q1-2024" أو "2024-H1"
            'score'       => 'nullable|numeric|between:0,100',
            'feedback'    => 'nullable|string|max:2000',
            'goals'       => 'nullable|string|max:2000',
        ]);

        // تأكد مفيش تقييم موجود للموظف في نفس الفترة
        $exists = Appraisal::where('employee_id', $data['employee_id'])
            ->where('period', $data['period'])
            ->exists();

        abort_if($exists, 422, 'يوجد تقييم مسبق لهذا الموظف في نفس الفترة.');

        $appraisal = Appraisal::create([
            'company_id'  => $this->companyId(),
            'reviewer_id' => auth()->id(),
            'status'      => 'draft',
            ...$data,
        ]);

        return $this->created($appraisal->load('employee', 'reviewer'));
    }

    /** GET /api/appraisals/{appraisal} */
    public function show(Appraisal $appraisal): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);

        return $this->success($appraisal->load('employee', 'reviewer'));
    }

    /** PUT /api/appraisals/{appraisal} */
    public function update(Request $request, Appraisal $appraisal): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);
        abort_if($appraisal->status === 'approved', 422, 'لا يمكن تعديل تقييم معتمد.');

        $data = $request->validate([
            'score'       => 'nullable|numeric|between:0,100',
            'feedback'    => 'nullable|string|max:2000',
            'goals'       => 'nullable|string|max:2000',
            'status'      => 'nullable|in:draft,submitted,approved,rejected',
            'reviewed_at' => 'nullable|date',
        ]);

        $appraisal->update($data);

        return $this->success($appraisal->load('employee', 'reviewer'), 'تم تحديث التقييم.');
    }

    /** DELETE /api/appraisals/{appraisal} */
    public function destroy(Appraisal $appraisal): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);
        abort_if($appraisal->status === 'approved', 422, 'لا يمكن حذف تقييم معتمد.');

        $appraisal->delete();

        return $this->success(null, 'تم حذف التقييم.');
    }

    /** POST /api/appraisals/{appraisal}/submit — الموظف يرسل للمراجعة */
    public function submit(Appraisal $appraisal): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);
        abort_if($appraisal->status !== 'draft', 422, 'التقييم مش في حالة مسودة.');

        $appraisal->update(['status' => 'submitted']);

        return $this->success($appraisal, 'تم إرسال التقييم للمراجعة.');
    }

    /** POST /api/appraisals/{appraisal}/approve — المدير يعتمد */
    public function approve(Appraisal $appraisal): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);
        abort_if($appraisal->status !== 'submitted', 422, 'التقييم يجب أن يكون في حالة إرسال أولاً.');

        $appraisal->update([
            'status'      => 'approved',
            'reviewed_at' => now(),
            'reviewer_id' => auth()->id(),
        ]);

        return $this->success($appraisal, 'تم اعتماد التقييم.');
    }

    /** POST /api/appraisals/{appraisal}/reject — المدير يرفض */
    public function reject(Appraisal $appraisal, Request $request): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);

        $data = $request->validate(['feedback' => 'nullable|string|max:1000']);

        $appraisal->update([
            'status'      => 'rejected',
            'reviewed_at' => now(),
            'reviewer_id' => auth()->id(),
            ...$data,
        ]);

        return $this->success($appraisal, 'تم رفض التقييم.');
    }

    /** GET /api/appraisals/stats — إحصائيات التقييمات */
    public function stats(): JsonResponse
    {
        return $this->success([
            'total'     => Appraisal::count(),
            'draft'     => Appraisal::where('status', 'draft')->count(),
            'submitted' => Appraisal::where('status', 'submitted')->count(),
            'approved'  => Appraisal::where('status', 'approved')->count(),
            'rejected'  => Appraisal::where('status', 'rejected')->count(),
            'avg_score' => round(Appraisal::whereNotNull('score')->avg('score') ?? 0, 1),
        ]);
    }

    /** GET /api/appraisals/periods — الفترات المتاحة */
    public function periods(): JsonResponse
    {
        $periods = [];
        $year    = now()->year;

        for ($y = $year; $y >= $year - 2; $y--) {
            $periods[] = "Q1-{$y}";
            $periods[] = "Q2-{$y}";
            $periods[] = "Q3-{$y}";
            $periods[] = "Q4-{$y}";
            $periods[] = "{$y}-H1";
            $periods[] = "{$y}-H2";
            $periods[] = "Annual-{$y}";
        }

        return $this->success($periods);
    }
}
