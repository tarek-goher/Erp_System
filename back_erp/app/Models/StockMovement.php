<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * StockMovement — تتبع حركة المخزون (مبيعات، مشتريات، تحويل، تعديل)
 */
class StockMovement extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id', 'product_id', 'warehouse_id', 'user_id',
        'type', 'qty', 'qty_before', 'qty_after',
        'reference_type', 'reference_id', 'notes',
    ];

    protected $casts = [
        'qty'        => 'decimal:3',
        'qty_before' => 'decimal:3',
        'qty_after'  => 'decimal:3',
    ];

    public function product()   { return $this->belongsTo(Product::class); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function user()      { return $this->belongsTo(User::class); }
}
