<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class ProjectTask extends Model {
    use HasFactory;
    protected $fillable = [
        'project_id','title','description','assigned_to',
        'status','priority','due_date','completed_at',
    ];
    protected $casts = ['due_date'=>'date','completed_at'=>'datetime'];
    public function project()    { return $this->belongsTo(Project::class); }
    public function assignedTo() { return $this->belongsTo(User::class,'assigned_to'); }
}
