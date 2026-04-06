<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Attendance extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = ['company_id','employee_id','date','check_in','check_out','status','notes'];
    protected $casts = ['date'=>'date','check_in'=>'datetime','check_out'=>'datetime'];
    public function employee() { return $this->belongsTo(Employee::class); }
}
