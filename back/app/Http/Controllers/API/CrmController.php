<?php

namespace App\Http\Controllers\API;

use App\Models\CrmActivity;
use App\Models\CrmLead;
use App\Models\CrmOpportunity;
use App\Models\PipelineStage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class CrmController extends BaseController
{
    private const DEFAULT_STAGE_DEFINITIONS = [
        ['slug' => 'new',         'name' => 'New',         'color' => '#64748b', 'is_won' => false, 'is_lost' => false],
        ['slug' => 'contacted',   'name' => 'Contacted',   'color' => '#2563eb', 'is_won' => false, 'is_lost' => false],
        ['slug' => 'qualified',   'name' => 'Qualified',   'color' => '#7c3aed', 'is_won' => false, 'is_lost' => false],
        ['slug' => 'proposal',    'name' => 'Proposal',    'color' => '#d97706', 'is_won' => false, 'is_lost' => false],
        ['slug' => 'negotiation', 'name' => 'Negotiation', 'color' => '#ea580c', 'is_won' => false, 'is_lost' => false],
        ['slug' => 'won',         'name' => 'Won',         'color' => '#16a34a', 'is_won' => true,  'is_lost' => false],
        ['slug' => 'lost',        'name' => 'Lost',        'color' => '#dc2626', 'is_won' => false, 'is_lost' => true],
    ];

    public function leads(Request $request): JsonResponse
    {
        $companyId = $this->companyId();

        $leads = CrmLead::with('activities', 'assignedTo', 'stage')
            ->where('company_id', $companyId)
            ->when($request->status, fn (Builder $q) => $this->applyStageFilter($q, $companyId, (string) $request->status))
            ->when($request->assigned_to, fn (Builder $q) => $q->where('assigned_to', $request->assigned_to))
            ->when($request->search, fn (Builder $q) => $q->where('name', 'like', '%' . $request->search . '%'))
            ->latest()
            ->paginate($this->perPage());

        $leads->getCollection()->transform(fn (CrmLead $lead) => $this->transformLead($lead));

        return $this->success($leads);
    }

    public function storeLead(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'email'       => 'nullable|email',
            'phone'       => 'nullable|string|max:30',
            'source'      => 'nullable|string|max:50',
            'status'      => 'nullable|in:new,contacted,qualified,proposal,negotiation,won,lost',
            'assigned_to' => 'nullable|exists:users,id',
            'notes'       => 'nullable|string',
            'value'       => 'nullable|numeric|min:0',
        ]);

        $companyId = $this->companyId();
        $lead = CrmLead::create([
            'company_id'     => $companyId,
            'name'           => $data['name'],
            'email'          => $data['email'] ?? null,
            'phone'          => $data['phone'] ?? null,
            'source'         => $data['source'] ?? null,
            'assigned_to'    => $data['assigned_to'] ?? null,
            'notes'          => $data['notes'] ?? null,
            'expected_value' => $data['value'] ?? 0,
            'stage_id'       => $this->resolveStageByStatus($companyId, (string) ($data['status'] ?? 'new'))?->id,
        ]);

        return $this->created($this->transformLead($lead->load('assignedTo', 'stage')));
    }

    public function showLead(CrmLead $lead): JsonResponse
    {
        abort_if($lead->company_id !== $this->companyId(), 403);

        return $this->success($this->transformLead($lead->load('activities', 'assignedTo', 'stage')));
    }

    public function updateLead(Request $request, CrmLead $lead): JsonResponse
    {
        abort_if($lead->company_id !== $this->companyId(), 403);

        $data = $request->validate([
            'status'      => 'nullable|in:new,contacted,qualified,proposal,negotiation,won,lost',
            'assigned_to' => 'nullable|exists:users,id',
            'notes'       => 'nullable|string',
            'value'       => 'nullable|numeric|min:0',
        ]);

        $update = [];

        if (array_key_exists('status', $data)) {
            $update['stage_id'] = $this->resolveStageByStatus($lead->company_id, (string) $data['status'])?->id;
        }
        if (array_key_exists('assigned_to', $data)) {
            $update['assigned_to'] = $data['assigned_to'];
        }
        if (array_key_exists('notes', $data)) {
            $update['notes'] = $data['notes'];
        }
        if (array_key_exists('value', $data)) {
            $update['expected_value'] = $data['value'];
        }

        if ($update !== []) {
            $lead->update($update);
        }

        return $this->success($this->transformLead($lead->fresh(['assignedTo', 'stage'])), 'Lead updated successfully.');
    }

    public function destroyLead(CrmLead $lead): JsonResponse
    {
        abort_if($lead->company_id !== $this->companyId(), 403);

        $lead->delete();

        return $this->success(null, 'Lead deleted successfully.');
    }

    public function kanban(): JsonResponse
    {
        $companyId = $this->companyId();
        $stages = $this->stagesForCompany($companyId);

        $leadsByStage = CrmLead::with('assignedTo', 'stage')
            ->where('company_id', $companyId)
            ->get()
            ->groupBy(fn (CrmLead $lead) => $this->stageSlug($lead->stage));

        $kanban = $stages->map(function (PipelineStage $stage) use ($leadsByStage) {
            $slug = $this->stageSlug($stage);
            $stageLeads = $leadsByStage->get($slug, collect());

            return [
                'stage'       => $slug,
                'count'       => $stageLeads->count(),
                'total_value' => (float) $stageLeads->sum('expected_value'),
                'leads'       => $stageLeads
                    ->sortByDesc('expected_value')
                    ->map(fn (CrmLead $lead) => $this->transformLead($lead))
                    ->values(),
            ];
        })->values();

        return $this->success($kanban);
    }

    public function moveStage(Request $request, CrmLead $lead): JsonResponse
    {
        abort_if($lead->company_id !== $this->companyId(), 403);

        $data = $request->validate([
            'status' => 'required|in:new,contacted,qualified,proposal,negotiation,won,lost',
        ]);

        $lead->update([
            'stage_id' => $this->resolveStageByStatus($lead->company_id, $data['status'])?->id,
        ]);

        return $this->success($this->transformLead($lead->fresh(['assignedTo', 'stage'])), 'Lead stage updated successfully.');
    }

    public function activities(Request $request): JsonResponse
    {
        $activities = CrmActivity::with('lead')
            ->where('company_id', $this->companyId())
            ->when($request->lead_id, fn (Builder $q) => $q->where('lead_id', $request->lead_id))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($activities);
    }

    public function storeActivity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lead_id'       => 'required|exists:crm_leads,id',
            'type'          => 'required|in:call,email,meeting,note,task',
            'title'         => 'required|string|max:255',
            'notes'         => 'nullable|string',
            'activity_date' => 'nullable|date',
            'is_done'       => 'nullable|boolean',
        ]);

        return $this->created(
            CrmActivity::create([
                'company_id'    => $this->companyId(),
                'user_id'       => auth()->id(),
                'lead_id'       => $data['lead_id'],
                'type'          => $data['type'],
                'title'         => $data['title'],
                'notes'         => $data['notes'] ?? null,
                'activity_date' => $data['activity_date'] ?? now(),
                'is_done'       => $data['is_done'] ?? false,
            ])
        );
    }

    public function opportunities(Request $request): JsonResponse
    {
        return $this->success(
            CrmOpportunity::with('lead', 'assignedTo')
                ->when($request->stage, fn (Builder $q) => $q->where('stage', $request->stage))
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

        return $this->success($opportunity, 'Opportunity updated successfully.');
    }

    public function pipeline(): JsonResponse
    {
        $companyId = $this->companyId();

        $pipeline = $this->stagesForCompany($companyId)->map(function (PipelineStage $stage) use ($companyId) {
            $slug = $this->stageSlug($stage);

            return [
                'stage'       => $slug,
                'count'       => CrmLead::where('company_id', $companyId)->where('stage_id', $stage->id)->count(),
                'total_value' => (float) CrmLead::where('company_id', $companyId)->where('stage_id', $stage->id)->sum('expected_value'),
            ];
        })->values();

        return $this->success($pipeline);
    }

    public function stats(): JsonResponse
    {
        $companyId = $this->companyId();

        return $this->success([
            'total_leads'    => CrmLead::where('company_id', $companyId)->count(),
            'new_leads'      => $this->countLeadsForStatus($companyId, 'new'),
            'qualified'      => $this->countLeadsForStatus($companyId, 'qualified'),
            'won'            => $this->countLeadsForStatus($companyId, 'won'),
            'lost'           => $this->countLeadsForStatus($companyId, 'lost'),
            'pipeline_value' => (float) CrmLead::where('company_id', $companyId)
                ->whereHas('stage', fn (Builder $q) => $q->where('is_lost', false))
                ->sum('expected_value'),
            'win_rate'       => $this->winRate($companyId),
        ]);
    }

    private function winRate(int $companyId): float
    {
        $total = CrmLead::where('company_id', $companyId)
            ->whereHas('stage', fn (Builder $q) => $q->where('is_won', true)->orWhere('is_lost', true))
            ->count();

        if ($total === 0) {
            return 0;
        }

        $won = $this->countLeadsForStatus($companyId, 'won');

        return round(($won / $total) * 100, 1);
    }

    private function countLeadsForStatus(int $companyId, string $status): int
    {
        $stage = $this->resolveStageByStatus($companyId, $status);

        if (!$stage) {
            return 0;
        }

        return CrmLead::where('company_id', $companyId)->where('stage_id', $stage->id)->count();
    }

    private function applyStageFilter(Builder $query, int $companyId, string $status): Builder
    {
        $stage = $this->resolveStageByStatus($companyId, $status);

        if (!$stage) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('stage_id', $stage->id);
    }

    private function stagesForCompany(int $companyId): Collection
    {
        $stages = PipelineStage::where('company_id', $companyId)->orderBy('order')->orderBy('id')->get();

        if ($stages->isNotEmpty()) {
            return $stages;
        }

        foreach (self::DEFAULT_STAGE_DEFINITIONS as $index => $definition) {
            PipelineStage::create([
                'company_id' => $companyId,
                'name'       => $definition['name'],
                'color'      => $definition['color'],
                'order'      => $index + 1,
                'is_won'     => $definition['is_won'],
                'is_lost'    => $definition['is_lost'],
            ]);
        }

        return PipelineStage::where('company_id', $companyId)->orderBy('order')->orderBy('id')->get();
    }

    private function resolveStageByStatus(int $companyId, string $status): ?PipelineStage
    {
        $status = strtolower(trim($status));
        $stages = $this->stagesForCompany($companyId);

        if ($status === 'won') {
            return $stages->firstWhere('is_won', true)
                ?? $stages->first(fn (PipelineStage $stage) => $this->stageSlug($stage) === 'won');
        }

        if ($status === 'lost') {
            return $stages->firstWhere('is_lost', true)
                ?? $stages->first(fn (PipelineStage $stage) => $this->stageSlug($stage) === 'lost');
        }

        return $stages->first(fn (PipelineStage $stage) => $this->stageSlug($stage) === $status)
            ?? $stages->first();
    }

    private function stageSlug(?PipelineStage $stage): string
    {
        if (!$stage) {
            return 'new';
        }

        if ($stage->is_won) {
            return 'won';
        }

        if ($stage->is_lost) {
            return 'lost';
        }

        $normalized = strtolower(trim((string) $stage->name));

        return match ($normalized) {
            'new' => 'new',
            'contacted' => 'contacted',
            'qualified' => 'qualified',
            'proposal' => 'proposal',
            'negotiation' => 'negotiation',
            default => 'new',
        };
    }

    private function transformLead(CrmLead $lead): array
    {
        return [
            'id'         => $lead->id,
            'name'       => $lead->name,
            'email'      => $lead->email,
            'phone'      => $lead->phone,
            'value'      => (float) ($lead->expected_value ?? 0),
            'status'     => $this->stageSlug($lead->stage),
            'source'     => $lead->source,
            'notes'      => $lead->notes,
            'assignedTo' => $lead->assignedTo ? ['name' => $lead->assignedTo->name] : null,
            'created_at' => optional($lead->created_at)?->toISOString(),
        ];
    }
}
