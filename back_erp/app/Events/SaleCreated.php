<?php

namespace App\Events;

use App\Models\Sale;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * SaleCreated — يُطلق عند إنشاء فاتورة مبيعات جديدة
 */
class SaleCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Sale $sale) {}
}
