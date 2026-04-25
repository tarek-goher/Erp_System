<?php
namespace App\Models;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Model;

class SlaPolicy extends Model
{
    use BelongsToCompany;
    protected $fillable = [
        'company_id','name','priority','first_response_hours','resolution_hours',
        'business_hours_only','is_active',
    ];

    protected $casts = ['business_hours_only' => 'boolean', 'is_active' => 'boolean'];

    public function tickets() { return $this->hasMany(SupportTicket::class, 'sla_policy_id'); }
}
