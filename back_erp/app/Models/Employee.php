<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;
    protected $fillable = [
        'company_id', 'name', 'role', 'department',
        'salary', 'phone', 'email', 'hire_date', 'status', 'avatar', 'user_id',
    ];
    protected $casts = ['salary' => 'decimal:2', 'hire_date' => 'date'];
    public function user()        { return $this->belongsTo(User::class); }
    public function attendances() { return $this->hasMany(Attendance::class); }
    public function payrolls()    { return $this->hasMany(Payroll::class); }
}
