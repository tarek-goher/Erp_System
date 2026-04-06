<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PosOrderItem extends Model {
    protected $fillable = ['pos_order_id','product_id','qty','price','total'];
    protected $casts = ['qty'=>'decimal:3','price'=>'decimal:2','total'=>'decimal:2'];
    public function order()   { return $this->belongsTo(PosOrder::class,'pos_order_id'); }
    public function product() { return $this->belongsTo(Product::class); }
}
