<?php

namespace App\Providers;

use App\Http\Controllers\API\AccountController;
use App\Http\Controllers\API\AuthController;
use App\Models\Employee;
use App\Models\Product;
use App\Models\Sale;
use App\Policies\EmployeePolicy;
use App\Policies\ProductPolicy;
use App\Policies\SalePolicy;
use App\Repositories\AccountRepository;
use App\Services\AccountService;
use App\Services\JournalEntryService;
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

        // ── Policies ───────────────────────────────────────────────────────────
        // Fix #11: EmployeePolicy (كانت ناقصة خالص)
        Gate::policy(Employee::class, EmployeePolicy::class);

        // Bug جديد: ProductPolicy (كانت ناقصة خالص)
        Gate::policy(Product::class, ProductPolicy::class);

        // Bug جديد: SalePolicy (كانت موجودة لكن update() كان ناقص)
        Gate::policy(Sale::class, SalePolicy::class);
    }
}
