<?php

namespace App\Http\Controllers\API\BI;

use App\Http\Controllers\API\BaseController;
use App\Models\BI\{BIDashboard, BIWidget};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BIDashboardController extends BaseController
{
    /**
     * Get all dashboards
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;
            $visibility = $request->query('visibility', 'company');

            $dashboards = BIDashboard::where('company_id', $companyId)
                ->where('visibility', $visibility)
                ->where('is_active', true)
                ->with('creator:id,name,email')
                ->latest()
                ->paginate(20);

            return $this->sendResponse($dashboards, 'Dashboards retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Create new dashboard
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'visibility' => 'in:private,team,company,public',
                'refresh_interval' => 'nullable|integer|min:60'
            ]);

            $companyId = auth('sanctum')->user()->company_id;

            $dashboard = BIDashboard::create([
                'company_id' => $companyId,
                'created_by' => auth('sanctum')->user()->id,
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']) . '-' . Str::random(5),
                'description' => $validated['description'] ?? null,
                'visibility' => $validated['visibility'] ?? 'company',
                'refresh_interval' => $validated['refresh_interval'] ?? 300,
                'is_active' => true
            ]);

            return $this->sendResponse($dashboard, 'Dashboard created successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Get dashboard with widgets
     */
    public function show(BIDashboard $dashboard): JsonResponse
    {
        try {
            $dashboard->load(['widgets', 'creator:id,name,email']);
            return $this->sendResponse($dashboard, 'Dashboard retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Update dashboard
     */
    public function update(Request $request, BIDashboard $dashboard): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'visibility' => 'nullable|in:private,team,company,public',
                'refresh_interval' => 'nullable|integer|min:60',
                'is_active' => 'nullable|boolean'
            ]);

            $dashboard->update(array_filter($validated));

            return $this->sendResponse($dashboard, 'Dashboard updated successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Delete dashboard
     */
    public function destroy(BIDashboard $dashboard): JsonResponse
    {
        try {
            $dashboard->widgets()->delete();
            $dashboard->delete();

            return $this->sendResponse([], 'Dashboard deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Add widget to dashboard
     */
    public function addWidget(Request $request, BIDashboard $dashboard): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'widget_type' => 'required|in:kpi,chart,table,gauge,heatmap,pivot',
                'data_source' => 'required|array',
                'filters' => 'nullable|array',
                'display_config' => 'nullable|array',
                'position_x' => 'required|integer|min:0',
                'position_y' => 'required|integer|min:0',
                'width' => 'nullable|integer|min:1|max:12',
                'height' => 'nullable|integer|min:1|max:12'
            ]);

            $widget = BIWidget::create([
                'company_id' => $dashboard->company_id,
                'dashboard_id' => $dashboard->id,
                'name' => $validated['name'],
                'widget_type' => $validated['widget_type'],
                'data_source' => $validated['data_source'],
                'filters' => $validated['filters'] ?? null,
                'display_config' => $validated['display_config'] ?? null,
                'position_x' => $validated['position_x'],
                'position_y' => $validated['position_y'],
                'width' => $validated['width'] ?? 4,
                'height' => $validated['height'] ?? 3
            ]);

            return $this->sendResponse($widget, 'Widget added successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Remove widget
     */
    public function removeWidget(BIDashboard $dashboard, BIWidget $widget): JsonResponse
    {
        try {
            if ($widget->dashboard_id !== $dashboard->id) {
                return $this->sendError('Widget not found on this dashboard', [], 404);
            }

            $widget->delete();

            return $this->sendResponse([], 'Widget removed successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Set as default dashboard
     */
    public function setAsDefault(BIDashboard $dashboard): JsonResponse
    {
        try {
            $dashboard->setAsDefault();
            return $this->sendResponse($dashboard, 'Dashboard set as default successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }
}
