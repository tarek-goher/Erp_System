<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * PayrollGenerated — يُطلق بعد توليد رواتب شهر كامل
 */
class PayrollGenerated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int $month,
        public readonly int $year,
        public readonly int $companyId,
        public readonly int $count
    ) {}
}
