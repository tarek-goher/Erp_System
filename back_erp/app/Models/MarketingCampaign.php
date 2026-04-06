<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class MarketingCampaign extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','name','type','subject','content',
        'status','sent_at','scheduled_at','contact_list_id',
        'sent_count','open_count','click_count',
    ];
    protected $casts = ['sent_at'=>'datetime','scheduled_at'=>'datetime','sent_count'=>'integer'];
    public function contactList() { return $this->belongsTo(MarketingContactList::class,'contact_list_id'); }
}
