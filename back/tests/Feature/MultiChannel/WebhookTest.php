<?php

namespace Tests\Feature\MultiChannel;

use App\Events\MultiChannel\IncomingMessage;
use App\Models\MultiChannel\ChannelIntegration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_whatsapp_webhook_verification(): void
    {
        $integration = ChannelIntegration::factory()->create([
            'channel_type'  => 'whatsapp',
            'webhook_token' => 'test_token_123',
        ]);

        $response = $this->get('/api/webhooks/whatsapp?' . http_build_query([
            'hub_mode'         => 'subscribe',
            'hub_verify_token' => 'test_token_123',
            'hub_challenge'    => 'challenge_xyz',
        ]));

        $response->assertStatus(200)->assertSee('challenge_xyz');
    }

    public function test_whatsapp_webhook_rejects_invalid_token(): void
    {
        $response = $this->get('/api/webhooks/whatsapp?' . http_build_query([
            'hub_mode'         => 'subscribe',
            'hub_verify_token' => 'wrong_token',
            'hub_challenge'    => 'challenge_xyz',
        ]));

        $response->assertStatus(403);
    }

    public function test_incoming_whatsapp_message_fires_event(): void
    {
        Event::fake([IncomingMessage::class]);

        $integration = ChannelIntegration::factory()->create([
            'company_id'     => 1,
            'channel_type'   => 'whatsapp',
            'api_credentials'=> json_encode(['phone_number_id' => '12345']),
            'is_active'      => true,
        ]);

        $payload = [
            'entry' => [[
                'changes' => [[
                    'value' => [
                        'metadata'   => ['phone_number_id' => '12345'],
                        'messages'   => [[
                            'from' => '201012345678',
                            'id'   => 'wamid_test_123',
                            'type' => 'text',
                            'text' => ['body' => 'Hello from WhatsApp'],
                        ]],
                    ],
                ]],
            ]],
        ];

        $response = $this->postJson('/api/webhooks/whatsapp', $payload);
        $response->assertStatus(200)->assertJson(['status' => 'ok']);
        Event::assertDispatched(IncomingMessage::class);
    }

    public function test_send_message_dispatches_job(): void
    {
        \Illuminate\Support\Facades\Queue::fake();

        $user = \App\Models\User::factory()->create(['company_id' => 1]);
        $integration = ChannelIntegration::factory()->create([
            'company_id'  => 1,
            'channel_type'=> 'whatsapp',
            'is_active'   => true,
        ]);
        $conversation = \App\Models\MultiChannel\ChannelConversation::factory()->create([
            'company_id'             => 1,
            'channel_integration_id' => $integration->id,
            'channel_type'           => 'whatsapp',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/channels/messages/send', [
                'conversation_id' => $conversation->id,
                'message'         => 'Test message',
            ]);

        $response->assertStatus(200);
        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\SendChannelMessageJob::class);
    }
}
