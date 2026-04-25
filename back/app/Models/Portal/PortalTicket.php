<?php

namespace App\Models\Portal;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortalTicket extends Model
{
    use BelongsToCompany;

    protected $table = 'portal_tickets';

    protected $fillable = [
        'company_id', 'portal_user_id', 'support_ticket_id', 'title',
        'description', 'category', 'priority', 'status', 'attachments', 'resolved_at'
    ];

    protected $casts = [
        'attachments' => 'json',
        'resolved_at' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(PortalUser::class, 'portal_user_id');
    }
}
