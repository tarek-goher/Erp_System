<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class FleetMaintenance extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','vehicle_id','type','description',
        'cost','maintenance_date','next_maintenance_date','status',
    ];
    protected $casts = ['cost'=>'decimal:2','maintenance_date'=>'date','next_maintenance_date'=>'date'];
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
}
