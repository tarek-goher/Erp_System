<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class SmsLog extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'provider', 'to', 'message',
        'status', 'external_id', 'sent_by',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
