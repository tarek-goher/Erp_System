<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public float $available;
    public float $requested;

    public function __construct(float $available, float $requested)
    {
        $this->available = $available;
        $this->requested = $requested;
        parent::__construct("المخزون غير كافٍ — المتاح: {$available}، المطلوب: {$requested}");
    }
}