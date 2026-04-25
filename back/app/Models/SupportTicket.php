<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use BelongsToCompany;
    protected $fillable = [
        'company_id','subject','message','admin_reply',
        'priority','category','status','resolved_at',
        'first_response_at','response_time_hours','attachments',
    ];

    protected $casts = [
        'resolved_at'        => 'datetime',
        'first_response_at'  => 'datetime',
        'attachments'        => 'array',
    ];

    public function company()  { return $this->belongsTo(Company::class); }
    public function messages() { return $this->hasMany(TicketMessage::class, 'ticket_id'); }
}
