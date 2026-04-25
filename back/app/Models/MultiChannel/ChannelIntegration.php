<?php

namespace App\Models\MultiChannel;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChannelIntegration extends Model
{
    use BelongsToCompany;

    protected $table = 'channel_integrations';

    protected $fillable = [
        'company_id', 'channel_type', 'channel_name', 'api_credentials',
        'webhook_url', 'webhook_token', 'is_active', 'settings', 'last_synced_at'
    ];

    protected $casts = [
        'api_credentials' => 'encrypted',
        'settings' => 'json',
        'last_synced_at' => 'datetime'
    ];

    protected $hidden = ['api_credentials'];

    public function messages(): HasMany
    {
        return $this->hasMany(ChannelMessage::class, 'channel_integration_id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(ChannelConversation::class);
    }

    public function isWhatsApp(): bool
    {
        return $this->channel_type === 'whatsapp';
    }

    public function isFacebook(): bool
    {
        return $this->channel_type === 'facebook';
    }

    public function isInstagram(): bool
    {
        return $this->channel_type === 'instagram';
    }
}
