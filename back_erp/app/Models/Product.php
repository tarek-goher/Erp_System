<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id', 'category_id', 'name', 'name_en',
        'sku', 'barcode', 'unit', 'price', 'cost',
        'qty', 'min_qty', 'description', 'image',
        'purchase_price', 'tax_rate', 'is_active',
        'warehouse_id',
    ];

    protected $casts = [
        'price'          => 'decimal:2',
        'cost'           => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'qty'            => 'decimal:3',
        'min_qty'        => 'decimal:3',
        'tax_rate'       => 'decimal:2',
        'is_active'      => 'boolean',
    ];

    // ── Relationships ────────────────────────────────
    public function category()        { return $this->belongsTo(Category::class); }
    public function warehouse()       { return $this->belongsTo(Warehouse::class); }
    public function stockMovements()  { return $this->hasMany(StockMovement::class); }
    public function locations()       { return $this->hasMany(ProductLocation::class); }
    public function saleItems()       { return $this->hasMany(SaleItem::class); }
    public function purchaseItems()   { return $this->hasMany(PurchaseItem::class); }

    // ── Scopes ───────────────────────────────────────
    public function scopeActive($q)      { return $q->where('is_active', true); }
    public function scopeLowStock($q)    { return $q->whereColumn('qty', '<=', 'min_qty'); }
}
