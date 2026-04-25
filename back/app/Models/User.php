<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'company_id', 'name', 'email', 'password',
        'phone', 'avatar', 'is_active', 'is_super_admin',
        'last_login_at', 'two_factor_secret', 'two_factor_confirmed',
    ];

    protected $hidden = ['password', 'remember_token', 'two_factor_secret'];

    protected $casts = [
        'email_verified_at'    => 'datetime',
        'last_login_at'        => 'datetime',
        'is_active'            => 'boolean',
        'is_super_admin'       => 'boolean',
        'two_factor_confirmed' => 'boolean',
    ];

    public function company()       { return $this->belongsTo(Company::class); }
    public function employee()      { return $this->hasOne(Employee::class); }
    public function notifications() { return $this->hasMany(ErpNotification::class); }
}
