<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Attendance extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = ['company_id','employee_id','date','check_in','check_out','status','notes'];
    protected $casts = [
    'date'      => 'date:Y-m-d',
    'check_in'  => 'datetime:H:i',
    'check_out' => 'datetime:H:i',
];
    public function employee() { return $this->belongsTo(Employee::class); }
}
