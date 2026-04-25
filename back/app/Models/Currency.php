<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Currency extends Model {
    use HasFactory;
   protected $fillable = ['company_id','code','name','symbol','exchange_rate','is_default','is_active'];
    protected $casts = ['exchange_rate'=>'decimal:6','is_default'=>'boolean','is_active'=>'boolean'];
}
