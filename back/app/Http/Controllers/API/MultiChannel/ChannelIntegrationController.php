<?php

namespace App\Http\Controllers\API\MultiChannel;

use App\Http\Controllers\API\BaseController;
use App\Jobs\SendChannelMessageJob;
use App\Models\MultiChannel\ChannelConversation;
use App\Models\MultiChannel\ChannelIntegration;
use App\Models\MultiChannel\ChannelMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChannelIntegrationController extends BaseController
{
    public function index(): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;
            $channels  = ChannelIntegration::where('company_id', $companyId)
                ->select('id', 'channel_type', 'channel_name', 'is_active', 'created_at')
                ->get();
            return $this->sendResponse($channels, 'Channels retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function setupWhatsApp(Request $request): JsonResponse
    {
        try {
            $v = $request->validate([
                'channel_name'    => 'required|string|max:255',
                'phone_number_id' => 'required|string',
                'access_token'    => 'required|string',
                'webhook_token'   => 'required|string',
            ]);

            $companyId = auth('sanctum')->user()->company_id;

            $channel = ChannelIntegration::updateOrCreate(
                ['company_id' => $companyId, 'channel_type' => 'whatsapp'],
                [
                    'channel_name'    => $v['channel_name'],
                    'api_credentials' => encrypt(json_encode([
                        'phone_number_id' => $v['phone_number_id'],
                        'access_token'    => $v['access_token'],
                    ])),
                    'webhook_url'   => config('app.url') . '/api/webhooks/whatsapp',
                    'webhook_token' => $v['webhook_token'],
                    'is_active'     => true,
                ]
            );

            return $this->sendResponse([
                'id'          => $channel->id,
                'channel_type'=> $channel->channel_type,
                'webhook_url' => $channel->webhook_url,
                'instructions'=> 'Set this webhook URL in your WhatsApp Business Manager. Use GET for verification and POST for messages.',
            ], 'WhatsApp configured');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function setupFacebook(Request $request): JsonResponse
    {
        try {
            $v = $request->validate([
                'channel_name'      => 'required|string|max:255',
                'page_id'           => 'required|string',
                'page_access_token' => 'required|string',
                'webhook_token'     => 'required|string',
            ]);

            $companyId = auth('sanctum')->user()->company_id;

            $channel = ChannelIntegration::updateOrCreate(
                ['company_id' => $companyId, 'channel_type' => 'facebook'],
                [
                    'channel_name'    => $v['channel_name'],
                    'api_credentials' => encrypt(json_encode([
                        'page_id'           => $v['page_id'],
                        'page_access_token' => $v['page_access_token'],
                    ])),
                    'webhook_url'   => config('app.url') . '/api/webhooks/facebook',
                    'webhook_token' => $v['webhook_token'],
                    'is_active'     => true,
                ]
            );

            return $this->sendResponse([
                'id'           => $channel->id,
                'webhook_url'  => $channel->webhook_url,
                'instructions' => 'Subscribe to "messages" and "messaging_deliveries" in your Facebook App Webhooks.',
            ], 'Facebook configured');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function setupInstagram(Request $request): JsonResponse
    {
        try {
            $v = $request->validate([
                'channel_name'                    => 'required|string|max:255',
                'instagram_business_account_id'   => 'required|string',
                'access_token'                    => 'required|string',
                'webhook_token'                   => 'required|string',
            ]);

            $companyId = auth('sanctum')->user()->company_id;

            $channel = ChannelIntegration::updateOrCreate(
                ['company_id' => $companyId, 'channel_type' => 'instagram'],
                [
                    'channel_name'    => $v['channel_name'],
                    'api_credentials' => encrypt(json_encode([
                        'instagram_business_account_id' => $v['instagram_business_account_id'],
                        'access_token'                  => $v['access_token'],
                    ])),
                    'webhook_url'   => config('app.url') . '/api/webhooks/instagram',
                    'webhook_token' => $v['webhook_token'],
                    'is_active'     => true,
                ]
            );

            return $this->sendResponse([
                'id'           => $channel->id,
                'webhook_url'  => $channel->webhook_url,
                'instructions' => 'Subscribe to "messages" webhook field in your Instagram Graph API app.',
            ], 'Instagram configured');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function getUnifiedInbox(Request $request): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;
            $status    = $request->query('status', 'open');
            $channel   = $request->query('channel');

            $query = ChannelConversation::where('company_id', $companyId)
                ->where('status', $status)
                ->with(['messages' => fn($q) => $q->latest()->limit(1)])
                ->latest('last_message_at');

            if ($channel) {
                $query->where('channel_type', $channel);
            }

            $conversations = $query->paginate(30);

            return $this->sendResponse($conversations, 'Unified inbox retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Send outbound message — dispatches real job to queue
     */
    public function sendChannelMessage(Request $request): JsonResponse
    {
        try {
            $v = $request->validate([
                'conversation_id' => 'required|integer',
                'message'         => 'required|string|max:4096',
            ]);

            $companyId    = auth('sanctum')->user()->company_id;
            $conversation = ChannelConversation::where('company_id', $companyId)->findOrFail($v['conversation_id']);

            $message = ChannelMessage::create([
                'company_id'      => $companyId,
                'conversation_id' => $conversation->id,
                'direction'       => 'outbound',
                'message_content' => $v['message'],
                'message_type'    => 'text',
                'status'          => 'pending',
            ]);

            // 🔴 Dispatch real job (sends via WhatsApp/FB/IG API with retries)
            SendChannelMessageJob::dispatch($message)->onQueue('channels');

            return $this->sendResponse([
                'message_id' => $message->id,
                'status'     => 'queued',
            ], 'Message queued for sending');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function getChannelStats(Request $request): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;
            $from      = $request->query('from', now()->subDays(30)->toDateString());
            $to        = $request->query('to', now()->toDateString());

            $stats = DB::table('channel_messages as m')
                ->join('channel_conversations as c', 'm.conversation_id', '=', 'c.id')
                ->where('m.company_id', $companyId)
                ->whereDate('m.created_at', '>=', $from)
                ->whereDate('m.created_at', '<=', $to)
                ->selectRaw("
                    c.channel_type,
                    COUNT(*) as total_messages,
                    SUM(CASE WHEN m.direction = 'inbound' THEN 1 ELSE 0 END) as inbound,
                    SUM(CASE WHEN m.direction = 'outbound' THEN 1 ELSE 0 END) as outbound,
                    SUM(CASE WHEN m.status = 'failed' THEN 1 ELSE 0 END) as failed,
                    COUNT(DISTINCT m.conversation_id) as unique_conversations
                ")
                ->groupBy('c.channel_type')
                ->get();

            $daily = DB::table('channel_messages as m')
                ->join('channel_conversations as c', 'm.conversation_id', '=', 'c.id')
                ->where('m.company_id', $companyId)
                ->whereDate('m.created_at', '>=', $from)
                ->whereDate('m.created_at', '<=', $to)
                ->selectRaw("DATE(m.created_at) as date, c.channel_type, COUNT(*) as messages")
                ->groupBy(DB::raw('DATE(m.created_at)'), 'c.channel_type')
                ->orderBy('date')
                ->get();

            return $this->sendResponse([
                'by_channel' => $stats,
                'daily'      => $daily,
                'period'     => ['from' => $from, 'to' => $to],
            ], 'Channel statistics retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }
}
