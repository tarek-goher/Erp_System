<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class BankAccount extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        'bank_name',
        'account_number',
        'branch_code',
        'account_id',
        'currency',
        'opening_balance',
        'status',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
    ];

    // العلاقات
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function statements(): HasMany
    {
        return $this->hasMany(BankStatement::class);
    }

    public function reconciliations(): HasMany
    {
        return $this->hasMany(BankReconciliation::class);
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    // Methods
    public function getCurrentBalance(): float
    {
        // احصل على آخر موازنة معروفة
        $lastStatement = $this->statements()
            ->where('status', 'verified')
            ->latest('statement_date')
            ->first();

        return $lastStatement ? (float)$lastStatement->closing_balance : (float)$this->opening_balance;
    }

    public function getLastReconciliation()
    {
        return $this->reconciliations()
            ->where('status', 'posted')
            ->latest('reconciliation_date')
            ->first();
    }

    public function lastStatementDate()
    {
        $statement = $this->statements()
            ->whereIn('status', ['reconciled', 'verified'])
            ->latest('statement_date')
            ->first();

        return $statement?->statement_date;
    }
}
