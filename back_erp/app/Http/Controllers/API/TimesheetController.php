<?php
namespace App\Http\Controllers\API;

use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * TimesheetController
 * Fix: أضفنا company_id filter في كل query لمنع data leak بين الشركات
 */
class TimesheetController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $timesheets = Attendance::with('employee')
            ->where('company_id', $this->companyId())   // ✅ Fix: company isolation
            ->when($request->employee_id, fn($q) => $q->where('employee_id', $request->employee_id))
            ->when($request->month, fn($q) => $q->whereMonth('date', $request->month))
            ->when($request->year,  fn($q) => $q->whereYear('date',  $request->year))
            ->latest('date')
            ->paginate($this->perPage());

        return $this->success($timesheets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id'  => 'required|exists:employees,id',
            'date'         => 'required|date',
            'check_in'     => 'nullable|date_format:H:i',
            'check_out'    => 'nullable|date_format:H:i',
            'hours_worked' => 'nullable|numeric|min:0',
            'notes'        => 'nullable|string',
        ]);

        $timesheet = Attendance::updateOrCreate(
            ['employee_id' => $data['employee_id'], 'date' => $data['date']],
            ['company_id'  => $this->companyId(), ...$data]   // ✅ company_id دايماً يتحفظ
        );

        return $this->created($timesheet->load('employee'));
    }

    public function summary(Request $request): JsonResponse
    {
        $month = $request->month ?? now()->month;
        $year  = $request->year  ?? now()->year;

        $data = Attendance::where('company_id', $this->companyId())   // ✅ Fix
            ->whereMonth('date', $month)
            ->whereYear('date',  $year)
            ->selectRaw('employee_id, count(*) as days, AVG(TIMESTAMPDIFF(MINUTE, check_in, check_out) / 60) as avg_hours')
            ->groupBy('employee_id')
            ->with('employee:id,name')
            ->get();

        return $this->success($data);
    }
}
