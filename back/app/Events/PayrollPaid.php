<?php

namespace App\Events;

use App\Models\Payroll;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * PayrollPaid — يُطلق عند دفع الراتب (وليس عند الإنشاء)
 */
class PayrollPaid
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Payroll $payroll) {}
}
