<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id', 'make', 'model', 'year', 'license_plate',
        'color', 'vin', 'status', 'mileage', 'driver_id',
        'last_maintenance_at', 'next_maintenance_at',
    ];

    protected $casts = [
        'last_maintenance_at' => 'datetime',
        'next_maintenance_at' => 'datetime',
    ];

    public function driver()       { return $this->belongsTo(Employee::class, 'driver_id'); }
    public function maintenances() { return $this->hasMany(FleetMaintenance::class); }
    public function fuelLogs()     { return $this->hasMany(FuelLog::class); }
}
