<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Appraisal extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','employee_id','reviewer_id','period',
        'score','feedback','status','reviewed_at',
    ];
    protected $casts = ['score'=>'decimal:2','reviewed_at'=>'datetime'];
    public function employee() { return $this->belongsTo(Employee::class); }
    public function reviewer() { return $this->belongsTo(User::class,'reviewer_id'); }
}
