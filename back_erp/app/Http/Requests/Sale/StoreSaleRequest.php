<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreSaleRequest — Validation لإنشاء فاتورة مبيعات
 */
class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    /**
     * تحويل unit_price → price قبل الـ validation
     * وتحويل transfer → bank_transfer
     */
    protected function prepareForValidation(): void
    {
        // ✅ حوّل unit_price → price في كل item
        if ($this->has('items')) {
            $items = collect($this->items)->map(function ($item) {
                if (isset($item['unit_price']) && !isset($item['price'])) {
                    $item['price'] = $item['unit_price'];
                }
                return $item;
            })->toArray();
            $this->merge(['items' => $items]);
        }

        // ✅ حوّل transfer → bank_transfer
        if ($this->payment_method === 'transfer') {
            $this->merge(['payment_method' => 'bank_transfer']);
        }
    }

    public function rules(): array
    {
        return [
            'customer_id'            => 'nullable|exists:customers,id',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:products,id',
            'items.*.qty'            => 'required|numeric|min:0.001',
            'items.*.price'          => 'required|numeric|min:0',
            'items.*.discount'       => 'nullable|numeric|min:0',
            'tax'                    => 'nullable|numeric|min:0',
            'tax_rate_id'            => 'nullable|exists:taxes,id',  // ✅ أضفنا tax_rate_id
            'discount'               => 'nullable|numeric|min:0',
            'payment_method'         => 'nullable|in:cash,card,bank_transfer,credit',
            'status'                 => 'nullable|in:completed,pending,draft,quotation,cancelled',  // ✅ أضفنا draft
            'notes'                  => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'              => 'يجب إضافة منتج واحد على الأقل.',
            'items.*.product_id.required' => 'يجب تحديد المنتج.',
            'items.*.product_id.exists'   => 'المنتج غير موجود.',
            'items.*.qty.required'        => 'يجب تحديد الكمية.',
            'items.*.qty.min'             => 'الكمية يجب أن تكون أكبر من صفر.',
            'items.*.price.required'      => 'يجب تحديد السعر.',
            'items.*.price.min'           => 'السعر يجب أن يكون 0 أو أكبر.',
        ];
    }
}