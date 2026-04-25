<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id','code','name','name_en','type','normal_balance',
        'balance','parent_id','is_active','tax_type',
    ];

    protected $casts = [
        'balance'   => 'float',
        'is_active' => 'boolean',
    ];

    public function parent()      { return $this->belongsTo(Account::class, 'parent_id'); }
    public function children()    { return $this->hasMany(Account::class, 'parent_id'); }
    public function journalLines(){ return $this->hasMany(JournalEntryLine::class); }
}
