<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppraisalGoal extends Model {
    use HasFactory, BelongsToCompany;
    protected $table = 'appraisal_goals';
    protected $fillable = [
        'company_id', 'appraisal_id', 'employee_id', 'title', 
        'target', 'current', 'unit', 'due_date', 'status'
    ];
    protected $casts = ['due_date' => 'date'];
    public function appraisal() { 
        return $this->belongsTo(Appraisal::class); 
    }
    public function employee() { 
        return $this->belongsTo(Employee::class); 
    }
}