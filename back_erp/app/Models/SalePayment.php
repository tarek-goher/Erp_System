<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * SalePayment — دفعات المبيعات الجزئية
 *
 * Bug Fix #3: كانت ناقصة BelongsToCompany trait.
 * بدونها لو وصلنا SalePayment مباشرة من غير الـ sale check،
 * مستخدم ممكن يشوف دفعات شركة تانية.
 * الـ trait بيضيف Global Scope تلقائي على company_id.
 */
class SalePayment extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'sale_id',
        'user_id',
        'amount',
        'payment_method',
        'reference',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function sale() { return $this->belongsTo(Sale::class); }
    public function user() { return $this->belongsTo(User::class); }
}
