<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Recruitment extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','title','department','requirements',
        'salary_range_min','salary_range_max','status',
        'open_date','close_date',
    ];
    protected $casts = [
        'salary_range_min'=>'decimal:2','salary_range_max'=>'decimal:2',
        'open_date'=>'date','close_date'=>'date',
    ];
}
