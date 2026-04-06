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
        'company_id', 'name', 'email', 'phone',
        'address', 'tax_number', 'payment_terms',
        'notes', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function purchases()        { return $this->hasMany(Purchase::class); }
    public function purchaseInvoices() { return $this->hasMany(PurchaseInvoice::class); }
}
