<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

/**
 * ServiceCatalog — كتالوج الخدمات الديناميكي
 *
 * ضعه في: app/Models/ServiceCatalog.php
 */
class ServiceCatalog extends Model
{
    use BelongsToCompany;

    protected $table = 'service_catalog';

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'icon',
        'category',               // IT | HR | Admin | Finance
        'form_schema',            // json — حقول الفورم الديناميكية
        'default_priority',       // low | medium | high | urgent
        'default_assigned_role',
        'sla_hours',
        'requires_approval',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'form_schema'       => 'array',
        'is_active'         => 'boolean',
        'requires_approval' => 'boolean',
    ];

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'service_id');
    }
}
