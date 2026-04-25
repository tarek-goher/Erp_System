<?php

namespace App\Http\Controllers\API\LiveChat;

use App\Events\LiveChat\AgentTyping;
use App\Events\LiveChat\MessageSent;
use App\Events\LiveChat\SessionAssigned;
use App\Http\Controllers\API\BaseController;
use App\Models\LiveChat\LiveChatAgent;
use App\Models\LiveChat\LiveChatMessage;
use App\Models\LiveChat\LiveChatSession;
use App\Models\LiveChat\LiveChatVisitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LiveChatController extends BaseController
{
    /**
     * Start a new chat session
     */
    public function startSession(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'  => 'nullable|string|max:255',
                'email' => 'nullable|email',
                'phone' => 'nullable|string|max:20',
            ]);

            $companyId    = auth('sanctum')->user()->company_id;
            $sessionToken = Str::uuid();

            $visitor = LiveChatVisitor::create([
                'company_id'       => $companyId,
                'session_id'       => $sessionToken,
                'name'             => $validated['name'] ?? 'Guest',
                'email'            => $validated['email'] ?? null,
                'phone'            => $validated['phone'] ?? null,
                'ip_address'       => $request->ip(),
                'browser'          => $request->userAgent(),
                'status'           => 'online',
                'last_activity_at' => now(),
            ]);

            $session = LiveChatSession::create([
                'company_id'    => $companyId,
                'visitor_id'    => $visitor->id,
                'session_token' => $sessionToken,
                'status'        => 'pending',
                'started_at'    => now(),
            ]);

            // Auto-assign to available agent if exists
            $agent = $this->findAvailableAgent($companyId);
            if ($agent) {
                $session = $this->doAssignAgent($session, $agent);
            }

            return $this->sendResponse([
                'session_id'    => $session->id,
                'session_token' => $sessionToken,
                'visitor_id'    => $visitor->id,
                'status'        => $session->status,
                'agent'         => $agent ? ['id' => $agent->user_id, 'name' => $agent->user?->name] : null,
                // Frontend subscribes to: live-chat.session.{session_id}
                'channel'       => 'live-chat.session.' . $session->id,
            ], 'Chat session started');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Send a message — saves + broadcasts via Pusher/Soketi
     */
    public function sendMessage(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'session_id'   => 'required|integer',
                'message'      => 'required|string|max:5000',
                'message_type' => 'in:text,file,image,video',
            ]);

            $session = LiveChatSession::findOrFail($validated['session_id']);

            if ($session->status === 'closed') {
                return $this->sendError('Cannot send message to a closed session', [], 422);
            }

            $user    = auth('sanctum')->user();
            $message = LiveChatMessage::create([
                'company_id'   => $session->company_id,
                'session_id'   => $session->id,
                'sender_id'    => $user?->id,
                'sender_type'  => $user ? 'agent' : 'visitor',
                'message'      => $validated['message'],
                'message_type' => $validated['message_type'] ?? 'text',
            ]);

            $message->load('sender:id,name,email');

            // 🔴 REAL broadcast via Laravel Echo / Pusher
            event(new MessageSent($message, $session));

            return $this->sendResponse($message, 'Message sent');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Typing indicator — broadcasts to session channel
     */
    public function typing(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'session_id' => 'required|integer',
                'is_typing'  => 'required|boolean',
            ]);

            $user = auth('sanctum')->user();

            event(new AgentTyping(
                $validated['session_id'],
                $user->id,
                $user->name,
                $validated['is_typing']
            ));

            return $this->sendResponse([], 'Typing status sent');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Get session messages (with pagination)
     */
    public function getMessages(Request $request, LiveChatSession $session): JsonResponse
    {
        try {
            $messages = $session->messages()
                ->with('sender:id,name,email')
                ->orderBy('created_at', 'asc')
                ->paginate(50);

            // Mark all messages as read for this agent
            $session->messages()
                ->where('sender_type', 'visitor')
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);

            return $this->sendResponse($messages, 'Messages retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Get available agents
     */
    public function getAvailableAgents(): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;

            $agents = LiveChatAgent::where('company_id', $companyId)
                ->where('status', 'available')
                ->whereColumn('current_chats', '<', 'max_concurrent_chats')
                ->with('user:id,name,email')
                ->get();

            return $this->sendResponse($agents, 'Available agents retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Assign chat to agent + broadcast
     */
    public function assignAgent(LiveChatSession $session, LiveChatAgent $agent): JsonResponse
    {
        try {
            $session = $this->doAssignAgent($session, $agent);
            return $this->sendResponse($session->load('agent:id,name,email'), 'Agent assigned');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Close chat session
     */
    public function closeSession(LiveChatSession $session): JsonResponse
    {
        try {
            $session->update([
                'status'                => 'closed',
                'ended_at'              => now(),
                'chat_duration_seconds' => now()->diffInSeconds($session->started_at),
            ]);

            if ($session->agent_id) {
                LiveChatAgent::where('user_id', $session->agent_id)->decrement('current_chats');
            }

            return $this->sendResponse($session, 'Chat session closed');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Get pending (unassigned) sessions
     */
    public function getPendingSessions(): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;

            $sessions = LiveChatSession::where('company_id', $companyId)
                ->where('status', 'pending')
                ->with(['visitor', 'messages' => fn($q) => $q->latest()->limit(1)])
                ->orderBy('started_at')
                ->get();

            return $this->sendResponse($sessions, 'Pending sessions retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Get real analytics from DB
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;
            $from      = $request->query('from', now()->subDays(30)->toDateString());
            $to        = $request->query('to', now()->toDateString());

            $summary = DB::table('live_chat_sessions')
                ->where('company_id', $companyId)
                ->whereDate('started_at', '>=', $from)
                ->whereDate('started_at', '<=', $to)
                ->selectRaw("
                    COUNT(*) as total_sessions,
                    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_sessions,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sessions,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_sessions,
                    AVG(wait_time_seconds) as avg_wait_seconds,
                    AVG(chat_duration_seconds) as avg_duration_seconds
                ")
                ->first();

            $daily = DB::table('live_chat_sessions')
                ->where('company_id', $companyId)
                ->whereDate('started_at', '>=', $from)
                ->whereDate('started_at', '<=', $to)
                ->selectRaw("DATE(started_at) as date, COUNT(*) as sessions, AVG(chat_duration_seconds) as avg_duration")
                ->groupBy(DB::raw('DATE(started_at)'))
                ->orderBy('date')
                ->get();

            $agentPerformance = DB::table('live_chat_sessions as s')
                ->join('users as u', 's.agent_id', '=', 'u.id')
                ->where('s.company_id', $companyId)
                ->whereDate('s.started_at', '>=', $from)
                ->whereDate('s.started_at', '<=', $to)
                ->whereNotNull('s.agent_id')
                ->selectRaw("u.name as agent_name, COUNT(*) as handled, AVG(s.chat_duration_seconds) as avg_duration, AVG(s.wait_time_seconds) as avg_wait")
                ->groupBy('s.agent_id', 'u.name')
                ->orderByDesc('handled')
                ->get();

            return $this->sendResponse([
                'summary'           => $summary,
                'daily'             => $daily,
                'agent_performance' => $agentPerformance,
                'period'            => ['from' => $from, 'to' => $to],
            ], 'Analytics retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function findAvailableAgent(int $companyId): ?LiveChatAgent
    {
        return LiveChatAgent::where('company_id', $companyId)
            ->where('status', 'available')
            ->whereColumn('current_chats', '<', 'max_concurrent_chats')
            ->orderBy('current_chats')
            ->first();
    }

    private function doAssignAgent(LiveChatSession $session, LiveChatAgent $agent): LiveChatSession
    {
        $session->update([
            'agent_id'         => $agent->user_id,
            'status'           => 'active',
            'assigned_at'      => now(),
            'wait_time_seconds'=> now()->diffInSeconds($session->started_at),
        ]);

        $agent->increment('current_chats');
        $session->load(['agent:id,name,email', 'visitor']);

        event(new SessionAssigned($session));

        return $session;
    }
}
