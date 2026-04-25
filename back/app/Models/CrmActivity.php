<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class CrmActivity extends Model {
    use BelongsToCompany;
    protected $table = 'crm_activities';
    protected $fillable = ['company_id','lead_id','user_id','type','title','notes','activity_date','is_done'];
    protected $casts = ['activity_date'=>'datetime','is_done'=>'boolean'];
    public function lead() { return $this->belongsTo(CrmLead::class,'lead_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
