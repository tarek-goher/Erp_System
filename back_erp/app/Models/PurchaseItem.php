<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * PurchaseItem — بنود أوامر الشراء
 *
 * Fix: وُحّدت أسماء الأعمدة مع الـ Migration
 *   qty   → quantity
 *   price → unit_price
 */
class PurchaseItem extends Model
{
    protected $fillable = [
        'purchase_id',
        'product_id',
        'quantity',    // كان: qty
        'unit_price',  // كان: price
        'total',
    ];

    protected $casts = [
        'quantity'   => 'decimal:3',
        'unit_price' => 'decimal:2',
        'total'      => 'decimal:2',
    ];

    public function purchase(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
