<?php

namespace App\Models\MultiChannel;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChannelMessage extends Model
{
    use BelongsToCompany;

    protected $table = 'channel_messages';

    protected $fillable = [
        'company_id', 'channel_integration_id', 'ticket_id', 'contact_id',
        'external_message_id', 'external_contact_id', 'contact_name',
        'contact_phone', 'contact_email', 'direction', 'message_content',
        'media', 'status', 'metadata', 'sent_at', 'delivered_at', 'read_at'
    ];

    protected $casts = [
        'media' => 'json',
        'metadata' => 'json',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime'
    ];

    public function channel(): BelongsTo
    {
        return $this->belongsTo(ChannelIntegration::class, 'channel_integration_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChannelConversation::class);
    }

    public function markAsDelivered(): void
    {
        $this->update([
            'status' => 'delivered',
            'delivered_at' => now()
        ]);
    }

    public function markAsRead(): void
    {
        $this->update([
            'status' => 'read',
            'read_at' => now()
        ]);
    }
}
