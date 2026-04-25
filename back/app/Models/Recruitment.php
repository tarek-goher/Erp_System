<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class Recruitment extends Model
{
    use HasFactory, BelongsToCompany, LogsActivity, SoftDeletes;

    protected $table = 'recruitments';

    protected $fillable = [
        'company_id',
        'title',
        'department',
        'requirements',
        'salary_range_min',
        'salary_range_max',
        'status',
        'open_date',
        'close_date',
        'is_archived',
    ];

    protected $casts = [
        'open_date' => 'date',
        'close_date' => 'date',
        'salary_range_min' => 'integer',
        'salary_range_max' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────
    public function applicants()
    {
        return $this->hasMany(Applicant::class, 'job_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeSearch($query, $search)
    {
        if (!$search) return $query;
        return $query->where('title', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDepartment($query, $department)
    {
        return $query->where('department', $department);
    }

    public function scopeSalaryRange($query, $min, $max)
    {
        return $query->whereBetween('salary_range_min', [$min, $max]);
    }

    // ── Accessors ────────────────────────────────────────────
    public function getApplicantCountAttribute()
    {
        return $this->applicants()->count();
    }

    public function getHiredCountAttribute()
    {
        return $this->applicants()->where('pipeline_stage', 'Hired')->count();
    }

    public function getHiringRateAttribute()
    {
        $total = $this->applicant_count;
        if ($total === 0) return 0;
        return round(($this->hired_count / $total) * 100, 2);
    }

    public function getPipelineStatsAttribute()
    {
        return [
            'Applied' => $this->applicants()->where('pipeline_stage', 'Applied')->count(),
            'Screening' => $this->applicants()->where('pipeline_stage', 'Screening')->count(),
            'Interview' => $this->applicants()->where('pipeline_stage', 'Interview')->count(),
            'Offer' => $this->applicants()->where('pipeline_stage', 'Offer')->count(),
            'Hired' => $this->applicants()->where('pipeline_stage', 'Hired')->count(),
            'Rejected' => $this->applicants()->where('pipeline_stage', 'Rejected')->count(),
        ];
    }

    // ── Methods ──────────────────────────────────────────────
    public function duplicate()
    {
        $newJob = $this->replicate(['deleted_at']);
        $newJob->title = $this->title . ' (Copy)';
        $newJob->status = 'draft';
        $newJob->save();
        
        return $newJob;
    }

    public function autoCloseIfExpired()
    {
        if ($this->close_date && $this->close_date->isPast() && $this->status === 'open') {
            $this->update(['status' => 'closed']);
        }
    }

    public function archive()
    {
        $this->update(['is_archived' => true]);
    }

    public function unarchive()
    {
        $this->update(['is_archived' => false]);
    }

    // ── Validation ───────────────────────────────────────────
    public static function validateBeforeSave($data)
    {
        $errors = [];

        if ($data['salary_range_min'] && $data['salary_range_max']) {
            if ($data['salary_range_min'] > $data['salary_range_max']) {
                $errors[] = 'salary_range_min must be less than or equal to salary_range_max';
            }
        }

        if ($data['open_date'] && $data['close_date']) {
            if ($data['open_date'] > $data['close_date']) {
                $errors[] = 'open_date must be before close_date';
            }
        }

        return $errors;
    }
}

?>