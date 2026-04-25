<?php
namespace App\Http\Controllers\API;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class AuditLogController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::with('user:id,name,email')
            ->when($request->user_id, fn($q)=>$q->where('user_id',$request->user_id))
            ->when($request->action, fn($q)=>$q->where('action',$request->action))
            ->when($request->from, fn($q)=>$q->whereDate('created_at','>=',$request->from))
            ->when($request->to, fn($q)=>$q->whereDate('created_at','<=',$request->to))
            ->latest()->paginate($this->perPage());
        return $this->success($logs);
    }
    public function show(AuditLog $auditLog): JsonResponse { return $this->success($auditLog->load('user')); }
}
