<?php

namespace App\Http\Controllers\API\MultiChannel;

use App\Events\MultiChannel\IncomingMessage;
use App\Http\Controllers\API\BaseController;
use App\Models\MultiChannel\ChannelConversation;
use App\Models\MultiChannel\ChannelIntegration;
use App\Models\MultiChannel\ChannelMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WebhookController extends BaseController
{
    // ─── WhatsApp Webhook ────────────────────────────────────────────────────

    /**
     * Verify WhatsApp webhook (GET challenge)
     */
    public function verifyWhatsApp(Request $request): Response
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $integration = ChannelIntegration::where('channel_type', 'whatsapp')
            ->where('webhook_token', $token)
            ->first();

        if ($mode === 'subscribe' && $integration) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    /**
     * Handle incoming WhatsApp messages
     */
    public function handleWhatsApp(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('WhatsApp webhook received', ['payload' => $payload]);

        try {
            $entries = $payload['entry'] ?? [];

            foreach ($entries as $entry) {
                $changes = $entry['changes'] ?? [];

                foreach ($changes as $change) {
                    $value = $change['value'] ?? [];

                    // Process incoming messages
                    foreach ($value['messages'] ?? [] as $msg) {
                        $this->processWhatsAppMessage($value, $msg);
                    }

                    // Process message status updates
                    foreach ($value['statuses'] ?? [] as $status) {
                        $this->updateMessageStatus('whatsapp', $status['id'], $status['status']);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp webhook processing failed', ['error' => $e->getMessage()]);
        }

        // Always return 200 to WhatsApp (so it doesn't retry)
        return response()->json(['status' => 'ok']);
    }

    private function processWhatsAppMessage(array $metadata, array $msg): void
    {
        $phoneNumberId = $metadata['metadata']['phone_number_id'] ?? null;

        $integration = ChannelIntegration::where('channel_type', 'whatsapp')
            ->whereJsonContains('api_credentials->phone_number_id', $phoneNumberId)
            ->first();

        if (! $integration) return;

        $senderPhone = $msg['from'];
        $externalId  = $msg['id'];
        $text        = $msg['text']['body'] ?? '[non-text message]';
        $msgType     = $msg['type'] ?? 'text';

        // Find or create conversation
        $conversation = ChannelConversation::firstOrCreate(
            [
                'company_id'          => $integration->company_id,
                'channel_integration_id' => $integration->id,
                'external_contact_id' => $senderPhone,
                'channel_type'        => 'whatsapp',
            ],
            [
                'contact_name'    => $senderPhone,
                'status'          => 'open',
                'last_message_at' => now(),
            ]
        );

        $conversation->update(['last_message_at' => now(), 'status' => 'open']);

        // Save message
        $message = ChannelMessage::create([
            'company_id'          => $integration->company_id,
            'conversation_id'     => $conversation->id,
            'external_message_id' => $externalId,
            'direction'           => 'inbound',
            'message_content'     => $text,
            'message_type'        => $msgType,
            'status'              => 'received',
            'received_at'         => now(),
        ]);

        $message->load('conversation');
        event(new IncomingMessage($message));
    }

    // ─── Facebook Webhook ────────────────────────────────────────────────────

    public function verifyFacebook(Request $request): Response
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $integration = ChannelIntegration::where('channel_type', 'facebook')
            ->where('webhook_token', $token)
            ->first();

        if ($mode === 'subscribe' && $integration) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    public function handleFacebook(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Facebook webhook received', ['payload' => $payload]);

        try {
            foreach ($payload['entry'] ?? [] as $entry) {
                foreach ($entry['messaging'] ?? [] as $event) {
                    if (isset($event['message'])) {
                        $this->processFacebookMessage($entry['id'], $event);
                    }
                    if (isset($event['delivery'])) {
                        foreach ($event['delivery']['mids'] ?? [] as $mid) {
                            $this->updateMessageStatus('facebook', $mid, 'delivered');
                        }
                    }
                    if (isset($event['read'])) {
                        foreach ($event['read']['watermark'] ?? [] as $mid) {
                            $this->updateMessageStatus('facebook', $mid, 'read');
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Facebook webhook processing failed', ['error' => $e->getMessage()]);
        }

        return response()->json(['status' => 'ok']);
    }

    private function processFacebookMessage(string $pageId, array $event): void
    {
        $integration = ChannelIntegration::where('channel_type', 'facebook')
            ->whereJsonContains('api_credentials->page_id', $pageId)
            ->first();

        if (! $integration) return;

        $senderId   = $event['sender']['id'];
        $externalId = $event['message']['mid'] ?? null;
        $text       = $event['message']['text'] ?? '[attachment]';

        $conversation = ChannelConversation::firstOrCreate(
            [
                'company_id'             => $integration->company_id,
                'channel_integration_id' => $integration->id,
                'external_contact_id'    => $senderId,
                'channel_type'           => 'facebook',
            ],
            ['contact_name' => 'FB User ' . $senderId, 'status' => 'open', 'last_message_at' => now()]
        );

        $conversation->update(['last_message_at' => now(), 'status' => 'open']);

        $message = ChannelMessage::create([
            'company_id'          => $integration->company_id,
            'conversation_id'     => $conversation->id,
            'external_message_id' => $externalId,
            'direction'           => 'inbound',
            'message_content'     => $text,
            'message_type'        => 'text',
            'status'              => 'received',
            'received_at'         => now(),
        ]);

        $message->load('conversation');
        event(new IncomingMessage($message));
    }

    // ─── Instagram Webhook ───────────────────────────────────────────────────

    public function verifyInstagram(Request $request): Response
    {
        return $this->verifyFacebook($request); // Same mechanism
    }

    public function handleInstagram(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Instagram webhook received', ['payload' => $payload]);

        try {
            foreach ($payload['entry'] ?? [] as $entry) {
                foreach ($entry['messaging'] ?? [] as $event) {
                    if (isset($event['message'])) {
                        $this->processInstagramMessage($entry['id'], $event);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Instagram webhook processing failed', ['error' => $e->getMessage()]);
        }

        return response()->json(['status' => 'ok']);
    }

    private function processInstagramMessage(string $igAccountId, array $event): void
    {
        $integration = ChannelIntegration::where('channel_type', 'instagram')
            ->whereJsonContains('api_credentials->instagram_business_account_id', $igAccountId)
            ->first();

        if (! $integration) return;

        $senderId   = $event['sender']['id'];
        $externalId = $event['message']['mid'] ?? null;
        $text       = $event['message']['text'] ?? '[story/media]';

        $conversation = ChannelConversation::firstOrCreate(
            [
                'company_id'             => $integration->company_id,
                'channel_integration_id' => $integration->id,
                'external_contact_id'    => $senderId,
                'channel_type'           => 'instagram',
            ],
            ['contact_name' => 'IG User ' . $senderId, 'status' => 'open', 'last_message_at' => now()]
        );

        $conversation->update(['last_message_at' => now(), 'status' => 'open']);

        $message = ChannelMessage::create([
            'company_id'          => $integration->company_id,
            'conversation_id'     => $conversation->id,
            'external_message_id' => $externalId,
            'direction'           => 'inbound',
            'message_content'     => $text,
            'message_type'        => 'text',
            'status'              => 'received',
            'received_at'         => now(),
        ]);

        $message->load('conversation');
        event(new IncomingMessage($message));
    }

    // ─── Shared helpers ──────────────────────────────────────────────────────

    private function updateMessageStatus(string $channel, string $externalId, string $status): void
    {
        ChannelMessage::where('external_message_id', $externalId)->update(['status' => $status]);
    }
}
