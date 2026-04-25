<?php

namespace App\Models\Portal;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PortalOrder extends Model
{
    use BelongsToCompany;

    protected $table = 'portal_orders';

    protected $fillable = [
        'company_id', 'portal_user_id', 'sale_id', 'order_number',
        'total_amount', 'tax_amount', 'discount_amount', 'status',
        'payment_status', 'tracking_number', 'shipping_method',
        'shipped_at', 'delivered_at'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(PortalUser::class, 'portal_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PortalOrderItem::class, 'portal_order_id');
    }

    public function getStatusLabel(): string
    {
        $labels = [
            'pending' => 'قيد الانتظار',
            'confirmed' => 'مؤكد',
            'shipped' => 'مرسل',
            'delivered' => 'تم التوصيل',
            'cancelled' => 'ملغى'
        ];
        return $labels[$this->status] ?? $this->status;
    }
}
