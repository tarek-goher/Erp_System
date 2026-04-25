<?php

namespace App\Models\BI;

use App\Models\User;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BIDashboard extends Model
{
    use BelongsToCompany;

    protected $table = 'bi_dashboards';

    protected $fillable = [
        'company_id', 'created_by', 'name', 'slug', 'description',
        'visibility', 'layout_config', 'is_default', 'is_active', 'refresh_interval'
    ];

    protected $casts = [
        'layout_config' => 'json'
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function widgets(): HasMany
    {
        return $this->hasMany(BIWidget::class, 'dashboard_id');
    }

    public function setAsDefault(): void
    {
        $this->company->dashboards()->update(['is_default' => false]);
        $this->update(['is_default' => true]);
    }
}
