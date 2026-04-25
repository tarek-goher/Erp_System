<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class PaymentTransaction extends Model {
    protected $fillable = ['company_id','provider','order_id','amount_cents','currency','status','reference','raw_response'];
}
