<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class FixedAsset extends Model {
    use BelongsToCompany;
    protected $fillable = ['company_id','name','category','purchase_value','salvage_value','depreciation_rate','depreciation_method','purchase_date','useful_life_years','accumulated_depreciation','status'];
    protected $casts = ['purchase_date'=>'date','purchase_value'=>'float','salvage_value'=>'float','depreciation_rate'=>'float','accumulated_depreciation'=>'float'];
    public function calculateAnnualDepreciation(): float {
        return match($this->depreciation_method) {
            'straight_line'     => ($this->purchase_value - $this->salvage_value) / max(1, $this->useful_life_years),
            'declining_balance' => ($this->purchase_value - $this->accumulated_depreciation) * ($this->depreciation_rate / 100),
            default             => 0,
        };
    }
}
