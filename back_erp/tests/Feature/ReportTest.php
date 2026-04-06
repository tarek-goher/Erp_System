<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::factory()->create(['status' => 'active']);
        $this->user    = User::factory()->create(['company_id' => $this->company->id]);
    }

    public function test_dashboard_report_returns_expected_keys(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/reports/dashboard')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'today_revenue', 'month_revenue', 'today_orders',
                'employees', 'low_stock', 'pending_payroll',
            ]]);
    }

    public function test_sales_report_with_date_filter(): void
    {
        Sale::factory()->count(3)->create([
            'company_id' => $this->company->id,
            'status'     => 'completed',
        ]);

        $this->actingAs($this->user)
            ->getJson('/api/reports/sales?from=2024-01-01&to=2030-12-31')
            ->assertOk()
            ->assertJsonStructure(['data' => ['summary', 'daily']]);
    }

    public function test_inventory_report_shows_low_stock(): void
    {
        Product::factory()->create([
            'company_id' => $this->company->id,
            'qty'        => 2,
            'min_qty'    => 10,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/inventory');

        $response->assertOk()
            ->assertJsonPath('data.low_stock_count', 1);
    }

    public function test_hr_report_returns_payroll_summary(): void
    {
        $employee = Employee::factory()->create(['company_id' => $this->company->id]);
        Payroll::factory()->create([
            'company_id'  => $this->company->id,
            'employee_id' => $employee->id,
            'month'       => 1,
            'year'        => 2025,
            'net_salary'  => 5000,
            'status'      => 'paid',
        ]);

        $this->actingAs($this->user)
            ->getJson('/api/reports/hr?month=1&year=2025')
            ->assertOk()
            ->assertJsonStructure(['data' => ['employees', 'payroll']]);
    }

    public function test_top_customers_report(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/reports/customers')
            ->assertOk();
    }

    public function test_top_products_report(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/reports/products')
            ->assertOk();
    }

    public function test_unauthenticated_user_cannot_access_reports(): void
    {
        $this->getJson('/api/reports/dashboard')->assertStatus(401);
    }
}
