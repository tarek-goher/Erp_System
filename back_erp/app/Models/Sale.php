<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Sale extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id', 'customer_id', 'user_id',
        'subtotal', 'tax', 'discount', 'total',
        'status', 'payment_method', 'notes',
        'invoice_number',
    ];

    protected $casts = [
        'subtotal'  => 'decimal:2',
        'tax'       => 'decimal:2',
        'discount'  => 'decimal:2',
        'total'     => 'decimal:2',
    ];

    // ── Relationships ────────────────────────────────
    public function customer() { return $this->belongsTo(Customer::class); }
    public function user()     { return $this->belongsTo(User::class); }
    public function items()    { return $this->hasMany(SaleItem::class); }

    // ── Scopes ───────────────────────────────────────
    public function scopeCompleted($q)  { return $q->where('status', 'completed'); }
    public function scopeQuotations($q) { return $q->where('status', 'quotation'); }

    // ── Boot ─────────────────────────────────────────
    protected static function booted(): void
    {
        static::creating(function (Sale $sale) {
            if (!empty($sale->invoice_number)) {
                return;
            }

            /*
             * Bug Fix: كان في race condition — لو اتنين requests جو في نفس الوقت
             * هيلاقوا نفس الـ count ويعملوا نفس الـ invoice_number.
             *
             * الحل:
             * 1. إضافة company_id في الـ filter عشان كل شركة عندها تسلسل خاص بيها.
             * 2. استخدام lockForUpdate() عشان نقفل الصفوف داخل الـ transaction
             *    ونمنع أي request تاني يقرأ نفس الـ count في نفس الوقت.
             * 3. withoutGlobalScopes() عشان الـ BelongsToCompany scope ميتدخلش
             *    ونتحكم في الفلترة بشكل صريح.
             *
             * ملاحظة: لازم يتستدعى من جوه DB::transaction() (موجودة في SaleService).
             */
            $count = Sale::withoutGlobalScopes()
                ->withTrashed()
                ->where('company_id', $sale->company_id)
                ->whereDate('created_at', today())
                ->lockForUpdate()
                ->count();

            $sale->invoice_number = 'INV-'
                . now()->format('Ymd')
                . '-'
                . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
        });
    }
}
