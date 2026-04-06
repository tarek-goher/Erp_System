<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class PurchaseInvoice extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','supplier_id','purchase_id','invoice_number',
        'amount','tax','total','status','due_date','notes',
    ];
    protected $casts = ['amount'=>'decimal:2','tax'=>'decimal:2','total'=>'decimal:2','due_date'=>'date'];
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function purchase() { return $this->belongsTo(Purchase::class); }
}
