<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * CsatRating — تقييم رضا العميل
 *
 * الحقول:
 *   ticket_id  : التذكرة المقيَّمة
 *   company_id : الشركة
 *   rating     : 1–5
 *   comment    : تعليق اختياري
 *   token      : رابط التقييم الفريد (UUID)
 *   rated_at   : وقت التقييم الفعلي (null = لم يُقيَّم بعد)
 */
class CsatRating extends Model
{
    protected $fillable = [
        'ticket_id',
        'company_id',
        'rating',
        'comment',
        'token',
        'rated_at',
    ];

    protected $casts = [
        'rated_at' => 'datetime',
        'rating'   => 'integer',
    ];

    // ── Relations ────────────────────────────────────────────────

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    // ── Helpers ──────────────────────────────────────────────────

    public function isRated(): bool
    {
        return $this->rated_at !== null;
    }
}
