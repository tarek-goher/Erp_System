<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class CrmOpportunity extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','lead_id','title','value','probability',
        'stage','expected_close_date','assigned_to','notes',
    ];
    protected $casts = ['value'=>'decimal:2','probability'=>'decimal:2','expected_close_date'=>'date'];
    public function lead()       { return $this->belongsTo(CrmLead::class,'lead_id'); }
    public function assignedTo() { return $this->belongsTo(User::class,'assigned_to'); }
}
