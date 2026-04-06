<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HelpdeskTest extends TestCase
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

    public function test_can_list_tickets(): void
    {
        Ticket::factory()->count(3)->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->getJson('/api/helpdesk')
            ->assertOk()
            ->assertJsonStructure(['data' => ['data']]);
    }

    public function test_can_create_ticket(): void
    {
        $customer = Customer::factory()->create(['company_id' => $this->company->id]);

        $payload = [
            'customer_id' => $customer->id,
            'subject'     => 'مشكلة في الدفع',
            'description' => 'العميل يواجه مشكلة في إتمام الدفع الإلكتروني',
            'priority'    => 'high',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/helpdesk', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'open')
            ->assertJsonPath('data.priority', 'high');

        // SLA يتحسب تلقائياً
        $this->assertNotNull($response->json('data.sla_due_at'));
    }

    public function test_can_reply_to_ticket(): void
    {
        $ticket = Ticket::factory()->create(['company_id' => $this->company->id]);

        $this->actingAs($this->user)
            ->postJson("/api/helpdesk/{$ticket->id}/reply", [
                'message' => 'شكراً لتواصلك معنا. جارٍ المتابعة.',
            ])
            ->assertStatus(201);

        // الحالة تتغير إلى in_progress
        $this->assertDatabaseHas('tickets', [
            'id'     => $ticket->id,
            'status' => 'in_progress',
        ]);
    }

    public function test_can_resolve_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'company_id' => $this->company->id,
            'status'     => 'in_progress',
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/helpdesk/{$ticket->id}/resolve", [
                'resolution' => 'تم حل المشكلة بنجاح عبر تحديث الـ API.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved');
    }

    public function test_can_get_helpdesk_stats(): void
    {
        Ticket::factory()->create(['company_id' => $this->company->id, 'status' => 'open']);
        Ticket::factory()->create(['company_id' => $this->company->id, 'status' => 'resolved']);

        $response = $this->actingAs($this->user)
            ->getJson('/api/helpdesk/stats');

        $response->assertOk()
            ->assertJsonStructure(['data' => ['open', 'in_progress', 'resolved', 'urgent', 'overdue']]);
    }
}
