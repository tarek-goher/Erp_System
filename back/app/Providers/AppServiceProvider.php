<?php

namespace App\Providers;

use App\Http\Controllers\API\AccountController;
use App\Http\Controllers\API\AuthController;
use App\Models\Employee;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Ticket;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use App\Models\PosOrder;
use App\Models\Expense;
use App\Models\Applicant;
use App\Models\CrmOpportunity;
use App\Models\Project;
use App\Models\FleetMaintenance;
use App\Models\FuelLog;
use App\Policies\EmployeePolicy;
use App\Policies\ProductPolicy;
use App\Policies\SalePolicy;
use App\Policies\TicketPolicy;
use App\Repositories\AccountRepository;
use App\Services\AccountService;
use App\Services\JournalEntryService;
use App\Services\IntegrationService;
use App\Observers\LeaveRequestObserver;
use App\Observers\PayrollObserver;
use App\Observers\PosOrderObserver;
use App\Observers\ExpenseObserver;
use App\Observers\ApplicantObserver;
use App\Observers\CrmOpportunityObserver;
use App\Observers\ProjectObserver;
use App\Observers\FleetMaintenanceObserver;
use App\Observers\FuelLogObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/**
 * AppServiceProvider
 *
 * Bug جديد: SalePolicy وProductPolicy لم تكن مسجّلة صراحةً.
 * في Laravel 11 يتم auto-discover للـ Policies، لكن نسجّلهم صراحةً
 * لضمان العمل في كل الإصدارات وتجنب أي مشاكل في الـ auto-discovery.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(AccountRepository::class, function () {
            return new AccountRepository();
        });

        $this->app->singleton(AccountService::class, function ($app) {
            return new AccountService($app->make(AccountRepository::class));
        });

        $this->app->singleton(JournalEntryService::class, function () {
            return new JournalEntryService();
        });

        $this->app->singleton(IntegrationService::class, function ($app) {
            return new IntegrationService($app->make(JournalEntryService::class));
        });

        $this->app->bind(AccountController::class, function ($app) {
            return new AccountController(
                $app->make(AccountService::class),
                $app->make(AccountRepository::class)
            );
        });

        $this->app->bind(AuthController::class, function ($app) {
            return new AuthController(
                $app->make(AccountService::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // ── Observers ──────────────────────────────────────────────────────────
        \App\Models\Sale::observe(\App\Observers\SaleObserver::class);
        \App\Models\Purchase::observe(\App\Observers\PurchaseObserver::class);
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);

        // Integration Observers - واحد لكل Model
        LeaveRequest::observe(LeaveRequestObserver::class);
        Payroll::observe(PayrollObserver::class);
        PosOrder::observe(PosOrderObserver::class);
        Expense::observe(ExpenseObserver::class);
        Applicant::observe(ApplicantObserver::class);
        CrmOpportunity::observe(CrmOpportunityObserver::class);
        Project::observe(ProjectObserver::class);
        FleetMaintenance::observe(FleetMaintenanceObserver::class);
        FuelLog::observe(FuelLogObserver::class);

        // ── Policies ───────────────────────────────────────────────────────────
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Sale::class, SalePolicy::class);
        Gate::policy(Ticket::class, TicketPolicy::class);
    }
}
