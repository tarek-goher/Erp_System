<?php

namespace App\Observers;

use App\Models\PosOrder;
use App\Services\IntegrationService;

class PosOrderObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(PosOrder $posOrder)
    {
        if ($posOrder->isDirty('status') && ($posOrder->status === 'completed' || $posOrder->status === 'paid')) {
            $this->integrationService->createPosJournalEntry($posOrder);
        }
    }
}
