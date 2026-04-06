<?php

namespace App\Services;

use App\Events\PayrollGenerated;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Payroll;
use Illuminate\Support\Facades\DB;

/**
 * PayrollService — business logic لكشوف الرواتب
 *
 * Fix #6: getMonthlySummary — Query Builder Consumption Bug
 *  - كان $query يُستخدم مباشرةً بدون clone، فبعد كل ->where() يتغير نفس الـ query.
 *  - النتيجة: paid_count = 0 دايماً لأن الـ where('status','pending') كان لسه موجود
 *    على نفس الـ builder لما نضيف where('status','paid').
 *  - الحل: استخدام (clone $query) قبل كل where إضافي.
 */
class PayrollService
{
    /**
     * إنشاء راتب واحد يدوياً
     */
    public function createPayroll(array $data, ?int $companyId): Payroll
    {
        return DB::transaction(function () use ($data, $companyId) {
            $employee = Employee::withoutGlobalScopes()->findOrFail($data['employee_id']);

            $basic      = $data['basic_salary'] ?? $employee->salary;
            $allowances = $data['allowances']   ?? 0;
            $deductions = $data['deductions']   ?? 0;
            $net        = $basic + $allowances - $deductions;

            $payroll = Payroll::create([
                'company_id'   => $companyId,
                'employee_id'  => $data['employee_id'],
                'month'        => $data['month'],
                'year'         => $data['year'],
                'basic_salary' => $basic,
                'allowances'   => $allowances,
                'deductions'   => $deductions,
                'net_salary'   => $net,
                'status'       => 'pending',
                'notes'        => $data['notes'] ?? null,
            ]);

            PayrollGenerated::dispatch($payroll);

            return $payroll;
        });
    }

    /**
     * توليد رواتب شهرية لكل موظفي الشركة
     */
    public function generateMonthlyPayroll(int $month, int $year, int $companyId): array
    {
        $employees = Employee::where('company_id', $companyId)
            ->where('status', 'active')
            ->get();

        $count   = 0;
        $skipped = 0;

        foreach ($employees as $employee) {
            $exists = Payroll::where('employee_id', $employee->id)
                ->where('month', $month)
                ->where('year', $year)
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            $workingDays = $this->getWorkingDays($month, $year);
            $absenceDays = $this->getAbsenceDays($employee->id, $month, $year);
            $deductions  = $absenceDays > 0
                ? round(($employee->salary / $workingDays) * $absenceDays, 2)
                : 0;

            Payroll::create([
                'company_id'   => $companyId,
                'employee_id'  => $employee->id,
                'month'        => $month,
                'year'         => $year,
                'basic_salary' => $employee->salary,
                'allowances'   => 0,
                'deductions'   => $deductions,
                'net_salary'   => $employee->salary - $deductions,
                'status'       => 'pending',
            ]);

            $count++;
        }

        return ['count' => $count, 'skipped' => $skipped];
    }

    /**
     * تأكيد صرف الراتب
     */
    public function markAsPaid(Payroll $payroll): Payroll
    {
        $payroll->update(['status' => 'paid', 'paid_at' => now()]);
        return $payroll->fresh('employee');
    }

    /**
     * ملخص شهري
     *
     * Fix #6: استخدام (clone $query) قبل كل where إضافي
     *  - بدون clone، كل ->where() بتغير نفس الـ builder object
     *  - pending_count كان يرجع 0 دايماً لأنه بيشيل where('paid') وwhere('pending') معاً
     */
    public function getMonthlySummary(int $month, int $year, ?int $companyId): array
    {
        $query = Payroll::where('company_id', $companyId)
            ->where('month', $month)
            ->where('year', $year);

        return [
            'total_payrolls' => (clone $query)->count(),
            'total_net'      => (clone $query)->sum('net_salary'),
            // Fix: clone قبل كل where إضافي عشان ما يتراكمش
            'paid_count'     => (clone $query)->where('status', 'paid')->count(),
            'pending_count'  => (clone $query)->where('status', 'pending')->count(),
        ];
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function getWorkingDays(int $month, int $year): int
    {
        $days     = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $workDays = 0;
        for ($d = 1; $d <= $days; $d++) {
            $dow = date('N', mktime(0, 0, 0, $month, $d, $year));
            if ($dow < 6) {
                $workDays++;
            }
        }
        return $workDays;
    }

    private function getAbsenceDays(int $employeeId, int $month, int $year): int
    {
        return Attendance::where('employee_id', $employeeId)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->where('status', 'absent')
            ->count();
    }
}
