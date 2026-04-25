<?php
namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

// ===== BankStatement =====
class BankStatement extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'bank_account_id',
        'statement_date',
        'opening_balance',
        'closing_balance',
        'transaction_count',
        'status',
        'notes',
    ];

    protected $casts = [
        'statement_date' => 'date',
        'opening_balance' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'transaction_count' => 'integer',
    ];

    // العلاقات
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(BankStatementDetail::class);
    }

    public function reconciliation()
    {
        return $this->hasOne(BankReconciliation::class);
    }

    // Scopes
    public function scopeReconciled(Builder $query): Builder
    {
        return $query->whereIn('status', ['reconciled', 'verified']);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->whereIn('status', ['draft', 'in_progress']);
    }

    // Methods
    public function getMatchedCount(): int
    {
        return $this->details()
            ->where('status', 'matched')
            ->count();
    }

    public function getUnmatchedCount(): int
    {
        return $this->details()
            ->where('status', 'unmatched')
            ->count();
    }

    public function getTotalDebits(): float
    {
        return (float)$this->details()
            ->whereNotNull('debit')
            ->sum('debit');
    }

    public function getTotalCredits(): float
    {
        return (float)$this->details()
            ->whereNotNull('credit')
            ->sum('credit');
    }

    public function getCalculatedBalance(): float
    {
        $debits = $this->getTotalDebits();
        $credits = $this->getTotalCredits();
        return (float)$this->opening_balance + $debits - $credits;
    }

    public function isBalanced(): bool
    {
        $calculated = $this->getCalculatedBalance();
        $difference = abs($calculated - (float)$this->closing_balance);
        return $difference < 0.01; // tolerance for rounding
    }
}

// ===== BankStatementDetail =====
class BankStatementDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'bank_statement_id',
        'transaction_date',
        'reference',
        'description',
        'debit',
        'credit',
        'balance',
        'matched_transaction_id',
        'status',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    protected $timestamps = true;

    // العلاقات
    public function statement(): BelongsTo
    {
        return $this->belongsTo(BankStatement::class);
    }

    public function matchedTransaction(): BelongsTo
    {
        return $this->belongsTo(PaymentTransaction::class, 'matched_transaction_id');
    }

    // Methods
    public function getAmount(): float
    {
        return (float)$this->debit ?? (float)$this->credit;
    }

    public function isMatched(): bool
    {
        return $this->status === 'matched' && $this->matched_transaction_id !== null;
    }

    public function matchWithTransaction($transactionId, $amount): bool
    {
        if (abs($this->getAmount() - (float)$amount) > 0.01) {
            return false;
        }

        $this->update([
            'matched_transaction_id' => $transactionId,
            'status' => 'matched',
        ]);

        return true;
    }

    public function unmatch(): void
    {
        $this->update([
            'matched_transaction_id' => null,
            'status' => 'unmatched',
        ]);
    }
}

// ===== BankReconciliation =====
class BankReconciliation extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'bank_account_id',
        'bank_statement_id',
        'reconciliation_date',
        'statement_balance',
        'calculated_balance',
        'difference',
        'matched_count',
        'unmatched_count',
        'status',
        'reconciled_by',
        'reconciled_at',
        'notes',
    ];

    protected $casts = [
        'reconciliation_date' => 'date',
        'statement_balance' => 'decimal:2',
        'calculated_balance' => 'decimal:2',
        'difference' => 'decimal:2',
        'reconciled_at' => 'datetime',
    ];

    // العلاقات
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function bankStatement(): BelongsTo
    {
        return $this->belongsTo(BankStatement::class);
    }

    public function reconciledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    // Methods
    public function isBalanced(): bool
    {
        return abs((float)$this->difference) < 0.01;
    }

    public function canBePosted(): bool
    {
        return $this->status === 'completed' && $this->isBalanced();
    }

    public function post(User $user): bool
    {
        if (!$this->canBePosted()) {
            return false;
        }

        $this->update([
            'status' => 'posted',
            'reconciled_by' => $user->id,
            'reconciled_at' => now(),
        ]);

        // تحديث حالة الكشف
        $this->bankStatement->update(['status' => 'verified']);

        return true;
    }
}
