<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class ErpNotification extends Model {
    use BelongsToCompany;
    protected $table = 'erp_notifications';
    protected $fillable = ['company_id','user_id','type','title','body','data','icon','url','read_at'];
    protected $casts = ['data'=>'array','read_at'=>'datetime'];
    public function user() { return $this->belongsTo(User::class); }
    public function isRead(): bool { return !is_null($this->read_at); }
}
