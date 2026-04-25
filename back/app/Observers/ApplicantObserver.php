<?php

namespace App\Observers;

use App\Models\Applicant;
use App\Services\IntegrationService;

class ApplicantObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(Applicant $applicant)
    {
        if ($applicant->isDirty('status') && $applicant->status === 'approved') {
            $this->integrationService->convertApprovedCandidateToEmployee($applicant);
        }
    }
}
