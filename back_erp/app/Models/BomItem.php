<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class BomItem extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = ['company_id','work_order_id','product_id','qty','unit_cost','total_cost'];
    protected $casts = ['qty'=>'decimal:3','unit_cost'=>'decimal:2','total_cost'=>'decimal:2'];
    public function workOrder() { return $this->belongsTo(WorkOrder::class); }
    public function product()   { return $this->belongsTo(Product::class); }
}
