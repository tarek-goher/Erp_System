<?php

namespace App\Models\MultiChannel;

use App\Models\User;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChannelConversation extends Model
{
    use BelongsToCompany;

    protected $table = 'channel_conversations';

    protected $fillable = [
        'company_id', 'ticket_id', 'external_conversation_id',
        'contact_phone_or_id', 'contact_name', 'channels',
        'status', 'assigned_agent_id', 'message_count',
        'last_message_at', 'closed_at'
    ];

    protected $casts = [
        'channels' => 'json',
        'last_message_at' => 'datetime',
        'closed_at' => 'datetime'
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(ChannelMessage::class, 'conversation_id');
    }

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }
}
