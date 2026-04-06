<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkOrder extends Model
{
    use BelongsToCompany, SoftDeletes;

    protected $fillable = [
        'company_id', 'product_id', 'qty_planned', 'qty_produced',
        'planned_date', 'status', 'notes',
    ];

    protected $casts = [
        'qty_planned'  => 'float',
        'qty_produced' => 'float',
        'planned_date' => 'date',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function bom()
    {
        return $this->hasMany(BomItem::class, 'product_id', 'product_id');
    }
}
