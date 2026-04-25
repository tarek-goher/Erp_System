<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class MaintenanceRecord extends Model
{
    use BelongsToCompany;
    protected $fillable = ['company_id','vehicle_id','type','description','cost','date','next_date','odometer'];
    protected $casts = ['date' => 'date', 'next_date' => 'date', 'cost' => 'float', 'odometer' => 'float'];
    public function vehicle() { return $this->belongsTo(FleetVehicle::class, 'vehicle_id'); }
}
