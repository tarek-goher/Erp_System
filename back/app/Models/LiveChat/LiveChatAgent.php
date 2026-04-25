<?php
namespace App\Models\LiveChat;

use Illuminate\Database\Eloquent\Model;

class LiveChatAgent extends Model
{
    protected $fillable = [
        'company_id',
        'user_id',
        'status',
        'current_chats',
        'max_concurrent_chats',
        'bio',
        'avatar_url',
        'last_seen_at',
    ];

    protected $casts = [
        'current_chats'        => 'integer',
        'max_concurrent_chats' => 'integer',
    ];
}