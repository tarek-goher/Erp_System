<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * WorkflowController
 *
 * Workflow Builder للـ Helpdesk — CRUD على helpdesk_workflows + تشغيل يدوي
 * الـ DB migration موجودة: 2026_04_10_000002_create_helpdesk_workflows_table.php
 *
 * Routes:
 *   GET    /api/helpdesk/workflows
 *   POST   /api/helpdesk/workflows
 *   GET    /api/helpdesk/workflows/{id}
 *   PUT    /api/helpdesk/workflows/{id}
 *   DELETE /api/helpdesk/workflows/{id}
 *   PATCH  /api/helpdesk/workflows/{id}/toggle
 *   POST   /api/helpdesk/workflows/{id}/run     (تشغيل يدوي للاختبار)
 */
class WorkflowController extends BaseController
{
    // ── GET /api/helpdesk/workflows ──────────────────────────────
    public function index(): JsonResponse
    {
        $workflows = DB::table('helpdesk_workflows')
            ->where('company_id', $this->companyId())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($w) => $this->format($w));

        return $this->success($workflows);
    }

    // ── POST /api/helpdesk/workflows ─────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'trigger'     => 'required|in:ticket_created,ticket_assigned,ticket_resolved,sla_breach,status_changed,priority_changed',
            'conditions'  => 'nullable|array',
            'conditions.*.field'    => 'required_with:conditions|string',
            'conditions.*.operator' => 'required_with:conditions|in:equals,not_equals,contains,greater_than,less_than,is_empty,is_not_empty',
            'conditions.*.value'    => 'nullable',
            'actions'     => 'required|array|min:1',
            'actions.*.type'  => 'required|in:assign_to,change_status,change_priority,add_tag,send_notification,send_email',
            'actions.*.value' => 'nullable',
            'is_active'   => 'nullable|boolean',
        ]);

        $id = DB::table('helpdesk_workflows')->insertGetId([
            'company_id'  => $this->companyId(),
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'trigger'     => $data['trigger'],
            'conditions'  => json_encode($data['conditions'] ?? []),
            'actions'     => json_encode($data['actions']),
            'is_active'   => $data['is_active'] ?? true,
            'runs'        => 0,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $workflow = DB::table('helpdesk_workflows')->find($id);

        return $this->created($this->format($workflow), 'تم إنشاء الـ Workflow.');
    }

    // ── GET /api/helpdesk/workflows/{id} ─────────────────────────
    public function show(int $id): JsonResponse
    {
        $workflow = $this->findOrFail($id);
        return $this->success($this->format($workflow));
    }

    // ── PUT /api/helpdesk/workflows/{id} ─────────────────────────
    public function update(Request $request, int $id): JsonResponse
    {
        $workflow = $this->findOrFail($id);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'trigger'     => 'sometimes|in:ticket_created,ticket_assigned,ticket_resolved,sla_breach,status_changed,priority_changed',
            'conditions'  => 'nullable|array',
            'actions'     => 'sometimes|array|min:1',
            'is_active'   => 'nullable|boolean',
        ]);

        $updates = array_filter([
            'name'        => $data['name']        ?? null,
            'description' => $data['description'] ?? null,
            'trigger'     => $data['trigger']     ?? null,
            'conditions'  => isset($data['conditions']) ? json_encode($data['conditions']) : null,
            'actions'     => isset($data['actions'])    ? json_encode($data['actions'])    : null,
            'is_active'   => $data['is_active']   ?? null,
            'updated_at'  => now(),
        ], fn($v) => !is_null($v));

        DB::table('helpdesk_workflows')->where('id', $id)->update($updates);

        return $this->success($this->format(DB::table('helpdesk_workflows')->find($id)), 'تم التحديث.');
    }

    // ── DELETE /api/helpdesk/workflows/{id} ──────────────────────
    public function destroy(int $id): JsonResponse
    {
        $this->findOrFail($id);
        DB::table('helpdesk_workflows')->where('id', $id)->delete();
        return $this->success(null, 'تم حذف الـ Workflow.');
    }

    // ── PATCH /api/helpdesk/workflows/{id}/toggle ────────────────
    public function toggle(int $id): JsonResponse
    {
        $workflow = $this->findOrFail($id);
        $newState = !$workflow->is_active;

        DB::table('helpdesk_workflows')
            ->where('id', $id)
            ->update(['is_active' => $newState, 'updated_at' => now()]);

        return $this->success(
            ['is_active' => $newState],
            $newState ? 'تم تفعيل الـ Workflow.' : 'تم إيقاف الـ Workflow.'
        );
    }

    // ── POST /api/helpdesk/workflows/{id}/run ────────────────────
    // تشغيل يدوي على تذكرة معينة للاختبار
    public function run(Request $request, int $id): JsonResponse
    {
        $workflow = $this->findOrFail($id);

        $data = $request->validate([
            'ticket_id' => 'required|exists:support_tickets,id',
        ]);

        if (!$workflow->is_active) {
            return $this->error('الـ Workflow غير مفعّل.', 422);
        }

        $ticket  = \App\Models\Ticket::where('company_id', $this->companyId())->findOrFail($data['ticket_id']);
        $actions = json_decode($workflow->actions, true) ?? [];
        $results = [];

        foreach ($actions as $action) {
            $results[] = $this->executeAction($action, $ticket);
        }

        // تحديث عداد الـ runs
        DB::table('helpdesk_workflows')
            ->where('id', $id)
            ->update([
                'runs'     => DB::raw('runs + 1'),
                'last_run' => now(),
                'updated_at' => now(),
            ]);

        return $this->success(['actions_executed' => $results], 'تم تشغيل الـ Workflow.');
    }

    // ── Helpers ──────────────────────────────────────────────────

    private function findOrFail(int $id): object
    {
        $workflow = DB::table('helpdesk_workflows')
            ->where('id', $id)
            ->where('company_id', $this->companyId())
            ->first();

        if (!$workflow) {
            abort(404, 'Workflow غير موجود.');
        }

        return $workflow;
    }

    private function format(object $w): array
    {
        return [
            'id'          => $w->id,
            'name'        => $w->name,
            'description' => $w->description,
            'trigger'     => $w->trigger,
            'conditions'  => json_decode($w->conditions, true) ?? [],
            'actions'     => json_decode($w->actions,    true) ?? [],
            'is_active'   => (bool) $w->is_active,
            'runs'        => (int)  $w->runs,
            'last_run'    => $w->last_run,
            'created_at'  => $w->created_at,
        ];
    }

    /**
     * تنفيذ action واحد على تذكرة
     * يُستخدم في التشغيل اليدوي وفي WorkflowJob (لو أضفته لاحقاً)
     */
    public function executeAction(array $action, \App\Models\Ticket $ticket): array
    {
        $type  = $action['type']  ?? null;
        $value = $action['value'] ?? null;

        switch ($type) {
            case 'assign_to':
                if ($value) {
                    $ticket->update(['assigned_to' => $value]);
                }
                break;
            case 'change_status':
                if ($value && $ticket->canTransitionTo($value)) {
                    $ticket->update(['status' => $value]);
                }
                break;
            case 'change_priority':
                if ($value) {
                    $ticket->update(['priority' => $value]);
                }
                break;
            case 'add_tag':
                if ($value) {
                    $ticket->tags()->syncWithoutDetaching([$value]);
                }
                break;
            case 'send_notification':
                // يتوسّع لاحقاً — hook مع NotificationService
                break;
            case 'send_email':
                // يتوسّع لاحقاً — hook مع TicketMailer
                break;
        }

        return ['type' => $type, 'value' => $value, 'status' => 'executed'];
    }
}
