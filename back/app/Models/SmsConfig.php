<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class SmsConfig extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'provider', 'account_sid', 'auth_token',
        'from_number', 'api_key', 'api_secret', 'is_active',
    ];

    protected $hidden = ['auth_token', 'api_secret'];

    protected $casts = ['is_active' => 'boolean'];
}
