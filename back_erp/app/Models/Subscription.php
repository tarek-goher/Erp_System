<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'plan',
        'billing_cycle',
        'status',
        'amount',
        'starts_at',
        'ends_at',
        'auto_renew',
        'notes',
    ];

    protected $casts = [
        'starts_at'  => 'date',
        'ends_at'    => 'date',
        'amount'     => 'decimal:2',
        'auto_renew' => 'boolean',
    ];

    public function company() { return $this->belongsTo(Company::class); }

    public function isExpired(): bool
    {
        return $this->ends_at->isPast();
    }

    public function daysRemaining(): int
    {
        return max(0, now()->diffInDays($this->ends_at, false));
    }
}
