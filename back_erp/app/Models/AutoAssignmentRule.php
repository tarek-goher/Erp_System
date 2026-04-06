<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class AutoAssignmentRule extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'name', 'condition_type', 'condition_value',
        'assign_to_user_id', 'assign_to_team', 'priority', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assign_to_user_id');
    }
}
