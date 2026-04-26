<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

// ══════════════════════════════════════════════════════════
// EmployeeTest — اختبارات إدارة الموظفين (HR)
// ══════════════════════════════════════════════════════════
class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    private User    $user;
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'HR Test Company', 'email' => 'hr@test.com', 'status' => 'active',
        ]);

        $this->user = User::factory()->create(['company_id' => $this->company->id]);

        $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $perm = Permission::firstOrCreate(['name' => 'manage-hr', 'guard_name' => 'sanctum']);
        $role->givePermissionTo($perm);
        $this->user->assignRole($role);
    }

    /** @test */
    public function can_create_employee_with_valid_data(): void
    {
        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/employees', [
                 'name'       => 'Ahmed Hassan',
                 'role'       => 'Developer',
                 'department' => 'IT',
                 'salary'     => 8000,
                 'email'      => 'ahmed@test.com',
                 'hire_date'  => '2024-01-01',
             ])
             ->assertStatus(201)
             ->assertJsonPath('employee.name', 'Ahmed Hassan')
             ->assertJsonPath('employee.status', 'active');
    }

    /** @test */
    public function employee_creation_requires_name_and_salary(): void
    {
        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/employees', [])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['name', 'salary', 'role', 'department']);
    }

    /** @test */
    public function can_list_employees(): void
    {
        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/employees', [
                 'name' => 'Sara Mohamed', 'role' => 'HR', 'department' => 'HR', 'salary' => 6000,
             ]);

        $this->actingAs($this->user, 'sanctum')
             ->getJson('/api/employees')
             ->assertStatus(200)
             ->assertJsonStructure(['data', 'total', 'per_page']);
    }

    /** @test */
    public function can_update_employee(): void
    {
        $res = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/employees', [
                'name' => 'Omar Ali', 'role' => 'Accountant', 'department' => 'Finance', 'salary' => 7000,
            ]);

        $empId = $res->json('employee.id');

        $this->actingAs($this->user, 'sanctum')
             ->putJson("/api/employees/{$empId}", ['salary' => 9000])
             ->assertStatus(200)
             ->assertJsonPath('employee.salary', 9000);
    }
}
