<?php

namespace App\Jobs;

use App\Services\PayrollService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ProcessMonthlyPayrollJob — توليد رواتب شهرية في الخلفية
 * الاستخدام: ProcessMonthlyPayrollJob::dispatch($month, $year, $companyId)
 */
class ProcessMonthlyPayrollJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 300; // 5 دقائق

    public function __construct(
        private readonly int $month,
        private readonly int $year,
        private readonly int $companyId
    ) {}

    public function handle(PayrollService $payrollService): void
    {
        Log::info("Processing payroll for company {$this->companyId}, month {$this->month}/{$this->year}");

        $result = $payrollService->generateMonthlyPayroll($this->month, $this->year, $this->companyId);

        Log::info("Payroll processed: {$result['count']} records generated, {$result['skipped']} skipped.");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Payroll job failed for company {$this->companyId}: " . $exception->getMessage());
    }
}
