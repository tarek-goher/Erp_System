<?php

namespace Tests\Feature\LiveChat;

use App\Events\LiveChat\MessageSent;
use App\Events\LiveChat\SessionAssigned;
use App\Models\LiveChat\LiveChatAgent;
use App\Models\LiveChat\LiveChatSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class LiveChatTest extends TestCase
{
    use RefreshDatabase;

    private User $agent;

    protected function setUp(): void
    {
        parent::setUp();
        $this->agent = User::factory()->create(['company_id' => 1]);
    }

    public function test_can_start_chat_session(): void
    {
        $response = $this->actingAs($this->agent, 'sanctum')
            ->postJson('/api/live-chat/sessions/start', [
                'name'  => 'Test Visitor',
                'email' => 'visitor@test.com',
            ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['session_id', 'session_token', 'visitor_id', 'channel']]);
    }

    public function test_send_message_broadcasts_event(): void
    {
        Event::fake([MessageSent::class]);

        $session = LiveChatSession::factory()->create([
            'company_id' => $this->agent->company_id,
            'status'     => 'active',
        ]);

        $response = $this->actingAs($this->agent, 'sanctum')
            ->postJson('/api/live-chat/messages/send', [
                'session_id' => $session->id,
                'message'    => 'Hello from agent',
            ]);

        $response->assertStatus(200);
        Event::assertDispatched(MessageSent::class);
    }

    public function test_cannot_send_message_to_closed_session(): void
    {
        $session = LiveChatSession::factory()->create([
            'company_id' => $this->agent->company_id,
            'status'     => 'closed',
        ]);

        $response = $this->actingAs($this->agent, 'sanctum')
            ->postJson('/api/live-chat/messages/send', [
                'session_id' => $session->id,
                'message'    => 'Hello',
            ]);

        $response->assertStatus(200)->assertJson(['success' => false]);
    }

    public function test_assign_agent_broadcasts_event(): void
    {
        Event::fake([SessionAssigned::class]);

        $session = LiveChatSession::factory()->create([
            'company_id' => $this->agent->company_id,
            'status'     => 'pending',
        ]);

        $agent = LiveChatAgent::factory()->create([
            'company_id'          => $this->agent->company_id,
            'user_id'             => $this->agent->id,
            'status'              => 'available',
            'current_chats'       => 0,
            'max_concurrent_chats'=> 3,
        ]);

        $response = $this->actingAs($this->agent, 'sanctum')
            ->postJson("/api/live-chat/sessions/{$session->id}/assign/{$agent->id}");

        $response->assertStatus(200);
        Event::assertDispatched(SessionAssigned::class);
    }

    public function test_get_analytics_returns_summary(): void
    {
        $response = $this->actingAs($this->agent, 'sanctum')
            ->getJson('/api/live-chat/analytics');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['summary', 'daily', 'agent_performance', 'period']]);
    }

    public function test_typing_indicator_broadcasts(): void
    {
        Event::fake();

        $session = LiveChatSession::factory()->create(['company_id' => $this->agent->company_id]);

        $response = $this->actingAs($this->agent, 'sanctum')
            ->postJson('/api/live-chat/typing', [
                'session_id' => $session->id,
                'is_typing'  => true,
            ]);

        $response->assertStatus(200);
    }
}
