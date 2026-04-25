<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class IpWhitelistEntry extends Model
{
    use BelongsToCompany;

    protected $fillable = ['company_id', 'ip_address', 'label', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];
}
