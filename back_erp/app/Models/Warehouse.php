<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = ['company_id', 'name', 'location', 'capacity', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function products() { return $this->hasMany(Product::class); }
    public function stockMovements() { return $this->hasMany(StockMovement::class); }
}
