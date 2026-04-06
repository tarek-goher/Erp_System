<?php
namespace App\Http\Controllers\API;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class AttendanceController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $attendance = Attendance::with('employee')
            ->when($request->employee_id, fn($q)=>$q->where('employee_id',$request->employee_id))
            ->when($request->date, fn($q)=>$q->whereDate('date',$request->date))
            ->when($request->month, fn($q)=>$q->whereMonth('date',$request->month))
            ->latest('date')->paginate($this->perPage());
        return $this->success($attendance);
    }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['employee_id'=>'required|exists:employees,id','date'=>'required|date','check_in'=>'nullable','check_out'=>'nullable','status'=>'nullable|in:present,absent,late,half_day','notes'=>'nullable|string']);
        $record = Attendance::updateOrCreate(['employee_id'=>$data['employee_id'],'date'=>$data['date']], ['company_id'=>$this->companyId(),...$data]);
        return $this->created($record->load('employee'));
    }
    public function show(Attendance $attendance): JsonResponse { return $this->success($attendance->load('employee')); }
    public function update(Request $request, Attendance $attendance): JsonResponse
    {
        $attendance->update($request->only('check_in','check_out','status','notes'));
        return $this->success($attendance,'Attendance updated');
    }
    public function destroy(Attendance $attendance): JsonResponse { $attendance->delete(); return $this->success(null,'Deleted'); }
    public function summary(Request $request): JsonResponse
    {
        $month = $request->month ?? now()->month;
        $year  = $request->year ?? now()->year;
        $data  = Attendance::whereMonth('date',$month)->whereYear('date',$year)
            ->selectRaw('status, count(*) as count')->groupBy('status')->get();
        return $this->success($data);
    }
}
