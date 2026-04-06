<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class StockTransfer extends Model {
    use BelongsToCompany;
    protected $fillable = ['company_id','ref','from_warehouse_id','to_warehouse_id','product_id','qty','status','user_id','notes'];
    public function fromWarehouse() { return $this->belongsTo(Warehouse::class,'from_warehouse_id'); }
    public function toWarehouse()   { return $this->belongsTo(Warehouse::class,'to_warehouse_id'); }
    public function product()       { return $this->belongsTo(Product::class); }
    public function user()          { return $this->belongsTo(User::class); }
}
