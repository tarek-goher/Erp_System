<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class LeaveRequest extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','employee_id','type','start_date',
        'end_date','days','reason','status','approved_by',
    ];
    protected $casts = ['start_date'=>'date','end_date'=>'date'];
    public function employee()  { return $this->belongsTo(Employee::class); }
    public function approvedBy(){ return $this->belongsTo(User::class,'approved_by'); }
}
