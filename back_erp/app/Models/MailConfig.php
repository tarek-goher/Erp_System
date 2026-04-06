<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class MailConfig extends Model
{
    use BelongsToCompany;
    protected $fillable = ['company_id','host','port','username','password','encryption','from_email','from_name'];
    protected $hidden = ['password'];
    protected $casts = ['port' => 'integer'];
}
