<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Payroll\GeneratePayrollRequest;
use App\Http\Requests\Payroll\StorePayrollRequest;
use App\Http\Resources\PayrollResource;
use App\Jobs\ProcessMonthlyPayrollJob;
use App\Models\Payroll;
use App\Services\PayrollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * PayrollController — كشوف الرواتب
 *
 * Fix #12: update وdestroy وpay كانوا بدون تحقق من company_id
 *  - أي مستخدم authenticated كان يقدر يعدل أو يصرف راتب من شركة تانية
 *    لو عرف الـ ID (IDOR vulnerability).
 *  - الحل: abort_unless($payroll->company_id === $this->companyId(), 403)
 *    في كل method تُعدّل أو تحذف.
 */
class PayrollController extends BaseController
{
    public function __construct(private PayrollService $payrollService) {}

    public function index(Request $request): JsonResponse
    {
        $payrolls = Payroll::with('employee')
            ->where('company_id', $this->companyId())
            ->when($request->month,  fn($q) => $q->where('month', $request->month))
            ->when($request->year,   fn($q) => $q->where('year', $request->year))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($this->perPage());

        return $this->success(PayrollResource::collection($payrolls)->response()->getData(true));
    }

    public function store(StorePayrollRequest $request): JsonResponse
    {
        $payroll = $this->payrollService->createPayroll($request->validated(), $this->companyId());
        return $this->created(new PayrollResource($payroll->load('employee')));
    }

    public function show(Payroll $payroll): JsonResponse
    {
        // Fix #12: التحقق إن الـ payroll ينتمي لنفس شركة المستخدم
        abort_unless($payroll->company_id === $this->companyId(), 403);
        return $this->success(new PayrollResource($payroll->load('employee')));
    }

    public function update(Request $request, Payroll $payroll): JsonResponse
    {
        // Fix #12: منع تعديل رواتب شركات أخرى
        abort_unless($payroll->company_id === $this->companyId(), 403);

        $payroll->update($request->only('status', 'allowances', 'deductions', 'notes'));

        // إعادة حساب الصافي
        $payroll->update([
            'net_salary' => $payroll->basic_salary + $payroll->allowances - $payroll->deductions,
        ]);

        return $this->success(new PayrollResource($payroll->fresh('employee')), 'تم تحديث الراتب.');
    }

    public function destroy(Payroll $payroll): JsonResponse
    {
        // Fix #12: منع حذف رواتب شركات أخرى
        abort_unless($payroll->company_id === $this->companyId(), 403);

        $payroll->delete();
        return $this->success(null, 'تم الحذف.');
    }

    /** POST /api/payroll/generate — توليد رواتب شهر في الخلفية */
    public function generate(GeneratePayrollRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (config('queue.default') !== 'sync') {
            ProcessMonthlyPayrollJob::dispatch($data['month'], $data['year'], $this->companyId());
            return $this->success(null, "جاري توليد الرواتب لشهر {$data['month']}/{$data['year']} في الخلفية.");
        }

        $result = $this->payrollService->generateMonthlyPayroll($data['month'], $data['year'], $this->companyId());
        return $this->success($result, "{$result['count']} راتب تم توليده.");
    }

    /** POST /api/payroll/{payroll}/pay — صرف الراتب */
    public function pay(Payroll $payroll): JsonResponse
    {
        // Fix #12: منع صرف رواتب شركات أخرى
        abort_unless($payroll->company_id === $this->companyId(), 403);

        return $this->markAsPaid($payroll);
    }

    public function markAsPaid(Payroll $payroll): JsonResponse
    {
        $payroll = $this->payrollService->markAsPaid($payroll);
        return $this->success(new PayrollResource($payroll), 'تم تأكيد الصرف.');
    }

    /** GET /api/payroll/summary */
    public function summary(Request $request): JsonResponse
    {
        $month = $request->month ?? now()->month;
        $year  = $request->year  ?? now()->year;

        return $this->success($this->payrollService->getMonthlySummary($month, $year, $this->companyId()));
    }
}
