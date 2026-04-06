<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class PosShift extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id','user_id','opening_cash','closing_cash',
        'total_sales','sales_count','cash_difference',
        'status','opened_at','closed_at','notes',
    ];

    protected $casts = [
        'opening_cash'    => 'float',
        'closing_cash'    => 'float',
        'total_sales'     => 'float',
        'cash_difference' => 'float',
        'opened_at'       => 'datetime',
        'closed_at'       => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
