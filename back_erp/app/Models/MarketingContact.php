<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class MarketingContact extends Model {
    use HasFactory;
    protected $fillable = ['marketing_contact_list_id','name','email','phone','is_subscribed'];
    protected $casts = ['is_subscribed'=>'boolean'];
    public function list() { return $this->belongsTo(MarketingContactList::class,'marketing_contact_list_id'); }
}
