<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class MarketingContactList extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = ['company_id','name','description'];
    public function contacts()   { return $this->hasMany(MarketingContact::class); }
    public function campaigns()  { return $this->hasMany(MarketingCampaign::class,'contact_list_id'); }
}
