<?php

namespace App\Jobs;

use App\Events\MultiChannel\IncomingMessage;
use App\Models\MultiChannel\ChannelMessage;
use App\Models\MultiChannel\ChannelIntegration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendChannelMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30; // seconds between retries

    public function __construct(public ChannelMessage $message) {}

    public function handle(): void
    {
        $conversation  = $this->message->conversation()->with('channel')->first();
        $channelType   = $conversation->channel_type ?? null;
        $integration   = ChannelIntegration::where('company_id', $this->message->company_id)
                            ->where('channel_type', $channelType)
                            ->where('is_active', true)
                            ->first();

        if (! $integration) {
            $this->message->update(['status' => 'failed', 'error_message' => 'No active integration found']);
            return;
        }

        $credentials = json_decode($integration->api_credentials, true);
        $externalId  = null;

        try {
            $externalId = match ($channelType) {
                'whatsapp'  => $this->sendWhatsApp($credentials, $conversation, $this->message->message_content),
                'facebook'  => $this->sendFacebook($credentials, $conversation, $this->message->message_content),
                'instagram' => $this->sendInstagram($credentials, $conversation, $this->message->message_content),
                default     => throw new \Exception("Unsupported channel: {$channelType}"),
            };

            $this->message->update([
                'status'              => 'sent',
                'external_message_id' => $externalId,
                'sent_at'             => now(),
            ]);

        } catch (\Exception $e) {
            Log::error("SendChannelMessageJob failed", [
                'message_id'   => $this->message->id,
                'channel_type' => $channelType,
                'error'        => $e->getMessage(),
                'attempt'      => $this->attempts(),
            ]);

            if ($this->attempts() >= $this->tries) {
                $this->message->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            }

            throw $e; // triggers retry
        }
    }

    // ─── WhatsApp Cloud API ──────────────────────────────────────────────────
    private function sendWhatsApp(array $creds, $conversation, string $text): string
    {
        $phoneNumberId = $creds['phone_number_id'];
        $accessToken   = $creds['access_token'];
        $recipient     = $conversation->external_contact_id; // e.g. "201012345678"

        $response = Http::withToken($accessToken)
            ->timeout(15)
            ->post("https://graph.facebook.com/v18.0/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'recipient_type'    => 'individual',
                'to'                => $recipient,
                'type'              => 'text',
                'text'              => ['body' => $text],
            ]);

        if ($response->failed()) {
            throw new \Exception('WhatsApp API error: ' . $response->body());
        }

        return $response->json('messages.0.id') ?? '';
    }

    // ─── Facebook Messenger API ──────────────────────────────────────────────
    private function sendFacebook(array $creds, $conversation, string $text): string
    {
        $pageAccessToken = $creds['page_access_token'];
        $recipient       = $conversation->external_contact_id; // PSID

        $response = Http::withToken($pageAccessToken)
            ->timeout(15)
            ->post('https://graph.facebook.com/v18.0/me/messages', [
                'recipient' => ['id' => $recipient],
                'message'   => ['text' => $text],
            ]);

        if ($response->failed()) {
            throw new \Exception('Facebook API error: ' . $response->body());
        }

        return $response->json('message_id') ?? '';
    }

    // ─── Instagram Messaging API ─────────────────────────────────────────────
    private function sendInstagram(array $creds, $conversation, string $text): string
    {
        $accessToken = $creds['access_token'];
        $igAccountId = $creds['instagram_business_account_id'];
        $recipient   = $conversation->external_contact_id; // Instagram scoped user ID

        $response = Http::withToken($accessToken)
            ->timeout(15)
            ->post("https://graph.facebook.com/v18.0/{$igAccountId}/messages", [
                'recipient' => ['id' => $recipient],
                'message'   => ['text' => $text],
            ]);

        if ($response->failed()) {
            throw new \Exception('Instagram API error: ' . $response->body());
        }

        return $response->json('message_id') ?? '';
    }
}
