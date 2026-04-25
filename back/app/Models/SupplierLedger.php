<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierLedger extends Model
{
    protected $table = 'supplier_ledger';
    
    protected $fillable = [
        'supplier_id', 'company_id', 'type', 'amount',
        'direction', 'balance_after', 'reference', 'notes', 'created_by',
    ];

    protected $casts = [
        'amount'        => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function creator()  { return $this->belongsTo(User::class, 'created_by'); }
}