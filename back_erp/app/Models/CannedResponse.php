<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class CannedResponse extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = ['company_id','title','content','tags'];
    protected $casts = ['tags'=>'array'];
}
