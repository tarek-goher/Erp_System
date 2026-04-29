<?php

namespace App\Events;

use App\Models\WorkOrder;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * ProductionCompleted — يُطلق عند إتمام أمر إنتاج
 */
class ProductionCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly WorkOrder $workOrder) {}
}
