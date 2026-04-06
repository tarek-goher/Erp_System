<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ApiKey extends Model {
    protected $fillable = ['company_id','created_by','name','key_hash','scopes','is_active','last_used_at','expires_at'];
    protected $casts = ['is_active' => 'boolean', 'scopes' => 'array', 'expires_at' => 'datetime', 'last_used_at' => 'datetime'];
    protected $hidden = ['key_hash'];
}
