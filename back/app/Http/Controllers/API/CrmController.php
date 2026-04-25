<?php

namespace App\Http\Controllers\API;

use App\Models\CrmLead;
use App\Models\CrmActivity;
use App\Models\CrmOpportunity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CrmController — إدارة علاقات العملاء
 *
 * جديد:
 *  - kanban() → بيانات الـ Kanban مجمّعة بالـ stage
 *  - moveStage() → تحريك lead بين الـ columns بالـ drag & drop
 *  - convertToOpportunity() → تحويل lead لفرصة
 */
class CrmController extends BaseController
{
    // ── Leads ──────────────────────────────────────────────

    public function leads(Request $request): JsonResponse
    {
        $leads = CrmLead::with('activities', 'assignedTo')
            ->when($request->status,      fn($q) => $q->where('status',      $request->status))
            ->when($request->assigned_to, fn($q) => $q->where('assigned_to', $request->assigned_to))
            ->when($request->search,      fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($leads);
    }

    public function storeLead(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'email'       => 'nullable|email',
            'phone'       => 'nullable|string|max:30',
            'source'      => 'nullable|string|max:50',
            'status'      => 'nullable|in:new,contacted,qualified,unqualified',
            'assigned_to' => 'nullable|exists:users,id',
            'notes'       => 'nullable|string',
            'value'       => 'nullable|numeric|min:0',
        ]);

        return $this->created(
            CrmLead::create(['company_id' => $this->companyId(), ...$data])
        );
    }

    public function showLead(CrmLead $lead): JsonResponse
    {
        abort_if($lead->company_id !== $this->companyId(), 403);

        return $this->success($lead->load('activities', 'assignedTo'));
    }

    public function updateLead(Request $request, CrmLead $lead): JsonResponse
    {
        abort_if($lead->company_id !== $this->companyId(), 403);

        $lead->update($request->only('status', 'assigned_to', 'notes', 'value'));

        return $this->success($lead, 'تم تحديث الـ Lead.');
    }

    public function destroyLead(CrmLead $lead): JsonResponse
    {
        abort_if($lead->company_id !== $this->companyId(), 403);
        $lead->delete();

        return $this->success(null, 'تم الحذف.');
    }

    /**
     * GET /api/crm/kanban
     * بيانات الـ Kanban Board — كل stage مع الـ leads الخاصة بيه.
     * مرتبة بالـ value تنازلياً عشان أعلى فرصة تظهر أول.
     */
    public function kanban(): JsonResponse
    {
        $stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

        $leads = CrmLead::with('assignedTo')
            ->where('company_id', $this->companyId())
            ->get()
            ->groupBy('status');

        $kanban = collect($stages)->map(function ($stage) use ($leads) {
            $stageLeads = $leads->get($stage, collect());

            return [
                'stage'       => $stage,
                'count'       => $stageLeads->count(),
                'total_value' => $stageLeads->sum('value'),
                'leads'       => $stageLeads->sortByDesc('value')->values(),
            ];
        });

        return $this->success($kanban);
    }

    /**
     * PUT /api/crm/leads/{lead}/stage
     * تحريك lead لـ stage مختلف (drag & drop في الـ Kanban).
     */
    public function moveStage(Request $request, CrmLead $lead): JsonResponse
    {
        abort_if($lead->company_id !== $this->companyId(), 403);

        $data = $request->validate([
            'status' => 'required|in:new,contacted,qualified,proposal,negotiation,won,lost',
        ]);

        $lead->update($data);

        return $this->success($lead, 'تم تحريك الـ Lead.');
    }

    // ── Activities ─────────────────────────────────────────

    public function activities(Request $request): JsonResponse
    {
        $activities = CrmActivity::with('lead')
            ->when($request->lead_id, fn($q) => $q->where('crm_lead_id', $request->lead_id))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($activities);
    }

    public function storeActivity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'crm_lead_id' => 'required|exists:crm_leads,id',
            'type'        => 'required|in:call,email,meeting,note,whatsapp',
            'notes'       => 'nullable|string',
            'date'        => 'nullable|date',
            'outcome'     => 'nullable|string|max:200',
        ]);

        return $this->created(
            CrmActivity::create([
                'company_id' => $this->companyId(),
                'user_id'    => auth()->id(),
                ...$data,
            ])
        );
    }

    // ── Opportunities ──────────────────────────────────────

    public function opportunities(Request $request): JsonResponse
    {
        return $this->success(
            CrmOpportunity::with('lead', 'assignedTo')
                ->when($request->stage, fn($q) => $q->where('stage', $request->stage))
                ->paginate($this->perPage())
        );
    }

    public function storeOpportunity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lead_id'             => 'required|exists:crm_leads,id',
            'title'               => 'required|string|max:200',
            'value'               => 'nullable|numeric|min:0',
            'probability'         => 'nullable|numeric|between:0,100',
            'stage'               => 'nullable|string',
            'expected_close_date' => 'nullable|date',
        ]);

        return $this->created(
            CrmOpportunity::create([
                'company_id'  => $this->companyId(),
                'assigned_to' => auth()->id(),
                ...$data,
            ])
        );
    }

    public function updateOpportunity(Request $request, CrmOpportunity $opportunity): JsonResponse
    {
        abort_if($opportunity->company_id !== $this->companyId(), 403);

        $opportunity->update($request->only('stage', 'value', 'probability', 'expected_close_date'));

        return $this->success($opportunity, 'تم التحديث.');
    }

    // ── Pipeline & Stats ───────────────────────────────────

    public function pipeline(): JsonResponse
    {
        $pipeline = CrmLead::where('company_id', $this->companyId())
            ->selectRaw('status, count(*) as count, COALESCE(SUM(value), 0) as total_value')
            ->groupBy('status')
            ->get();

        return $this->success($pipeline);
    }

    public function stats(): JsonResponse
    {
        $companyId = $this->companyId();

        return $this->success([
            'total_leads'    => CrmLead::where('company_id', $companyId)->count(),
            'new_leads'      => CrmLead::where('company_id', $companyId)->where('status', 'new')->count(),
            'qualified'      => CrmLead::where('company_id', $companyId)->where('status', 'qualified')->count(),
            'won'            => CrmLead::where('company_id', $companyId)->where('status', 'won')->count(),
            'lost'           => CrmLead::where('company_id', $companyId)->where('status', 'lost')->count(),
            'pipeline_value' => CrmOpportunity::where('company_id', $companyId)->sum('value'),
            'win_rate'       => $this->winRate($companyId),
        ]);
    }

    private function winRate(int $companyId): float
    {
        $total = CrmLead::where('company_id', $companyId)->whereIn('status', ['won', 'lost'])->count();
        if ($total === 0) return 0;
        $won = CrmLead::where('company_id', $companyId)->where('status', 'won')->count();
        return round(($won / $total) * 100, 1);
    }
}
