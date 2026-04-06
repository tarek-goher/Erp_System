<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

/**
 * SaleItem — بنود فاتورة المبيعات
 *
 * Fix: وُحّدت أسماء الأعمدة مع الـ Migration
 *   qty   → quantity
 *   price → unit_price
 */
class SaleItem extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',    // كان: qty
        'unit_price',  // كان: price
        'discount',
        'total',
    ];

    protected $casts = [
        'quantity'   => 'decimal:3',
        'unit_price' => 'decimal:2',
        'discount'   => 'decimal:2',
        'total'      => 'decimal:2',
    ];

    public function sale(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** السعر بعد الخصم */
    public function getNetPriceAttribute(): float
    {
        return max(0, (float) $this->unit_price - (float) $this->discount);
    }
}
