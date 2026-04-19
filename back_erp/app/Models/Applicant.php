<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class Applicant extends Model
{
    use HasFactory, BelongsToCompany, LogsActivity;

    protected $fillable = [
        'company_id',
        'job_id',
        'full_name',
        'email',
        'phone',
        'cv_url',
        'cv_file_name',
        'cv_file_size',
        'cover_letter',
        'applied_date',
        'pipeline_stage',
        'rating',
        'notes',
    ];

    protected $casts = [
        'applied_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'rating' => 'integer',
    ];

    // ── Relationships ────────────────────────────────────────
    public function job()
    {
        return $this->belongsTo(Recruitment::class, 'job_id');
    }

    public function pipelineHistory()
    {
        return $this->hasMany(ApplicantPipelineHistory::class);
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeSearch($query, $search)
    {
        if (!$search) return $query;
        return $query->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
    }

    public function scopeByJob($query, $jobId)
    {
        return $query->where('job_id', $jobId);
    }

    public function scopeByStage($query, $stage)
    {
        return $query->where('pipeline_stage', $stage);
    }

    public function scopeHighRated($query, $minRating = 4)
    {
        return $query->where('rating', '>=', $minRating);
    }

    // ── Methods ──────────────────────────────────────────────
    public function moveToPipeline($newStage)
    {
        // Record history
        ApplicantPipelineHistory::create([
            'applicant_id' => $this->id,
            'from_stage' => $this->pipeline_stage,
            'to_stage' => $newStage,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        // Update stage
        $this->update(['pipeline_stage' => $newStage]);

        // Send notification if hired
        if ($newStage === 'Hired') {
            $this->notifyHired();
        }

        // Send notification if rejected
        if ($newStage === 'Rejected') {
            $this->notifyRejected();
        }
    }

    private function notifyHired()
    {
        // Send email notification
        $email = $this->email;
        $name = $this->full_name;
        $jobTitle = $this->job->title;
        
        // Queue notification
        \Mail::queue('notifications.applicant-hired', [
            'applicant_name' => $name,
            'job_title' => $jobTitle,
        ], function ($message) use ($email) {
            $message->to($email)->subject('Congratulations - Job Offer!');
        });
    }

    private function notifyRejected()
    {
        // Send rejection email
        $email = $this->email;
        $name = $this->full_name;

        \Mail::queue('notifications.applicant-rejected', [
            'applicant_name' => $name,
        ], function ($message) use ($email) {
            $message->to($email)->subject('Application Status Update');
        });
    }

    public function getJobTitleAttribute()
    {
        return $this->job?->title ?? 'Deleted Job';
    }
}