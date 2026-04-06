<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class PosOrder extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','shift_id','customer_id','cashier_id',
        'subtotal','tax','discount','total','payment_method','status',
    ];
    protected $casts = ['subtotal'=>'decimal:2','tax'=>'decimal:2','discount'=>'decimal:2','total'=>'decimal:2'];
    public function shift()    { return $this->belongsTo(PosShift::class,'shift_id'); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function cashier()  { return $this->belongsTo(User::class,'cashier_id'); }
    public function items()    { return $this->hasMany(PosOrderItem::class); }
}
