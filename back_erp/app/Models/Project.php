<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Project extends Model {
    use HasFactory, SoftDeletes, BelongsToCompany;
    protected $fillable = [
        'company_id','name','description','client_id','manager_id',
        'status','priority','start_date','end_date','budget','spent',
    ];
    protected $casts = [
        'start_date'=>'date','end_date'=>'date',
        'budget'=>'decimal:2','spent'=>'decimal:2',
    ];
    public function manager()  { return $this->belongsTo(User::class,'manager_id'); }
    public function client()   { return $this->belongsTo(Customer::class,'client_id'); }
    public function tasks()    { return $this->hasMany(ProjectTask::class); }
    public function members()  { return $this->belongsToMany(User::class,'project_members'); }
}
