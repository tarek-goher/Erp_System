<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'address',
        'logo', 'status', 'subscription_plan',
        'subscription_expires_at', 'settings',
        'tax_number', 'currency', 'country',
    ];

    protected $casts = [
        'settings'               => 'array',
        'subscription_expires_at'=> 'datetime',
    ];

    // ── Relationships ────────────────────────────────
    public function users()         { return $this->hasMany(User::class); }
    public function subscriptions() { return $this->hasMany(Subscription::class); }
    public function branches()      { return $this->hasMany(Branch::class); }
    public function tickets()       { return $this->hasMany(Ticket::class); }

    // ── Helpers ──────────────────────────────────────
    public function isActive(): bool   { return $this->status === 'active'; }
    public function isSuspended(): bool{ return $this->status === 'suspended'; }
}
