<?php

namespace App\Events\MultiChannel;

use App\Models\MultiChannel\ChannelMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncomingMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ChannelMessage $message) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('multichannel.company.' . $this->message->company_id),
            new Channel('multichannel.conversation.' . $this->message->conversation_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'incoming.message';
    }

    public function broadcastWith(): array
    {
        return [
            'id'              => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'channel_type'    => $this->message->conversation?->channel_type ?? 'unknown',
            'direction'       => $this->message->direction,
            'content'         => $this->message->message_content,
            'status'          => $this->message->status,
            'created_at'      => $this->message->created_at->toISOString(),
        ];
    }
}
