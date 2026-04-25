<?php

namespace App\Events\LiveChat;

use App\Models\LiveChat\LiveChatSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionAssigned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public LiveChatSession $session) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('live-chat.session.' . $this->session->id),
            new Channel('live-chat.agent.' . $this->session->agent_id),
            new Channel('live-chat.company.' . $this->session->company_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'session.assigned';
    }

    public function broadcastWith(): array
    {
        $this->session->load(['agent:id,name,email', 'visitor']);
        return [
            'session_id'  => $this->session->id,
            'status'      => $this->session->status,
            'agent'       => $this->session->agent ? [
                'id'    => $this->session->agent->id,
                'name'  => $this->session->agent->name,
                'email' => $this->session->agent->email,
            ] : null,
            'assigned_at' => $this->session->assigned_at?->toISOString(),
        ];
    }
}
