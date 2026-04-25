<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class FuelLog extends Model {
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id','vehicle_id','driver_id','liters',
        'cost_per_liter','total_cost','mileage','fill_date',
    ];
    protected $casts = ['liters'=>'decimal:3','cost_per_liter'=>'decimal:2','total_cost'=>'decimal:2','fill_date'=>'date'];
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function driver()  { return $this->belongsTo(Employee::class,'driver_id'); }
}
