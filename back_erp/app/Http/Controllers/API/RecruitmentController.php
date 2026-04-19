<?php

// ══════════════════════════════════════════════════════════
// app/Http/Controllers/API/RecruitmentController.php
// ══════════════════════════════════════════════════════════

namespace App\Http\Controllers\API;

use App\Models\Recruitment;
use App\Models\Applicant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecruitmentController extends BaseController
{
    // ── Get all jobs with advanced filters ────────────────────
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $page = $request->get('page', 1);
        $query = Recruitment::query();

        // Multi-tenancy
        $query->where('company_id', auth()->user()->company_id);

        // Search
        if ($request->has('search')) {
            $query->search($request->get('search'));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->byStatus($request->get('status'));
        }

        // Filter by department
        if ($request->has('department')) {
            $query->byDepartment($request->get('department'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Exclude archived unless requested
        if (!$request->get('include_archived')) {
            $query->where('is_archived', false);
        }

        $total = $query->count();
        $jobs = $query->paginate($perPage, ['*'], 'page', $page);

        // Add computed attributes
        $jobsWithStats = $jobs->map(function ($job) {
            return array_merge(
                $job->toArray(),
                [
                    'applicant_count' => $job->applicant_count,
                    'hired_count' => $job->hired_count,
                    'hiring_rate' => $job->hiring_rate,
                    'pipeline_stats' => $job->pipeline_stats,
                ]
            );
        });

        return $this->success([
            'data' => $jobsWithStats,
            'total' => $total,
            'per_page' => $perPage,
            'page' => $page,
            'total_pages' => ceil($total / $perPage),
        ], 'Jobs retrieved successfully');
    }

    // ── Create new job ───────────────────────────────────────
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'requirements' => 'nullable|string',
            'salary_range_min' => 'nullable|numeric|min:0',
            'salary_range_max' => 'nullable|numeric|min:0',
            'status' => 'required|in:open,closed,draft,on_hold',
            'open_date' => 'nullable|date',
            'close_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        // Validation logic
        $errors = Recruitment::validateBeforeSave($request->all());
        if (!empty($errors)) {
            return $this->error('Validation failed', 422, $errors);
        }

        $job = Recruitment::create([
            'company_id' => auth()->user()->company_id,
            'title' => $request->title,
            'department' => $request->department,
            'requirements' => $request->requirements,
            'salary_range_min' => $request->salary_range_min,
            'salary_range_max' => $request->salary_range_max,
            'status' => $request->status,
            'open_date' => $request->open_date,
            'close_date' => $request->close_date,
        ]);

        return $this->created($job, 'Job created successfully');
    }

    // ── Get single job ───────────────────────────────────────
    public function show($id)
    {
        $job = Recruitment::findOrFail($id);

        if ($job->company_id !== auth()->user()->company_id) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success($job, 'Job retrieved successfully');
    }

    // ── Update job ───────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $job = Recruitment::findOrFail($id);

        if ($job->company_id !== auth()->user()->company_id) {
            return $this->error('Unauthorized', 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'department' => 'nullable|string|max:255',
            'requirements' => 'nullable|string',
            'salary_range_min' => 'nullable|numeric|min:0',
            'salary_range_max' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:open,closed,draft,on_hold',
            'open_date' => 'nullable|date',
            'close_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $job->update($request->only([
            'title',
            'department',
            'requirements',
            'salary_range_min',
            'salary_range_max',
            'status',
            'open_date',
            'close_date',
        ]));

        return $this->success($job, 'Job updated successfully');
    }

    // ── Delete job (Soft Delete) ────────────────────────────
    public function destroy($id)
    {
        $job = Recruitment::findOrFail($id);

        if ($job->company_id !== auth()->user()->company_id) {
            return $this->error('Unauthorized', 403);
        }

        $job->delete();

        return $this->success(null, 'Job deleted successfully');
    }

    // ── Duplicate job ────────────────────────────────────────
    public function duplicate($id)
    {
        $job = Recruitment::findOrFail($id);

        if ($job->company_id !== auth()->user()->company_id) {
            return $this->error('Unauthorized', 403);
        }

        $newJob = $job->duplicate();

        return $this->created($newJob, 'Job duplicated successfully');
    }

    // ── Archive/Unarchive job ────────────────────────────────
    public function archive($id)
    {
        $job = Recruitment::findOrFail($id);

        if ($job->company_id !== auth()->user()->company_id) {
            return $this->error('Unauthorized', 403);
        }

        $job->archive();

        return $this->success($job, 'Job archived successfully');
    }

    public function unarchive($id)
    {
        $job = Recruitment::findOrFail($id);

        if ($job->company_id !== auth()->user()->company_id) {
            return $this->error('Unauthorized', 403);
        }

        $job->unarchive();

        return $this->success($job, 'Job unarchived successfully');
    }

    // ── Get applicants for a job ──────────────────────────────
    public function getApplicants($jobId, Request $request)
    {
        $job = Recruitment::findOrFail($jobId);

        if ($job->company_id !== auth()->user()->company_id) {
            return $this->error('Unauthorized', 403);
        }

        $stage = $request->get('stage');
        $query = Applicant::where('job_id', $jobId);

        if ($stage) {
            $query->where('pipeline_stage', $stage);
        }

        $applicants = $query->orderBy('created_at', 'desc')->get();

        return $this->success($applicants, 'Applicants retrieved successfully');
    }

    // ── Get pipeline statistics ──────────────────────────────
    public function getPipelineStats($jobId)
    {
        $job = Recruitment::findOrFail($jobId);

        if ($job->company_id !== auth()->user()->company_id) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success(
            $job->pipeline_stats,
            'Pipeline statistics retrieved successfully'
        );
    }

    // ── Get jobs by status ───────────────────────────────────
    public function byStatus(Request $request)
    {
        $status = $request->get('status');
        if (!$status) {
            return $this->error('Status parameter required');
        }

        $jobs = Recruitment::where('company_id', auth()->user()->company_id)
                           ->byStatus($status)
                           ->orderBy('created_at', 'desc')
                           ->get();

        return $this->success($jobs, 'Jobs retrieved successfully');
    }

    // ── Get dashboard summary ────────────────────────────────
    public function dashboardSummary()
    {
        $companyId = auth()->user()->company_id;

        $stats = [
            'total_open_jobs' => Recruitment::where('company_id', $companyId)
                                            ->byStatus('open')
                                            ->count(),
            'total_applicants' => Applicant::whereHas('job', function ($q) use ($companyId) {
                                              $q->where('company_id', $companyId);
                                            })->count(),
            'total_hired' => Applicant::whereHas('job', function ($q) use ($companyId) {
                                         $q->where('company_id', $companyId);
                                       })
                                       ->where('pipeline_stage', 'Hired')
                                       ->count(),
            'pending_interviews' => Applicant::whereHas('job', function ($q) use ($companyId) {
                                              $q->where('company_id', $companyId);
                                            })
                                            ->where('pipeline_stage', 'Interview')
                                            ->count(),
            'high_rated_applicants' => Applicant::whereHas('job', function ($q) use ($companyId) {
                                               $q->where('company_id', $companyId);
                                             })
                                             ->where('rating', '>=', 4)
                                             ->count(),
        ];

        return $this->success($stats, 'Dashboard summary retrieved successfully');
    }
}

?>