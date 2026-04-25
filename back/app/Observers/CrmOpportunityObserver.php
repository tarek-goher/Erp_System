<?php

namespace App\Observers;

use App\Models\CrmOpportunity;
use App\Services\IntegrationService;

class CrmOpportunityObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(CrmOpportunity $opportunity)
    {
        if ($opportunity->isDirty('stage') && $opportunity->stage === 'closed-won') {
            $this->integrationService->convertOpportunityToSale($opportunity);
        }
    }
}
