<?php

namespace App\Models\BI;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BIKPIMetric extends Model
{
    use BelongsToCompany;

    protected $table = 'bi_kpi_metrics';

    protected $fillable = [
        'company_id', 'metric_name', 'metric_key', 'data_type',
        'calculation_method', 'custom_query', 'target_values', 'frequency'
    ];

    protected $casts = [
        'target_values' => 'json'
    ];

    public function data(): HasMany
    {
        return $this->hasMany(BIKPIData::class, 'kpi_metric_id');
    }

    public function getLatestValue()
    {
        return $this->data()
            ->orderBy('date', 'desc')
            ->first();
    }
}
