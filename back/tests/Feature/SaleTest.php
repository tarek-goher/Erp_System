<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleTest extends TestCase
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

    // ── List Sales ────────────────────────────────────────────

    public function test_can_list_sales(): void
    {
        Sale::factory()->count(3)->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->getJson('/api/sales')
            ->assertOk()
            ->assertJsonStructure(['data' => ['data']]);
    }

    public function test_cannot_see_other_companies_sales(): void
    {
        $otherCompany = Company::factory()->create();
        Sale::factory()->create(['company_id' => $otherCompany->id]);

        $response = $this->actingAs($this->user)->getJson('/api/sales');

        $response->assertOk();
        $this->assertCount(0, $response->json('data.data'));
    }

    // ── Create Sale ───────────────────────────────────────────

    public function test_can_create_sale_and_stock_decreases(): void
    {
        $customer = Customer::factory()->create(['company_id' => $this->company->id]);
        $product  = Product::factory()->create(['company_id' => $this->company->id, 'qty' => 10]);

        $payload = [
            'customer_id'    => $customer->id,
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3, 'unit_price' => 50],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/sales', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['invoice_number']]);

        // يتأكد إن المخزون اتخصم
        $this->assertDatabaseHas('products', ['id' => $product->id, 'qty' => 7]);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type'       => 'out',
            'qty'        => 3,
        ]);
    }

    // ── Get Sale ──────────────────────────────────────────────

    public function test_can_get_single_sale(): void
    {
        $sale = Sale::factory()->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->getJson("/api/sales/{$sale->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $sale->id);
    }

    // ── Delete Sale ───────────────────────────────────────────

    public function test_can_delete_sale_and_stock_is_restored(): void
    {
        $product = Product::factory()->create(['company_id' => $this->company->id, 'qty' => 7]);
        $sale    = Sale::factory()->create(['company_id' => $this->company->id]);
        $sale->items()->create([
            'product_id' => $product->id,
            'quantity'   => 3,
            'unit_price' => 50,
            'total'      => 150,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/sales/{$sale->id}")
            ->assertOk();

        // المخزون رجع
        $this->assertDatabaseHas('products', ['id' => $product->id, 'qty' => 10]);
    }

    // ── Stats ─────────────────────────────────────────────────

    public function test_can_get_sales_stats(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/sales/stats')
            ->assertOk()
            ->assertJsonStructure(['data' => ['today_revenue', 'month_revenue']]);
    }
}
