<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    /**
     * Bug جديد: كان $fillable ناقص po_number و expected_at
     * PurchaseService كان بيحاول يحفظهم لكنهم كانوا بيتجاهلوا بصمت
     * النتيجة: رقم PO كان مش بيتحفظ أبداً في قاعدة البيانات
     */
    protected $fillable = [
        'company_id', 'supplier_id', 'user_id',
        'subtotal', 'tax', 'discount', 'total',
        'status', 'notes', 'reference',
        // Fix: إضافة الحقول الناقصة
        'po_number',
        'expected_at',
    ];

    protected $casts = [
        'subtotal'    => 'decimal:2',
        'tax'         => 'decimal:2',
        'discount'    => 'decimal:2',
        'total'       => 'decimal:2',
        'expected_at' => 'date',
    ];

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function user()     { return $this->belongsTo(User::class); }
    public function items()    { return $this->hasMany(PurchaseItem::class); }
    public function invoice()  { return $this->hasOne(PurchaseInvoice::class); }
}
