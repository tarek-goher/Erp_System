<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends Model
{
    use BelongsToCompany, SoftDeletes;

    protected $fillable = [
        'company_id', 'name', 'type', 'subject', 'body',
        'audience', 'send_at', 'sent_at', 'status',
        'sent_count', 'open_count', 'click_count',
    ];

    protected $casts = [
        'send_at'     => 'datetime',
        'sent_at'     => 'datetime',
        'sent_count'  => 'integer',
        'open_count'  => 'integer',
        'click_count' => 'integer',
    ];
}
