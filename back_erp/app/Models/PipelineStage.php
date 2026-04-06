<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class PipelineStage extends Model {
    use BelongsToCompany;
    protected $fillable = ['company_id','name','color','order','is_won','is_lost'];
    protected $casts = ['is_won'=>'boolean','is_lost'=>'boolean'];
    public function leads() { return $this->hasMany(CrmLead::class,'stage_id'); }
}
