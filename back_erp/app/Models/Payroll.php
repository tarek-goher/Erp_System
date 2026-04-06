<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Payroll extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','employee_id','month','year',
        'basic_salary','allowances','deductions','net_salary','status','paid_at',
    ];
    protected $casts = [
        'basic_salary'=>'decimal:2','allowances'=>'decimal:2',
        'deductions'=>'decimal:2','net_salary'=>'decimal:2','paid_at'=>'datetime',
    ];
    public function employee() { return $this->belongsTo(Employee::class); }
}
