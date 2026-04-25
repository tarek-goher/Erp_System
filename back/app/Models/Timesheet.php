<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class Timesheet extends Model
{
    use BelongsToCompany;
    protected $fillable = ['company_id','employee_id','project_id','date','hours','description','created_by'];
    protected $casts = ['date' => 'date', 'hours' => 'float'];
    public function employee() { return $this->belongsTo(Employee::class); }
    public function project()  { return $this->belongsTo(Project::class); }
}
