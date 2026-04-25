<?php

namespace App\Http\Controllers\API;

use App\Models\ServiceCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceCatalogController extends BaseController
{
    // GET /api/service-catalog
    public function index(Request $request): JsonResponse
    {
        $services = ServiceCatalog::where('company_id', $this->companyId())
            ->when(!$request->all_statuses, fn($q) => $q->where('is_active', true))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->success($services);
    }

    // POST /api/service-catalog
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                  => 'required|string|max:255',
            'description'           => 'nullable|string',
            'icon'                  => 'nullable|string|max:50',
            'category'              => 'required|in:IT,HR,Admin,Finance,Other',
            'form_schema'           => 'required|array',
            'form_schema.fields'    => 'required|array|min:1',
            'default_priority'      => 'nullable|in:low,medium,high,urgent',
            'default_assigned_role' => 'nullable|string|max:100',
            'sla_hours'             => 'nullable|integer|min:1',
            'requires_approval'     => 'nullable|boolean',
            'is_active'             => 'nullable|boolean',
            'sort_order'            => 'nullable|integer',
        ]);

        $service = ServiceCatalog::create([...$data, 'company_id' => $this->companyId()]);

        return $this->created($service, 'تم إضافة الخدمة.');
    }

    // GET /api/service-catalog/{service}
    public function show(ServiceCatalog $serviceCatalog): JsonResponse
    {
        return $this->success($serviceCatalog);
    }

    // PUT /api/service-catalog/{service}
    public function update(Request $request, ServiceCatalog $serviceCatalog): JsonResponse
    {
        $data = $request->validate([
            'name'                  => 'sometimes|string|max:255',
            'description'           => 'nullable|string',
            'icon'                  => 'nullable|string|max:50',
            'category'              => 'sometimes|in:IT,HR,Admin,Finance,Other',
            'form_schema'           => 'sometimes|array',
            'default_priority'      => 'nullable|in:low,medium,high,urgent',
            'default_assigned_role' => 'nullable|string|max:100',
            'sla_hours'             => 'nullable|integer|min:1',
            'requires_approval'     => 'nullable|boolean',
            'is_active'             => 'nullable|boolean',
            'sort_order'            => 'nullable|integer',
        ]);

        $serviceCatalog->update($data);

        return $this->success($serviceCatalog, 'تم تحديث الخدمة.');
    }

    // DELETE /api/service-catalog/{service}
    public function destroy(ServiceCatalog $serviceCatalog): JsonResponse
    {
        // منع الحذف لو في تذاكر مرتبطة
        if ($serviceCatalog->tickets()->exists()) {
            return $this->error('لا يمكن حذف خدمة مرتبطة بتذاكر. عطّلها بدلًا من ذلك.', 422);
        }

        $serviceCatalog->delete();
        return $this->success(null, 'تم حذف الخدمة.');
    }
}