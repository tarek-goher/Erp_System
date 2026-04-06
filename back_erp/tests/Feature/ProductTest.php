<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
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

    public function test_can_list_products(): void
    {
        Product::factory()->count(5)->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->getJson('/api/products')
            ->assertOk()
            ->assertJsonStructure(['data' => ['data']]);
    }

    public function test_can_create_product(): void
    {
        $payload = [
            'name'    => 'منتج تجريبي',
            'sku'     => 'SKU-001',
            'price'   => 100.00,
            'cost'    => 70.00,
            'qty'     => 50,
            'min_qty' => 5,
            'unit'    => 'piece',
        ];

        $this->actingAs($this->user)
            ->postJson('/api/products', $payload)
            ->assertStatus(201)
            ->assertJsonPath('data.name', 'منتج تجريبي');

        $this->assertDatabaseHas('products', ['sku' => 'SKU-001', 'company_id' => $this->company->id]);
    }

    public function test_can_update_product(): void
    {
        $product = Product::factory()->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->putJson("/api/products/{$product->id}", ['price' => 200])
            ->assertOk()
            ->assertJsonPath('data.price', 200);
    }

    public function test_can_delete_product(): void
    {
        $product = Product::factory()->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/products/{$product->id}")
            ->assertOk();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_can_filter_low_stock_products(): void
    {
        Product::factory()->create(['company_id' => $this->company->id, 'qty' => 2, 'min_qty' => 10]);
        Product::factory()->create(['company_id' => $this->company->id, 'qty' => 50, 'min_qty' => 5]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/products?low_stock=true');

        $response->assertOk();
        $this->assertCount(1, $response->json('data.data'));
    }
}
