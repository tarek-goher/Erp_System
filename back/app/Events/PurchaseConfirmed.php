<?php

namespace App\Events;

use App\Models\Purchase;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * PurchaseConfirmed — يُطلق عند تأكيد مشتريات جديدة
 */
class PurchaseConfirmed
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Purchase $purchase) {}
}
