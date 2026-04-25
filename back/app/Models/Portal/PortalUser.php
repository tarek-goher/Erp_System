<?php

namespace App\Models\Portal;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class PortalUser extends Authenticatable
{
    use BelongsToCompany, HasApiTokens, Notifiable;

    protected $table = 'portal_users';

    protected $fillable = [
        'company_id', 'crm_contact_id', 'email', 'password', 'first_name',
        'last_name', 'phone', 'avatar_url', 'status', 'address', 'city',
        'state', 'postal_code', 'country', 'email_verified_at', 'last_login_at'
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime'
    ];

    public function tickets(): HasMany
    {
        return $this->hasMany(PortalTicket::class, 'portal_user_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(PortalOrder::class, 'portal_user_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(PortalInvoice::class, 'portal_user_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PortalPayment::class, 'portal_user_id');
    }

    public function getFullName(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
