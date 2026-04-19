<?php

namespace App\Http\Controllers\API;

use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\AppraisalGoal;
use App\Models\Appraisal360Feedback;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AppraisalController — تقييم الأداء (Enhanced)
 *
 * مكتمل: CRUD + submit + approve/reject + stats + templates
 *        + 360° feedback + goals tracking
 * الفرونت موجود في app/appraisals/page.tsx
 */
class AppraisalController extends BaseController
{
    /** GET /api/appraisals */
    public function index(Request $request): JsonResponse
    {
        $appraisals = Appraisal::where('company_id', $this->companyId())
            ->with('employee', 'reviewer', 'template')
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
            'employee_id'       => 'required|exists:employees,id',
            'period'            => 'required|string|max:50',
            'template_id'       => 'nullable|exists:appraisal_templates,id',
            'score'             => 'nullable|numeric|between:0,100',
            'feedback'          => 'nullable|string|max:2000',
            'goals'             => 'nullable|string|max:2000',
            'criteria_scores'   => 'nullable|json',
            'linked_promotion'  => 'nullable|boolean',
            'linked_raise'      => 'nullable|numeric|between:0,100',
        ]);

        // تأكد مفيش تقييم موجود للموظف في نفس الفترة
        $exists = Appraisal::where('company_id', $this->companyId())
            ->where('employee_id', $data['employee_id'])
            ->where('period', $data['period'])
            ->exists();

        abort_if($exists, 422, 'يوجد تقييم مسبق لهذا الموظف في نفس الفترة.');

        $appraisal = Appraisal::create([
            'company_id'        => $this->companyId(),
            'reviewer_id'       => auth()->id(),
            'status'            => 'draft',
            'template_id'       => $data['template_id'] ?? null,
            'employee_id'       => $data['employee_id'],
            'period'            => $data['period'],
            'score'             => $data['score'] ?? null,
            'feedback'          => $data['feedback'] ?? null,
            'goals'             => $data['goals'] ?? null,
            'criteria_scores'   => $data['criteria_scores'] ?? null,
            'linked_promotion'  => $data['linked_promotion'] ?? false,
            'linked_raise'      => $data['linked_raise'] ?? null,
            'approval_chain'    => [],
        ]);

        return $this->created($appraisal->load('employee', 'reviewer', 'template'));
    }

    /** GET /api/appraisals/{appraisal} */
    public function show(Appraisal $appraisal): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);

        return $this->success($appraisal->load('employee', 'reviewer', 'template'));
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
        $companyId = $this->companyId();
        return $this->success([
            'total'     => Appraisal::where('company_id', $companyId)->count(),
            'draft'     => Appraisal::where('company_id', $companyId)->where('status', 'draft')->count(),
            'submitted' => Appraisal::where('company_id', $companyId)->where('status', 'submitted')->count(),
            'approved'  => Appraisal::where('company_id', $companyId)->where('status', 'approved')->count(),
            'rejected'  => Appraisal::where('company_id', $companyId)->where('status', 'rejected')->count(),
            'avg_score' => round(Appraisal::where('company_id', $companyId)->whereNotNull('score')->avg('score') ?? 0, 1),
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

    /** GET /api/appraisals/templates — قوالس التقييم */
    public function templates(): JsonResponse
    {
        $templates = AppraisalTemplate::where('company_id', $this->companyId())->get();
        return $this->success($templates);
    }

    /** POST /api/appraisals/{appraisal}/360-feedback — إضافة تقييم 360° */
    public function submit360Feedback(Request $request, Appraisal $appraisal): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);

        $data = $request->validate([
            'from_employee_id' => 'required|exists:employees,id',
            'relation'         => 'required|in:self,peer,manager,subordinate',
            'scores'           => 'nullable|json',
            'comments'         => 'nullable|string|max:2000',
        ]);

        $feedback = Appraisal360Feedback::create([
            'company_id'       => $this->companyId(),
            'appraisal_id'     => $appraisal->id,
            'from_employee_id' => $data['from_employee_id'],
            'relation'         => $data['relation'],
            'scores'           => $data['scores'] ?? [],
            'comments'         => $data['comments'] ?? '',
            'submitted_at'     => now(),
        ]);

        return $this->created($feedback->load('fromEmployee'), 'تم إضافة التقييم 360°');
    }

    /** GET /api/appraisals/{appraisal}/360-feedback — الحصول على تقييمات 360° */
    public function get360Feedback(Request $request, Appraisal $appraisal): JsonResponse
    {
        abort_if($appraisal->company_id !== $this->companyId(), 403);

        $feedback = Appraisal360Feedback::where('appraisal_id', $appraisal->id)
            ->with('fromEmployee')
            ->get();

        return $this->success($feedback);
    }

    /** GET /api/appraisals/goals — جميع الأهداف */
    public function getGoals(Request $request): JsonResponse
    {
        $goals = AppraisalGoal::where('company_id', $this->companyId())
            ->with('employee', 'appraisal')
            ->when($request->employee_id, fn($q) => $q->where('employee_id', $request->employee_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($goals);
    }

    /** POST /api/appraisals/goals — إنشاء هدف جديد */
    public function storeGoal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'appraisal_id' => 'nullable|exists:appraisals,id',
            'title'       => 'required|string|max:255',
            'target'      => 'required|numeric|min:1',
            'current'     => 'nullable|numeric|min:0',
            'unit'        => 'nullable|string|max:50',
            'due_date'    => 'nullable|date',
            'status'      => 'nullable|in:on_track,at_risk,completed,overdue',
        ]);

        $goal = AppraisalGoal::create([
            'company_id'   => $this->companyId(),
            'employee_id'  => $data['employee_id'],
            'appraisal_id' => $data['appraisal_id'] ?? null,
            'title'        => $data['title'],
            'target'       => $data['target'],
            'current'      => $data['current'] ?? 0,
            'unit'         => $data['unit'] ?? '',
            'due_date'     => $data['due_date'] ?? null,
            'status'       => $data['status'] ?? 'on_track',
        ]);

        return $this->created($goal->load('employee'), 'تم إنشاء الهدف');
    }

    /** PATCH /api/appraisals/goals/{goal} — تحديث الهدف */
    public function updateGoal(Request $request, AppraisalGoal $goal): JsonResponse
    {
        abort_if($goal->company_id !== $this->companyId(), 403);

        $data = $request->validate([
            'current' => 'nullable|numeric|min:0',
            'status'  => 'nullable|in:on_track,at_risk,completed,overdue',
            'title'   => 'nullable|string|max:255',
            'target'  => 'nullable|numeric|min:1',
        ]);

        $goal->update($data);

        return $this->success($goal, 'تم تحديث الهدف');
    }
}