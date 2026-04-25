<?php

namespace App\Models\LiveChat;

use App\Models\User;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveChatMessage extends Model
{
    use BelongsToCompany;

    protected $table = 'live_chat_messages';

    protected $fillable = [
        'company_id', 'session_id', 'sender_id', 'sender_type', 'message',
        'attachments', 'message_type', 'is_read', 'read_at'
    ];

    protected $casts = [
        'attachments' => 'json',
        'read_at' => 'datetime'
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(LiveChatSession::class, 'session_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => now()
        ]);
    }
}
