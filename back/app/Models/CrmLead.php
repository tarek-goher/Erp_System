<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class CrmLead extends Model {
    use BelongsToCompany, SoftDeletes;
    protected $table = 'crm_leads';
    protected $fillable = ['company_id','name','contact_name','email','phone','source','expected_value','stage_id','assigned_to','customer_id','expected_close_date','probability','notes'];
    protected $casts = ['expected_value'=>'float','probability'=>'integer','expected_close_date'=>'date'];
    public function stage()      { return $this->belongsTo(PipelineStage::class,'stage_id'); }
    public function assignedTo() { return $this->belongsTo(User::class,'assigned_to'); }
    public function customer()   { return $this->belongsTo(Customer::class); }
    public function activities() { return $this->hasMany(CrmActivity::class,'lead_id'); }
}
