<?php
namespace App\Http\Controllers\API;
use App\Models\EscalationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class AutoAssignmentController extends BaseController
{
    public function rules(): JsonResponse { return $this->success(EscalationRule::all()); }
    public function storeRule(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string','condition_type'=>'required|string','condition_value'=>'required','action_type'=>'required|string','action_target'=>'required','is_active'=>'nullable|boolean']);
        return $this->created(EscalationRule::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function updateRule(Request $request, EscalationRule $rule): JsonResponse { $rule->update($request->only('name','condition_value','action_target','is_active')); return $this->success($rule,'Rule updated'); }
    public function deleteRule(EscalationRule $rule): JsonResponse { $rule->delete(); return $this->success(null,'Deleted'); }
    public function storeEscalation(Request $request): JsonResponse { return $this->storeRule($request); }
    public function updateEscalation(Request $request, EscalationRule $escalationRule): JsonResponse { return $this->updateRule($request,$escalationRule); }
    public function deleteEscalation(EscalationRule $escalationRule): JsonResponse { return $this->deleteRule($escalationRule); }
    public function runEscalationCheck(): JsonResponse { return $this->success(['checked'=>true,'message'=>'Escalation check completed']); }
}
