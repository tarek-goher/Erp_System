<?php

namespace App\Events\LiveChat;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AgentTyping implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $sessionId,
        public int $agentId,
        public string $agentName,
        public bool $isTyping
    ) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('live-chat.session.' . $this->sessionId)];
    }

    public function broadcastAs(): string
    {
        return 'agent.typing';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'agent_id'   => $this->agentId,
            'agent_name' => $this->agentName,
            'is_typing'  => $this->isTyping,
        ];
    }
}
