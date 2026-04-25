<?php

namespace App\Observers;

use App\Models\LeaveRequest;
use App\Services\IntegrationService;

class LeaveRequestObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(LeaveRequest $leave)
    {
        if ($leave->isDirty('status') && $leave->status === 'approved') {
            $this->integrationService->recordApprovedLeaveToAttendance($leave);
        }
    }
}
