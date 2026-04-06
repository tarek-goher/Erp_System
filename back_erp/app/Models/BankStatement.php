<?php
namespace App\Models;
use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
class BankStatement extends Model {
    use BelongsToCompany;
    protected $fillable = ['company_id','account_id','transaction_date','description','debit','credit','balance','reference','is_reconciled','journal_entry_id'];
    protected $casts = ['transaction_date'=>'date','is_reconciled'=>'boolean','debit'=>'float','credit'=>'float','balance'=>'float'];
    public function account()      { return $this->belongsTo(Account::class); }
    public function journalEntry() { return $this->belongsTo(JournalEntry::class); }
}
