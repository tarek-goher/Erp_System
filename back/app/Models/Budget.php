<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Budget extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','account_id','name','amount',
        'period_start','period_end','notes',
    ];
    protected $casts = ['amount'=>'decimal:2','period_start'=>'date','period_end'=>'date'];
    public function account() { return $this->belongsTo(Account::class); }
}
