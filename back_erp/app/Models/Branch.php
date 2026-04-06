<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Branch extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','name','address','phone','email',
        'manager_id','is_active','lat','lng',
    ];
    protected $casts = ['is_active'=>'boolean'];
    public function manager() { return $this->belongsTo(User::class,'manager_id'); }
}
