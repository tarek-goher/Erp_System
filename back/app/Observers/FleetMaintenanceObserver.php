<?php

namespace App\Observers;

use App\Models\FleetMaintenance;
use App\Services\IntegrationService;

class FleetMaintenanceObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(FleetMaintenance $maintenance)
    {
        if ($maintenance->isDirty('status') && $maintenance->status === 'approved') {
            $this->integrationService->createFleetCostJournalEntry('maintenance', $maintenance);
        }
    }
}
