<?php

namespace App\Models\LiveChat;

use App\Models\User;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiveChatSession extends Model
{
    use BelongsToCompany;

    protected $table = 'live_chat_sessions';

    protected $fillable = [
        'company_id', 'visitor_id', 'agent_id', 'session_token', 'status',
        'started_at', 'assigned_at', 'ended_at', 'wait_time_seconds',
        'chat_duration_seconds', 'notes'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'assigned_at' => 'datetime',
        'ended_at' => 'datetime'
    ];

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(LiveChatVisitor::class, 'visitor_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(LiveChatMessage::class, 'session_id');
    }

    public function getUnreadMessagesCount(): int
    {
        return $this->messages()->where('is_read', false)->count();
    }
}
