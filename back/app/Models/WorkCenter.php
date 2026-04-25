<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class WorkCenter extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'code',
        'capacity',
        'hourly_rate',
        'status',
    ];

    protected $casts = [
        'capacity' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
    ];

    // العلاقات
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function routings(): HasMany
    {
        return $this->hasMany(WorkCenterRouting::class);
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->whereIn('status', ['active', 'maintenance']);
    }

    // Methods
    public function isOperational(): bool
    {
        return $this->status === 'active';
    }

    public function calculateProductionCost(float $setupTime, float $operationTime): float
    {
        $totalMinutes = $setupTime + $operationTime;
        $totalHours = $totalMinutes / 60;
        return $totalHours * $this->hourly_rate;
    }
}
