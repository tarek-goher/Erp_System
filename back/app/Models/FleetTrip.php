<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class FleetTrip extends Model
{
    use BelongsToCompany;
    protected $fillable = ['company_id','vehicle_id','driver_id','trip_date','origin','destination','distance_km','purpose'];
    protected $casts = ['trip_date' => 'date', 'distance_km' => 'float'];
    public function vehicle() { return $this->belongsTo(FleetVehicle::class, 'vehicle_id'); }
    public function driver()  { return $this->belongsTo(Employee::class, 'driver_id'); }
}
