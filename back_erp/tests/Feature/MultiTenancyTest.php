<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

// ══════════════════════════════════════════════════════════
// MultiTenancyTest — اختبارات عزل البيانات بين الشركات
// ده أهم test في السيستم — بيتأكد إن شركة A مش تشوف بيانات شركة B
// في سيستم بـ 80 شركة ده الأكثر أهمية
// ══════════════════════════════════════════════════════════
class MultiTenancyTest extends TestCase
{
    use RefreshDatabase;

    private function createCompanyWithUser(string $name): array
    {
        $company = Company::create([
            'name'   => $name,
            'email'  => strtolower(str_replace(' ', '', $name)) . '@test.com',
            'status' => 'active',
        ]);

        $user = User::factory()->create(['company_id' => $company->id]);

        $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $perms = ['manage-products', 'manage-sales', 'manage-hr'];
        foreach ($perms as $p) {
            $perm = Permission::firstOrCreate(['name' => $p, 'guard_name' => 'sanctum']);
            $role->givePermissionTo($perm);
        }
        $user->assignRole($role);

        return [$company, $user];
    }

    /** @test */
    public function company_a_cannot_see_company_b_products(): void
    {
        [$companyA, $userA] = $this->createCompanyWithUser('Company Alpha');
        [$companyB, $userB] = $this->createCompanyWithUser('Company Beta');

        $categoryA = Category::create(['name' => 'Cat A', 'company_id' => $companyA->id]);
        $categoryB = Category::create(['name' => 'Cat B', 'company_id' => $companyB->id]);

        // إنشاء منتج لـ Company B
        Product::create([
            'name'        => 'Secret Product of B',
            'sku'         => 'SKU-B-001',
            'price'       => 999,
            'cost'        => 500,
            'qty'         => 10,
            'min_qty'     => 1,
            'company_id'  => $companyB->id,
            'category_id' => $categoryB->id,
        ]);

        // Company A تطلب قائمة منتجاتها
        $response = $this->actingAs($userA, 'sanctum')
            ->getJson('/api/products');

        $response->assertStatus(200);

        // المفروض مش تشوف منتج Company B
        $productNames = collect($response->json('data'))->pluck('name');
        $this->assertNotContains('Secret Product of B', $productNames);
        $this->assertCount(0, $productNames); // Company A مالهاش منتجات
    }

    /** @test */
    public function companies_share_no_data_across_boundaries(): void
    {
        [$companyA, $userA] = $this->createCompanyWithUser('Company Gamma');
        [$companyB, $userB] = $this->createCompanyWithUser('Company Delta');

        // كل شركة تعمل منتجها
        $catA = Category::create(['name' => 'Cat G', 'company_id' => $companyA->id]);
        $catB = Category::create(['name' => 'Cat D', 'company_id' => $companyB->id]);

        Product::create([
            'name' => 'Gamma Product', 'sku' => 'SKU-G-001',
            'price' => 100, 'cost' => 50, 'qty' => 20, 'min_qty' => 2,
            'company_id' => $companyA->id, 'category_id' => $catA->id,
        ]);

        Product::create([
            'name' => 'Delta Product', 'sku' => 'SKU-D-001',
            'price' => 200, 'cost' => 100, 'qty' => 30, 'min_qty' => 3,
            'company_id' => $companyB->id, 'category_id' => $catB->id,
        ]);

        // Company A تشوف منتجاتها فقط
        $responseA = $this->actingAs($userA, 'sanctum')->getJson('/api/products');
        $namesA    = collect($responseA->json('data'))->pluck('name');
        $this->assertContains('Gamma Product', $namesA);
        $this->assertNotContains('Delta Product', $namesA);

        // Company B تشوف منتجاتها فقط
        $responseB = $this->actingAs($userB, 'sanctum')->getJson('/api/products');
        $namesB    = collect($responseB->json('data'))->pluck('name');
        $this->assertContains('Delta Product', $namesB);
        $this->assertNotContains('Gamma Product', $namesB);
    }
}
