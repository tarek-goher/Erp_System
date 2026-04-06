<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreSaleRequest — Validation لإنشاء فاتورة مبيعات
 */
class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

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
            'discount'               => 'nullable|numeric|min:0',
            'payment_method'         => 'nullable|in:cash,card,bank_transfer,credit',
            'status'                 => 'nullable|in:completed,pending,quotation,cancelled',
            'notes'                  => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'             => 'يجب إضافة منتج واحد على الأقل.',
            'items.*.product_id.required'=> 'يجب تحديد المنتج.',
            'items.*.product_id.exists'  => 'المنتج غير موجود.',
            'items.*.qty.required'       => 'يجب تحديد الكمية.',
            'items.*.qty.min'            => 'الكمية يجب أن تكون أكبر من صفر.',
            'items.*.price.required'     => 'يجب تحديد السعر.',
        ];
    }
}
