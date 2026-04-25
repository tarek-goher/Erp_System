<?php

namespace App\Models\BI;

use App\Models\User;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BICustomReport extends Model
{
    use BelongsToCompany;

    protected $table = 'bi_custom_reports';

    protected $fillable = [
        'company_id', 'created_by', 'report_name', 'slug', 'description',
        'report_type', 'columns', 'filters', 'sort_by', 'export_formats',
        'schedule_enabled', 'schedule_frequency', 'recipients'
    ];

    protected $casts = [
        'columns' => 'json',
        'filters' => 'json',
        'export_formats' => 'json',
        'recipients' => 'json'
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function executions(): HasMany
    {
        return $this->hasMany(BIReportExecution::class, 'report_id');
    }
}
