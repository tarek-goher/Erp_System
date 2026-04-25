<?php

namespace App\Events\LiveChat;

use App\Models\LiveChat\LiveChatMessage;
use App\Models\LiveChat\LiveChatSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public LiveChatMessage $message,
        public LiveChatSession $session
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('live-chat.session.' . $this->session->id),
            new Channel('live-chat.company.' . $this->session->company_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id'           => $this->message->id,
            'session_id'   => $this->message->session_id,
            'sender_id'    => $this->message->sender_id,
            'sender_type'  => $this->message->sender_type,
            'sender_name'  => $this->message->sender?->name ?? 'Visitor',
            'message'      => $this->message->message,
            'message_type' => $this->message->message_type,
            'is_read'      => false,
            'created_at'   => $this->message->created_at->toISOString(),
        ];
    }
}
