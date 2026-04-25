<?php

namespace App\Http\Controllers\API\BI;

use App\Http\Controllers\API\BaseController;
use App\Jobs\GenerateReportJob;
use App\Models\BI\BICustomReport;
use App\Models\BI\BIReportExecution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BIReportController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;
            $reports   = BICustomReport::where('company_id', $companyId)
                ->with('creator:id,name,email')
                ->when($request->query('type'), fn($q, $t) => $q->where('report_type', $t))
                ->latest()
                ->paginate(20);
            return $this->sendResponse($reports, 'Reports retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $v = $request->validate([
                'report_name'        => 'required|string|max:255',
                'description'        => 'nullable|string',
                'report_type'        => 'required|in:sales,inventory,financial,hr,custom',
                'columns'            => 'required|array',
                'filters'            => 'nullable|array',
                'export_formats'     => 'nullable|array',
                'schedule_enabled'   => 'nullable|boolean',
                'schedule_frequency' => 'nullable|in:daily,weekly,monthly',
            ]);

            $companyId = auth('sanctum')->user()->company_id;

            $report = BICustomReport::create([
                'company_id'         => $companyId,
                'created_by'         => auth('sanctum')->user()->id,
                'report_name'        => $v['report_name'],
                'slug'               => Str::slug($v['report_name']) . '-' . Str::random(5),
                'description'        => $v['description'] ?? null,
                'report_type'        => $v['report_type'],
                'columns'            => $v['columns'],
                'filters'            => $v['filters'] ?? null,
                'export_formats'     => $v['export_formats'] ?? ['excel'],
                'schedule_enabled'   => $v['schedule_enabled'] ?? false,
                'schedule_frequency' => $v['schedule_frequency'] ?? null,
            ]);

            return $this->sendResponse($report, 'Report created', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Execute report — dispatches real GenerateReportJob to queue
     */
    public function execute(BICustomReport $report, Request $request): JsonResponse
    {
        try {
            if ($report->company_id !== auth('sanctum')->user()->company_id) {
                return $this->sendError('Unauthorized', [], 403);
            }

            $execution = BIReportExecution::create([
                'company_id' => $report->company_id,
                'report_id'  => $report->id,
                'executed_by'=> auth('sanctum')->user()->id,
                'executed_at'=> now(),
                'status'     => 'pending',
            ]);

            // 🔴 REAL job dispatch
            GenerateReportJob::dispatch($execution)->onQueue('reports');

            return $this->sendResponse([
                'execution_id'     => $execution->id,
                'status'           => 'pending',
                'poll_url'         => "/api/bi/reports/{$report->id}/executions/{$execution->id}",
                'estimated_seconds'=> 5,
            ], 'Report generation started', 202);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function getExecution(BICustomReport $report, BIReportExecution $execution): JsonResponse
    {
        try {
            if ($report->company_id !== auth('sanctum')->user()->company_id) {
                return $this->sendError('Unauthorized', [], 403);
            }

            $response = $execution->toArray();

            // Add download URL if completed
            if ($execution->status === 'completed' && $execution->result_path) {
                $response['download_url'] = route('bi.report.download', ['execution' => $execution->id]);
            }

            return $this->sendResponse($response, 'Execution retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Download completed report file
     */
    public function download(BIReportExecution $execution): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
    {
        if ($execution->company_id !== auth('sanctum')->user()->company_id) {
            return $this->sendError('Unauthorized', [], 403);
        }

        if ($execution->status !== 'completed' || ! $execution->result_path) {
            return $this->sendError('Report not ready yet', [], 422);
        }

        if (! Storage::exists($execution->result_path)) {
            return $this->sendError('Report file not found', [], 404);
        }

        $filename = 'report_' . $execution->id . '_' . now()->format('Ymd') . '.csv';

        return Storage::download($execution->result_path, $filename);
    }

    public function scheduleReport(Request $request, BICustomReport $report): JsonResponse
    {
        try {
            $v = $request->validate([
                'schedule_frequency' => 'required|in:daily,weekly,monthly',
                'recipients'         => 'required|array|min:1',
                'recipients.*'       => 'email',
            ]);

            $report->update([
                'schedule_enabled'   => true,
                'schedule_frequency' => $v['schedule_frequency'],
                'recipients'         => $v['recipients'],
            ]);

            return $this->sendResponse($report, 'Report scheduled');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }
}
