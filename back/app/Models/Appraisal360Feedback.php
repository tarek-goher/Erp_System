<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appraisal360Feedback extends Model {
    use HasFactory, BelongsToCompany;
    protected $table = 'appraisal_360_feedback';
    protected $fillable = [
        'company_id', 'appraisal_id', 'from_employee_id', 
        'relation', 'scores', 'comments', 'submitted_at'
    ];
    protected $casts = [
        'scores' => 'json',
        'submitted_at' => 'datetime'
    ];
    public function appraisal() { 
        return $this->belongsTo(Appraisal::class); 
    }
    public function fromEmployee() { 
        return $this->belongsTo(Employee::class, 'from_employee_id'); 
    }
}