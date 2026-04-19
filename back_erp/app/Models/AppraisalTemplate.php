<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppraisalTemplate extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id', 'name', 'name_ar', 'criteria'
    ];
    protected $casts = ['criteria' => 'json'];
    public function appraisals() { 
        return $this->hasMany(Appraisal::class); 
    }
}