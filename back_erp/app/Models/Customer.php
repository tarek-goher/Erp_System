<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id', 'name', 'email', 'phone',
        'address', 'tax_number', 'balance',
        'credit_limit', 'notes', 'is_active',
    ];

    protected $casts = [
        'balance'      => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    public function sales()      { return $this->hasMany(Sale::class); }
    public function crmLeads()   { return $this->hasMany(CrmLead::class); }
}
