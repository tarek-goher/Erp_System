<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasFactory, BelongsToCompany;
    protected $fillable = [
        'company_id', 'ref', 'date', 'description',
        'status', 'type', 'user_id', 'reference_type', 'reference_id',
    ];
    protected $casts = ['date' => 'date'];
    public function lines() { return $this->hasMany(JournalEntryLine::class); }
    public function user()  { return $this->belongsTo(User::class); }
    public function isBalanced(): bool
    {
        $totals = $this->lines()->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')->first();
        return round($totals->total_debit, 2) === round($totals->total_credit, 2);
    }
    public function post(): bool
    {
        if (!$this->isBalanced()) return false;
        $this->update(['status' => 'posted']);
        foreach ($this->lines as $line) {
            $account = $line->account;
            if ($account->normal_balance === 'debit') {
                $account->increment('balance', $line->debit - $line->credit);
            } else {
                $account->increment('balance', $line->credit - $line->debit);
            }
        }
        return true;
    }
    public static function generateRef(): string
    {
        $last = static::latest('id')->first();
        $number = $last ? ($last->id + 1) : 1;
        return 'JE-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
