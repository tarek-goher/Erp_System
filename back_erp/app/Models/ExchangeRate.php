<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    use BelongsToCompany;
    protected $fillable = ['company_id','from_currency_id','to_currency_id','rate','date'];
    protected $casts = ['rate' => 'float', 'date' => 'date'];
    public function fromCurrency() { return $this->belongsTo(Currency::class, 'from_currency_id'); }
    public function toCurrency()   { return $this->belongsTo(Currency::class, 'to_currency_id'); }
}
