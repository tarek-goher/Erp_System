<?php

namespace App\Observers;

use App\Models\Payroll;
use App\Services\IntegrationService;

class PayrollObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(Payroll $payroll)
    {
        if ($payroll->isDirty('status') && $payroll->status === 'approved') {
            $this->integrationService->createPayrollJournalEntry($payroll);
        }
    }
}
