<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appraisal extends Model {
    use HasFactory, BelongsToCompany;
    
    protected $fillable = [
        'company_id', 'employee_id', 'reviewer_id', 'template_id',
        'period', 'score', 'feedback', 'goals', 'criteria_scores',
        'status', 'linked_promotion', 'linked_raise', 'approval_chain',
        'reviewed_at',
    ];
    
    protected $casts = [
        'score' => 'decimal:2',
        'criteria_scores' => 'json',
        'approval_chain' => 'json',
        'linked_promotion' => 'boolean',
        'linked_raise' => 'decimal:2',
        'reviewed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // العلاقات
    public function employee(): BelongsTo { 
        return $this->belongsTo(Employee::class); 
    }
    
    public function reviewer(): BelongsTo { 
        return $this->belongsTo(User::class, 'reviewer_id'); 
    }
    
    public function template(): BelongsTo {
        return $this->belongsTo(AppraisalTemplate::class);
    }
    
    public function goals(): HasMany {
        return $this->hasMany(AppraisalGoal::class);
    }
    
    public function feedback360(): HasMany {
        return $this->hasMany(Appraisal360Feedback::class);
    }

    // Scopes
    public function scopeByStatus($query, $status) {
        return $query->where('status', $status);
    }

    public function scopeByPeriod($query, $period) {
        return $query->where('period', $period);
    }

    public function scopeByEmployee($query, $employeeId) {
        return $query->where('employee_id', $employeeId);
    }

    // Helpers
    public function isApproved(): bool {
        return $this->status === 'approved';
    }

    public function isRejected(): bool {
        return $this->status === 'rejected';
    }

    public function isPending(): bool {
        return $this->status === 'submitted';
    }

    public function isDraft(): bool {
        return $this->status === 'draft';
    }
}