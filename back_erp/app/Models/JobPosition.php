<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class JobPosition extends Model {
    use BelongsToCompany;
    protected $fillable = ['company_id','title','department','requirements','vacancies','status','closing_date'];
    protected $casts = ['closing_date'=>'date'];
    public function candidates() { return $this->hasMany(Candidate::class,'job_position_id'); }
}
