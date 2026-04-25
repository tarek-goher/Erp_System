<?php

namespace App\Http\Controllers\API;

use App\Models\EscalationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EscalationRuleController extends BaseController
{
    // GET /api/escalation-rules
    public function index(): JsonResponse
    {
        $rules = EscalationRule::where('company_id', $this->companyId())
            ->orderBy('is_active', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success($rules);
    }

    // POST /api/escalation-rules
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'trigger'     => 'required|in:sla_response_breach,sla_resolution_breach,no_update',
            'after_hours' => 'required|integer|min:1|max:720',
            'action'      => 'required|in:notify_supervisor,reassign,change_priority,send_email',
            'action_data' => 'nullable|array',
            'is_active'   => 'nullable|boolean',
        ]);

        $rule = EscalationRule::create([...$data, 'company_id' => $this->companyId()]);

        return $this->created($rule, 'تم إضافة قاعدة التصعيد.');
    }

    // GET /api/escalation-rules/{rule}
    public function show(EscalationRule $escalationRule): JsonResponse
    {
        return $this->success($escalationRule);
    }

    // PUT /api/escalation-rules/{rule}
    public function update(Request $request, EscalationRule $escalationRule): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'trigger'     => 'sometimes|in:sla_response_breach,sla_resolution_breach,no_update',
            'after_hours' => 'sometimes|integer|min:1|max:720',
            'action'      => 'sometimes|in:notify_supervisor,reassign,change_priority,send_email',
            'action_data' => 'nullable|array',
            'is_active'   => 'nullable|boolean',
        ]);

        $escalationRule->update($data);

        return $this->success($escalationRule, 'تم تحديث القاعدة.');
    }

    // DELETE /api/escalation-rules/{rule}
    public function destroy(EscalationRule $escalationRule): JsonResponse
    {
        $escalationRule->delete();
        return $this->success(null, 'تم حذف القاعدة.');
    }
}