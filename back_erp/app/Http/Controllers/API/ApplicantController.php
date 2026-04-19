<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicantPipelineHistory extends Model
{
    protected $fillable = [
        'applicant_id',
        'from_stage',
        'to_stage',
        'changed_by',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}

?>

<?php

// ══════════════════════════════════════════════════════════
// app/Http/Controllers/API/ApplicantController.php
// ══════════════════════════════════════════════════════════

namespace App\Http\Controllers\API;

use App\Models\Applicant;
use App\Models\Recruitment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ApplicantController extends BaseController
{
    // ── Get all applicants ───────────────────────────────────
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $page = $request->get('page', 1);

        $query = Applicant::query();

        // Filter by company (multi-tenancy)
        $query->where('company_id', auth()->user()->company_id);

        // Search
        if ($request->has('search')) {
            $query->search($request->get('search'));
        }

        // Filter by job
        if ($request->has('job_id')) {
            $query->byJob($request->get('job_id'));
        }

        // Filter by pipeline stage
        if ($request->has('pipeline_stage')) {
            $query->byStage($request->get('pipeline_stage'));
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $total = $query->count();
        $applicants = $query->paginate($perPage, ['*'], 'page', $page);

        return $this->sendResponse([
            'data' => $applicants->items(),
            'total' => $total,
            'per_page' => $perPage,
            'page' => $page,
            'total_pages' => ceil($total / $perPage),
        ], 'Applicants retrieved successfully');
    }

    // ── Create applicant ─────────────────────────────────────
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'job_id' => 'required|exists:recruitment,id',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:applicants,email',
            'phone' => 'nullable|string|max:20',
            'cover_letter' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation failed', $validator->errors(), 422);
        }

        $applicant = Applicant::create([
            'company_id' => auth()->user()->company_id,
            'job_id' => $request->job_id,
            'full_name' => $request->full_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'cover_letter' => $request->cover_letter,
            'rating' => $request->rating,
            'applied_date' => now(),
            'pipeline_stage' => 'Applied',
        ]);

        return $this->sendResponse($applicant, 'Applicant created successfully', 201);
    }

    // ── Get single applicant ─────────────────────────────────
    public function show($id)
    {
        $applicant = Applicant::findOrFail($id);

        // Check authorization
        if ($applicant->company_id !== auth()->user()->company_id) {
            return $this->sendError('Unauthorized', null, 403);
        }

        return $this->sendResponse($applicant, 'Applicant retrieved successfully');
    }

    // ── Update applicant ────────────────────────────────────
    public function update(Request $request, $id)
    {
        $applicant = Applicant::findOrFail($id);

        // Check authorization
        if ($applicant->company_id !== auth()->user()->company_id) {
            return $this->sendError('Unauthorized', null, 403);
        }

        $validator = Validator::make($request->all(), [
            'job_id' => 'sometimes|exists:recruitment,id',
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:applicants,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'cover_letter' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation failed', $validator->errors(), 422);
        }

        $applicant->update($request->only([
            'job_id',
            'full_name',
            'email',
            'phone',
            'cover_letter',
            'rating',
        ]));

        return $this->sendResponse($applicant, 'Applicant updated successfully');
    }

    // ── Change pipeline stage ───────────────────────────────
    public function changePipelineStage(Request $request, $id)
    {
        $applicant = Applicant::findOrFail($id);

        // Check authorization
        if ($applicant->company_id !== auth()->user()->company_id) {
            return $this->sendError('Unauthorized', null, 403);
        }

        $validator = Validator::make($request->all(), [
            'pipeline_stage' => 'required|in:Applied,Screening,Interview,Offer,Hired,Rejected',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation failed', $validator->errors(), 422);
        }

        $applicant->moveToPipeline($request->pipeline_stage);

        return $this->sendResponse($applicant, 'Pipeline stage changed successfully');
    }

    // ── Upload CV ────────────────────────────────────────────
    public function uploadCV(Request $request, $id)
    {
        $applicant = Applicant::findOrFail($id);

        // Check authorization
        if ($applicant->company_id !== auth()->user()->company_id) {
            return $this->sendError('Unauthorized', null, 403);
        }

        $validator = Validator::make($request->all(), [
            'cv' => 'required|file|mimes:pdf,doc,docx|max:5120', // 5MB
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation failed', $validator->errors(), 422);
        }

        // Delete old CV if exists
        if ($applicant->cv_url) {
            Storage::disk('s3')->delete($applicant->cv_url);
        }

        // Upload new CV to S3
        $file = $request->file('cv');
        $path = "cvs/{$applicant->company_id}/{$applicant->id}/" . $file->getClientOriginalName();
        $url = Storage::disk('s3')->put($path, $file);

        // Update applicant
        $applicant->update([
            'cv_url' => $url,
            'cv_file_name' => $file->getClientOriginalName(),
            'cv_file_size' => $file->getSize(),
        ]);

        return $this->sendResponse($applicant, 'CV uploaded successfully');
    }

    // ── Delete applicant ────────────────────────────────────
    public function destroy($id)
    {
        $applicant = Applicant::findOrFail($id);

        // Check authorization
        if ($applicant->company_id !== auth()->user()->company_id) {
            return $this->sendError('Unauthorized', null, 403);
        }

        // Delete CV from S3
        if ($applicant->cv_url) {
            Storage::disk('s3')->delete($applicant->cv_url);
        }

        // Soft delete or hard delete
        $applicant->delete();

        return $this->sendResponse(null, 'Applicant deleted successfully');
    }

    // ── Get pipeline statistics ──────────────────────────────
    public function pipelineStats(Request $request)
    {
        $jobId = $request->get('job_id');

        $query = Applicant::where('company_id', auth()->user()->company_id);
        if ($jobId) {
            $query->where('job_id', $jobId);
        }

        $stats = [
            'Applied' => $query->clone()->byStage('Applied')->count(),
            'Screening' => $query->clone()->byStage('Screening')->count(),
            'Interview' => $query->clone()->byStage('Interview')->count(),
            'Offer' => $query->clone()->byStage('Offer')->count(),
            'Hired' => $query->clone()->byStage('Hired')->count(),
            'Rejected' => $query->clone()->byStage('Rejected')->count(),
        ];

        return $this->sendResponse($stats, 'Pipeline statistics retrieved successfully');
    }

    // ── Get high-rated applicants ────────────────────────────
    public function highRated(Request $request)
    {
        $minRating = $request->get('min_rating', 4);
        $jobId = $request->get('job_id');

        $query = Applicant::where('company_id', auth()->user()->company_id)
                         ->highRated($minRating);

        if ($jobId) {
            $query->byJob($jobId);
        }

        $applicants = $query->orderBy('rating', 'desc')->get();

        return $this->sendResponse($applicants, 'High-rated applicants retrieved successfully');
    }
}
?>