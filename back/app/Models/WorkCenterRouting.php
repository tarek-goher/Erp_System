<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class WorkCenterRouting extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'product_id',
        'work_center_id',
        'sequence',
        'setup_time',
        'operation_time',
        'unit_time',
        'description',
        'is_active',
    ];

    protected $casts = [
        'setup_time' => 'decimal:2',
        'operation_time' => 'decimal:2',
        'unit_time' => 'decimal:2',
        'is_active' => 'boolean',
        'sequence' => 'integer',
    ];

    // العلاقات
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function workCenter(): BelongsTo
    {
        return $this->belongsTo(WorkCenter::class);
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForProduct(Builder $query, $productId): Builder
    {
        return $query->where('product_id', $productId)->orderBy('sequence');
    }

    // Methods
    /**
     * احسب الوقت الإجمالي
     */
    public function getTotalTime(): float
    {
        return (float)$this->setup_time + (float)$this->operation_time;
    }

    /**
     * احسب الوقت لعدد معين من الوحدات
     */
    public function calculateTimeForQuantity(float $quantity): float
    {
        $operationTime = (float)$this->unit_time * $quantity;
        return (float)$this->setup_time + $operationTime;
    }

    /**
     * احسب التكلفة
     */
    public function calculateCost(float $quantity = 1): float
    {
        $totalTime = $this->calculateTimeForQuantity($quantity);
        $totalHours = $totalTime / 60;
        return $totalHours * $this->workCenter->hourly_rate;
    }
}
