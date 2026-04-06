<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollTest extends TestCase
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

    public function test_can_list_payrolls(): void
    {
        $employee = Employee::factory()->create(['company_id' => $this->company->id]);
        Payroll::factory()->count(3)->create([
            'company_id'  => $this->company->id,
            'employee_id' => $employee->id,
        ]);

        $this->actingAs($this->user)
            ->getJson('/api/payroll')
            ->assertOk()
            ->assertJsonStructure(['data' => ['data']]);
    }

    public function test_can_create_payroll(): void
    {
        $employee = Employee::factory()->create([
            'company_id' => $this->company->id,
            'salary'     => 5000,
        ]);

        $payload = [
            'employee_id'  => $employee->id,
            'month'        => 1,
            'year'         => 2025,
            'basic_salary' => 5000,
            'allowances'   => 500,
            'deductions'   => 200,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/payroll', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.net_salary', 5300.0);
    }

    public function test_can_mark_payroll_as_paid(): void
    {
        $employee = Employee::factory()->create(['company_id' => $this->company->id]);
        $payroll  = Payroll::factory()->create([
            'company_id'  => $this->company->id,
            'employee_id' => $employee->id,
            'status'      => 'pending',
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/payroll/{$payroll->id}/pay")
            ->assertOk();

        $this->assertDatabaseHas('payrolls', ['id' => $payroll->id, 'status' => 'paid']);
    }

    public function test_can_generate_monthly_payroll(): void
    {
        Employee::factory()->count(3)->create([
            'company_id' => $this->company->id,
            'status'     => 'active',
            'salary'     => 3000,
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/payroll/generate', ['month' => 1, 'year' => 2025])
            ->assertOk();

        $this->assertDatabaseCount('payrolls', 3);
    }

    public function test_generate_payroll_skips_existing_records(): void
    {
        $employee = Employee::factory()->create([
            'company_id' => $this->company->id,
            'status'     => 'active',
        ]);

        Payroll::factory()->create([
            'company_id'  => $this->company->id,
            'employee_id' => $employee->id,
            'month'       => 1,
            'year'        => 2025,
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/payroll/generate', ['month' => 1, 'year' => 2025])
            ->assertOk();

        // لا زال سجل واحد فقط (ما اتضاعفش)
        $this->assertDatabaseCount('payrolls', 1);
    }
}
