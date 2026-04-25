<?php

namespace App\Observers;

use App\Models\FuelLog;
use App\Services\IntegrationService;

class FuelLogObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(FuelLog $fuelLog)
    {
        if ($fuelLog->isDirty('status') && $fuelLog->status === 'approved') {
            $this->integrationService->createFleetCostJournalEntry('fuel', $fuelLog);
        }
    }
}
