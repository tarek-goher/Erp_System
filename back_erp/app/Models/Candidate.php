<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class Candidate extends Model {
    use BelongsToCompany;
    protected $fillable = ['company_id','job_position_id','name','email','phone','cv_path','status','interview_date','notes'];
    protected $casts = ['interview_date'=>'date'];
    public function jobPosition() { return $this->belongsTo(JobPosition::class,'job_position_id'); }
}
