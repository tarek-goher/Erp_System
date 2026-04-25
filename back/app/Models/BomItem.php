<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class BomItem extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'work_order_id',
        'product_id',
        'parent_bom_id',
        'qty',
        'unit_cost',
        'total_cost',
        'level',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'level' => 'integer',
        'is_active' => 'boolean',
    ];

    // ====== العلاقات ======
    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function parentBom(): BelongsTo
    {
        return $this->belongsTo(BomItem::class, 'parent_bom_id');
    }

    public function childItems(): HasMany
    {
        return $this->hasMany(BomItem::class, 'parent_bom_id');
    }

    // ====== Methods ======
    /**
     * احصل على جميع الـ child items recursively
     */
    public function getAllChildren()
    {
        $children = collect();
        foreach ($this->childItems()->active()->get() as $child) {
            $children->push($child);
            $children = $children->merge($child->getAllChildren());
        }
        return $children;
    }

    /**
     * احسب التكلفة الإجمالية مع الـ children
     */
    public function getTotalCostWithChildren(): float
    {
        $total = (float)($this->total_cost ?? 0);
        foreach ($this->childItems()->active()->get() as $child) {
            $total += $child->getTotalCostWithChildren();
        }
        return $total;
    }

    /**
     * احسب الكمية المطلوبة
     */
    public function getActualQuantityNeeded(float $multiplier = 1): float
    {
        return (float)$this->qty * $multiplier;
    }

    /**
     * تحقق من التوفر في المخزن
     */
    public function isAvailableInStock(): bool
    {
        $product = $this->product;
        if (!$product) return false;
        
        $totalNeeded = $this->getActualQuantityNeeded();
        $available = $product->current_qty ?? 0;
        return $available >= $totalNeeded;
    }

    /**
     * احسب lead time
     */
    public function calculateLeadTime(): int
    {
        $productLeadTime = $this->product->lead_time ?? 0;
        $childrenMaxTime = 0;
        
        foreach ($this->childItems()->active()->get() as $child) {
            $childrenMaxTime = max($childrenMaxTime, $child->calculateLeadTime());
        }
        
        return $productLeadTime + $childrenMaxTime;
    }

    // ====== Scopes ======
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeAtLevel(Builder $query, int $level): Builder
    {
        return $query->where('level', $level);
    }

    public function scopeForProduct(Builder $query, $productId): Builder
    {
        return $query->where('product_id', $productId);
    }

    public function scopeForWorkOrder(Builder $query, $workOrderId): Builder
    {
        return $query->where('work_order_id', $workOrderId);
    }

    public function scopeMultiLevel(Builder $query): Builder
    {
        return $query->where('level', '>', 1);
    }
}
