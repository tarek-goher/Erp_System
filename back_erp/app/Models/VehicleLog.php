<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class VehicleLog extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'vehicle_id', 'type', 'date',
        'description', 'odometer', 'cost', 'driver',
    ];

    protected $casts = [
        'date'     => 'date',
        'odometer' => 'float',
        'cost'     => 'float',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
