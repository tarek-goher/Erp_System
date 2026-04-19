<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name', 'code', 'type', 'status', 'rating',
        'email', 'phone', 'country', 'city', 'street', 'address',
        'contact_person', 'contact_phone',
        'payment_method', 'payment_terms', 'bank_name', 'bank_account',
        'tax_number', 'products_notes', 'notes', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rating'    => 'integer',
    ];

    public function purchases()        { return $this->hasMany(Purchase::class); }
    public function purchaseInvoices() { return $this->hasMany(PurchaseInvoice::class); }
    public function ledger() { return $this->hasMany(SupplierLedger::class); }
}