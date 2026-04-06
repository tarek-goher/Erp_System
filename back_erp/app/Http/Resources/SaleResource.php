<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * SaleResource — تشكيل رد فاتورة المبيعات
 * يحذف الحقول الحساسة ويضيف حقول محسوبة
 */
class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'invoice_number' => $this->invoice_number,
            'status'         => $this->status,
            'status_label'   => $this->getStatusLabel(),
            'payment_method' => $this->payment_method,
            'subtotal'       => (float) $this->subtotal,
            'tax'            => (float) $this->tax,
            'discount'       => (float) $this->discount,
            'total'          => (float) $this->total,
            'notes'          => $this->notes,
            'created_at'     => $this->created_at?->toDateTimeString(),
            'updated_at'     => $this->updated_at?->toDateTimeString(),

            // العلاقات — موجودة بس لو اتحملت
            'customer' => $this->whenLoaded('customer', fn() => [
                'id'    => $this->customer->id,
                'name'  => $this->customer->name,
                'phone' => $this->customer->phone,
            ]),
            'user' => $this->whenLoaded('user', fn() => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'items' => $this->whenLoaded('items', SaleItemResource::collection($this->items)),
            'items_count' => $this->whenCounted('items'),
        ];
    }

    private function getStatusLabel(): string
    {
        return match ($this->status) {
            'completed' => 'مكتملة',
            'pending'   => 'معلقة',
            'quotation' => 'عرض سعر',
            'cancelled' => 'ملغاة',
            default     => $this->status,
        };
    }
}
