<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * SaleResource — تشكيل رد فاتورة المبيعات
 * ✅ مضاف: paid_amount / remaining_amount / payment_status / due_date
 */
class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // حساب المدفوع والمتبقي
        $paidAmount      = $this->relationLoaded('payments')
            ? $this->payments->sum('amount')
            : $this->payments()->withoutGlobalScopes()->sum('amount');
        $remainingAmount = max(0, $this->total - $paidAmount);
        $paymentStatus   = $paidAmount <= 0
            ? 'unpaid'
            : ($remainingAmount <= 0 ? 'paid' : 'partial');

        return [
            'id'               => $this->id,
            'invoice_number'   => $this->invoice_number,
            'status'           => $this->status,
            'status_label'     => $this->getStatusLabel(),
            'payment_method'   => $this->payment_method,

            // ✅ حقول الدفع الجديدة
            'payment_status'   => $paymentStatus,
            'paid_amount'      => (float) $paidAmount,
            'remaining_amount' => (float) $remainingAmount,

            'subtotal'         => (float) $this->subtotal,
            'tax'              => (float) $this->tax,
            'discount'         => (float) $this->discount,
            'total'            => (float) $this->total,
            'notes'            => $this->notes,

            // ✅ تاريخ الاستحقاق
            'due_date'         => $this->due_date?->toDateString(),

            'created_at'       => $this->created_at?->toDateTimeString(),
            'updated_at'       => $this->updated_at?->toDateTimeString(),

            // العلاقات
            'customer' => $this->whenLoaded('customer', fn() => [
                'id'    => $this->customer->id,
                'name'  => $this->customer->name,
                'email' => $this->customer->email,
                'phone' => $this->customer->phone,
            ]),
            'user' => $this->whenLoaded('user', fn() => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'items'       => $this->whenLoaded('items', SaleItemResource::collection($this->items)),
            'items_count' => $this->whenCounted('items'),
            'tax_rate'    => $this->whenLoaded('taxRate', fn() => [
                'name' => $this->taxRate->name,
                'rate' => $this->taxRate->rate,
            ]),
        ];
    }

    private function getStatusLabel(): string
    {
        return match ($this->status) {
            'completed' => 'مكتملة',
            'confirmed' => 'مؤكدة',
            'pending'   => 'معلقة',
            'quotation' => 'عرض سعر',
            'cancelled' => 'ملغاة',
            'refunded'  => 'مستردة',
            default     => $this->status,
        };
    }
}