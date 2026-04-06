<?php
namespace App\Http\Controllers\API;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class LeaveRequestController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $leaves = LeaveRequest::with('employee')
            ->when($request->status, fn($q)=>$q->where('status',$request->status))
            ->when($request->employee_id, fn($q)=>$q->where('employee_id',$request->employee_id))
            ->latest()->paginate($this->perPage());
        return $this->success($leaves);
    }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['employee_id'=>'required|exists:employees,id','type'=>'required|in:annual,sick,emergency,unpaid','start_date'=>'required|date','end_date'=>'required|date|after_or_equal:start_date','reason'=>'nullable|string']);
        $days = now()->parse($data['start_date'])->diffInDays($data['end_date']) + 1;
        return $this->created(LeaveRequest::create(['company_id'=>$this->companyId(),'days'=>$days,'status'=>'pending',...$data]));
    }
    public function show(LeaveRequest $leaveRequest): JsonResponse { return $this->success($leaveRequest->load('employee')); }
    public function update(Request $request, LeaveRequest $leaveRequest): JsonResponse { $leaveRequest->update($request->only('status','approved_by')); return $this->success($leaveRequest,'Leave updated'); }
    public function destroy(LeaveRequest $leaveRequest): JsonResponse { $leaveRequest->delete(); return $this->success(null,'Deleted'); }
    public function approve(LeaveRequest $leaveRequest): JsonResponse
    {
        $leaveRequest->update(['status'=>'approved','approved_by'=>auth()->id()]);
        return $this->success($leaveRequest,'Leave approved');
    }
    public function reject(LeaveRequest $leaveRequest): JsonResponse
    {
        $leaveRequest->update(['status'=>'rejected','approved_by'=>auth()->id()]);
        return $this->success($leaveRequest,'Leave rejected');
    }
}
