<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseTest extends TestCase
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

    public function test_can_list_purchases(): void
    {
        Purchase::factory()->count(3)->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->getJson('/api/purchases')
            ->assertOk()
            ->assertJsonStructure(['data' => ['data']]);
    }

    public function test_can_create_purchase_order(): void
    {
        $supplier = Supplier::factory()->create(['company_id' => $this->company->id]);
        $product  = Product::factory()->create(['company_id' => $this->company->id, 'qty' => 0]);

        $payload = [
            'supplier_id' => $supplier->id,
            'status'      => 'received',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 20, 'unit_price' => 30],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/purchases', $payload);

        $response->assertStatus(201);

        // المخزون زاد بعد الاستلام
        $this->assertDatabaseHas('products', ['id' => $product->id, 'qty' => 20]);
    }

    public function test_stock_not_increased_for_pending_purchase(): void
    {
        $supplier = Supplier::factory()->create(['company_id' => $this->company->id]);
        $product  = Product::factory()->create(['company_id' => $this->company->id, 'qty' => 5]);

        $payload = [
            'supplier_id' => $supplier->id,
            'status'      => 'pending',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 10, 'unit_price' => 25],
            ],
        ];

        $this->actingAs($this->user)->postJson('/api/purchases', $payload)->assertStatus(201);

        // المخزون ما اتغيرش (الأمر لسه pending)
        $this->assertDatabaseHas('products', ['id' => $product->id, 'qty' => 5]);
    }

    public function test_can_delete_purchase(): void
    {
        $purchase = Purchase::factory()->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/purchases/{$purchase->id}")
            ->assertOk();

        $this->assertSoftDeleted('purchases', ['id' => $purchase->id]);
    }
}
