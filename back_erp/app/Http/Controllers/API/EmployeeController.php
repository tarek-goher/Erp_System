<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * EmployeeController — إدارة الموظفين
 *
 * Fix #11: كانت $this->authorize('view/update/delete', $employee) بتفشل لأن
 *          EmployeePolicy لم تكن موجودة ولا مسجّلة.
 *          الحل: تم إنشاء EmployeePolicy في app/Policies/EmployeePolicy.php
 *                وتسجيلها في AppServiceProvider::boot() باستخدام Gate::policy()
 */
class EmployeeController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $employees = Employee::with('user')
            ->where('company_id', $this->companyId())
            ->when($request->search,     fn($q) => $q->where('name', 'like', "%{$request->search}%")
                                                      ->orWhere('department', 'like', "%{$request->search}%"))
            ->when($request->department, fn($q) => $q->where('department', $request->department))
            ->when($request->status,     fn($q) => $q->where('status', $request->status))
            ->paginate($this->perPage());

        return $this->success(EmployeeResource::collection($employees)->response()->getData(true));
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $data     = array_merge($request->validated(), ['company_id' => $this->companyId()]);
        $employee = Employee::create($data);
        return $this->created(new EmployeeResource($employee->load('user')));
    }

    public function show(Employee $employee): JsonResponse
    {
        // Fix #11: authorize يعمل الآن لأن EmployeePolicy مسجّلة
        $this->authorize('view', $employee);
        return $this->success(new EmployeeResource($employee->load('user', 'attendances', 'payrolls')));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $this->authorize('update', $employee);
        $employee->update($request->validated());
        return $this->success(new EmployeeResource($employee->fresh('user')), 'تم تحديث بيانات الموظف.');
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $this->authorize('delete', $employee);
        $employee->delete();
        return $this->success(null, 'تم حذف الموظف.');
    }

    /** GET /api/employees/stats */
    public function stats(): JsonResponse
    {
        $companyId = $this->companyId();
        return $this->success([
            'total'       => Employee::where('company_id', $companyId)->count(),
            'active'      => Employee::where('company_id', $companyId)->where('status', 'active')->count(),
            'on_leave'    => Employee::where('company_id', $companyId)->where('status', 'on_leave')->count(),
            'departments' => Employee::where('company_id', $companyId)->distinct('department')->count('department'),
        ]);
    }

    /** GET /api/employees/org-chart */
    public function orgChart(): JsonResponse
    {
        $employees = Employee::where('company_id', $this->companyId())
            ->with('user')
            ->get()
            ->groupBy('department');
        return $this->success($employees);
    }
}
