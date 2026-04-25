<?php

namespace App\Models\LiveChat;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiveChatVisitor extends Model
{
    use BelongsToCompany;

    protected $table = 'live_chat_visitors';

    protected $fillable = [
        'company_id', 'session_id', 'name', 'email', 'phone',
        'ip_address', 'browser', 'device', 'current_page', 'referrer',
        'status', 'last_activity_at'
    ];

    protected $casts = [
        'last_activity_at' => 'datetime'
    ];

    public function sessions(): HasMany
    {
        return $this->hasMany(LiveChatSession::class, 'visitor_id');
    }

    public function activeSession(): ?LiveChatSession
    {
        return $this->sessions()
            ->where('status', '!=', 'closed')
            ->latest()
            ->first();
    }
}
