<?php
namespace App\Http\Controllers\API;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
class OrgChartController extends BaseController
{
    public function index(): JsonResponse
    {
        $employees = Employee::with('user:id,name,avatar')
            ->where('company_id', $this->companyId())
            ->get();
        return $this->success($employees);
    }
}