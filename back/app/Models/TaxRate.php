<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    use BelongsToCompany;
    protected $fillable = ['company_id','name','rate','type','applies_to','is_default','is_active'];
    protected $casts = ['is_default' => 'boolean', 'is_active' => 'boolean', 'rate' => 'float'];
}
