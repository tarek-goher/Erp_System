<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class PaymentGatewayConfig extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'provider', 'paymob_api_key', 'paymob_iframe_id',
        'paymob_integration_id', 'stripe_public_key', 'stripe_secret_key',
        'is_active', 'currency',
    ];

    protected $hidden = ['paymob_api_key', 'stripe_secret_key'];

    protected $casts = ['is_active' => 'boolean'];
}
