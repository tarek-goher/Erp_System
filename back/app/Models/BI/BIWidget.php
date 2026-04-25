<?php

namespace App\Models\BI;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BIWidget extends Model
{
    use BelongsToCompany;

    protected $table = 'bi_widgets';

    protected $fillable = [
        'company_id', 'dashboard_id', 'name', 'widget_type', 'data_source',
        'filters', 'display_config', 'position_x', 'position_y', 'width', 'height', 'is_editable'
    ];

    protected $casts = [
        'data_source' => 'json',
        'filters' => 'json',
        'display_config' => 'json'
    ];

    public function dashboard(): BelongsTo
    {
        return $this->belongsTo(BIDashboard::class, 'dashboard_id');
    }
}
