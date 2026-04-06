<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class EscalationRule extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','name','condition_type','condition_value',
        'action_type','action_target','is_active',
    ];
    protected $casts = ['is_active'=>'boolean'];
}
