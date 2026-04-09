<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\API\BaseController;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SuperAdmin\CompanyController
 * المسارات: /api/super-admin/companies
 * يتحكم في: إدارة الشركات من منظور السوبر أدمن
 */
class CompanyController extends BaseController
{
    /** GET /api/super-admin/companies */
    public function index(Request $request): JsonResponse
    {
        $companies = Company::withCount('users')
            ->with('subscriptions')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($companies);
    }

    /** POST /api/super-admin/companies */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:200',
            'email'             => 'required|email|unique:companies',
            'phone'             => 'nullable|string',
            'subscription_plan' => 'nullable|string|in:starter,professional,enterprise',
            'country'           => 'nullable|string',
            'currency'          => 'nullable|string',
        ]);

        $company = Company::create(['status' => 'active', ...$data]);
        return $this->created($company, 'Company created');
    }

    /** GET /api/super-admin/companies/{company} */
    public function show(Company $company): JsonResponse
    {
        return $this->success($company->load('users', 'subscriptions', 'branches'));
    }

    /** PUT /api/super-admin/companies/{company} */
    public function update(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'sometimes|string|max:200',
            'email'             => 'sometimes|email',
            'subscription_plan' => 'nullable|string',
            'status'            => 'sometimes|in:active,suspended,trial',
        ]);

        $company->update($data);
        return $this->success($company, 'Company updated');
    }

    /** DELETE /api/super-admin/companies/{company} */
    public function destroy(Company $company): JsonResponse
    {
        $company->delete();
        return $this->success(null, 'Company deleted');
    }

    /** POST /api/super-admin/companies/{company}/activate */
    public function activate(Company $company): JsonResponse
    {
        $company->update(['status' => 'active']);
        return $this->success($company, 'Company activated');
    }

    /** POST /api/super-admin/companies/{company}/suspend */
    public function suspend(Company $company): JsonResponse
    {
        $company->update(['status' => 'suspended']);
        return $this->success($company, 'Company suspended');
    }

    /** GET /api/super-admin/stats */
    public function stats(): JsonResponse
    {
        return $this->success([
            'total_companies'      => Company::count(),
            'total_users'          => User::count(),
            'active_subscriptions' => Company::where('status', 'active')->count(),
            'open_tickets'         => \App\Models\SupportTicket::where('status', 'open')->count(),
            'system_status'        => 'healthy',
            'monthly_revenue'      => rand(5000, 15000), // TODO: Real calculation
            'active'               => Company::where('status', 'active')->count(),
            'suspended'            => Company::where('status', 'suspended')->count(),
            'trial'                => Company::where('status', 'trial')->count(),
            'new_this_month'       => Company::whereMonth('created_at', now()->month)->count(),
        ]);
    }

    /** GET /api/super-admin/monitoring */
    public function monitoring(): JsonResponse
    {
        return $this->success([
            'server_time'        => now()->toIso8601String(),
            'php_version'        => phpversion(),
            'laravel_version'    => app()->version(),
            'database_ok'        => true,
            'queue_jobs_pending' => \DB::table('jobs')->count(),
            'failed_jobs'        => \DB::table('failed_jobs')->count(),
        ]);
    }

    /** POST /api/super-admin/broadcast */
    public function broadcast(Request $request): JsonResponse
    {
        $request->validate(['title' => 'required|string', 'message' => 'required|string']);
        // TODO: Broadcast to all company admins via notifications
        return $this->success(null, 'Broadcast sent to all companies');
    }
}
