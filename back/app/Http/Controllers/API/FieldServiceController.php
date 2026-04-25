<?php

namespace App\Http\Controllers\API;

use App\Models\WorkCenter;
use App\Models\BomItem;
use App\Models\WorkCenterRouting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class FieldServiceController extends BaseController
{
    public function getServiceRequests(Request $request): JsonResponse
    {
        $requests = \App\Models\FieldServiceRequest::where('company_id', auth()->user()->company_id)
            ->with('assignedTechnician', 'customer', 'details')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->priority, fn($q) => $q->where('priority', $request->priority))
            ->latest('scheduled_date')
            ->paginate($this->perPage());

        return $this->success($requests);
    }

    public function createServiceRequest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'description' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'scheduled_date' => 'required|date|after:now',
            'estimated_duration' => 'required|numeric|min:15',
            'priority' => 'required|in:low,medium,high,urgent',
            'items' => 'nullable|array',
            'items.*.item_id' => 'required|integer',
            'items.*.item_type' => 'required|in:product,service',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            \DB::beginTransaction();

            $reference = 'FS-' . date('YmdHis') . '-' . rand(1000, 9999);

            $serviceRequest = \App\Models\FieldServiceRequest::create([
                'company_id' => auth()->user()->company_id,
                'customer_id' => $data['customer_id'],
                'reference' => $reference,
                'description' => $data['description'],
                'location' => \DB::raw("ST_PointFromText('POINT({$data['longitude']} {$data['latitude']})')"),
                'scheduled_date' => $data['scheduled_date'],
                'estimated_duration' => $data['estimated_duration'],
                'priority' => $data['priority'],
                'status' => 'new',
            ]);

            if (isset($data['items'])) {
                foreach ($data['items'] as $item) {
                    $serviceRequest->details()->create([
                        'item_id' => $item['item_id'],
                        'item_type' => $item['item_type'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $item['quantity'] * $item['unit_price'],
                        'description' => "Item #{$item['item_id']}",
                    ]);
                }
            }

            \DB::commit();

            return $this->success($serviceRequest, 'Service request created', 201);
        } catch (\Exception $e) {
            \DB::rollBack();
            return $this->error($e->getMessage());
        }
    }

    public function assignTechnician(Request $request, $requestId): JsonResponse
    {
        $data = $request->validate([
            'technician_id' => 'required|exists:field_technicians,id',
        ]);

        $serviceRequest = \App\Models\FieldServiceRequest::find($requestId);

        if (!$serviceRequest) {
            return $this->error('Service request not found', 404);
        }

        $serviceRequest->update([
            'assigned_technician_id' => $data['technician_id'],
            'status' => 'assigned',
        ]);

        return $this->success($serviceRequest, 'Technician assigned');
    }

    public function completeService(Request $request, $requestId): JsonResponse
    {
        $data = $request->validate([
            'summary' => 'required|string',
            'work_done' => 'required|string',
            'issues_found' => 'nullable|string',
            'recommendations' => 'nullable|string',
            'images' => 'nullable|array',
            'customer_signature' => 'required|string',
        ]);

        $serviceRequest = \App\Models\FieldServiceRequest::with('details')->find($requestId);

        if (!$serviceRequest) {
            return $this->error('Service request not found', 404);
        }

        $totalAmount = $serviceRequest->details->sum('total_price');

        $report = \App\Models\FieldServiceReport::create([
            'field_service_request_id' => $serviceRequest->id,
            'technician_id' => $serviceRequest->assigned_technician_id,
            'summary' => $data['summary'],
            'work_done' => $data['work_done'],
            'issues_found' => $data['issues_found'] ?? null,
            'recommendations' => $data['recommendations'] ?? null,
            'images' => json_encode($data['images'] ?? []),
            'customer_signature' => $data['customer_signature'],
            'total_amount' => $totalAmount,
            'customer_signature_status' => 'signed',
            'signed_at' => now(),
        ]);

        $serviceRequest->update([
            'actual_start' => $serviceRequest->actual_start ?? now(),
            'actual_end' => now(),
            'actual_duration' => $serviceRequest->actual_start ?
                now()->diffInMinutes($serviceRequest->actual_start) : null,
            'status' => 'completed',
        ]);

        return $this->success($report, 'Service completed', 201);
    }

    public function getTechnicianLocation($technicianId): JsonResponse
    {
        $technician = \App\Models\FieldTechnician::find($technicianId);

        if (!$technician) {
            return $this->error('Technician not found', 404);
        }

        $lastTracking = \App\Models\FieldTechnicianTracking::where('field_technician_id', $technicianId)
            ->latest('timestamp')
            ->first();

        return $this->success([
            'technician_id' => $technicianId,
            'location' => $lastTracking ? [
                'latitude' => $lastTracking->location->getLat(),
                'longitude' => $lastTracking->location->getLng(),
                'accuracy' => $lastTracking->accuracy,
                'timestamp' => $lastTracking->timestamp,
            ] : null,
        ]);
    }

    public function rateTechnician(Request $request, $serviceRequestId): JsonResponse
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $serviceRequest = \App\Models\FieldServiceRequest::find($serviceRequestId);

        if (!$serviceRequest) {
            return $this->error('Service request not found', 404);
        }

        $rating = \App\Models\FieldTechnicianRating::create([
            'field_service_request_id' => $serviceRequestId,
            'technician_id' => $serviceRequest->assigned_technician_id,
            'customer_id' => $serviceRequest->customer_id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        return $this->success($rating, 'Rating submitted', 201);
    }
}
