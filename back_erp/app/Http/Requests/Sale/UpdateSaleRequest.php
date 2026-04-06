<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateSaleRequest — Validation لتعديل فاتورة مبيعات
 *
 * بتسمح بتعديل الـ metadata فقط:
 * - status, payment_method, notes, discount
 * لو محتاج تعدل الـ items → امسح الفاتورة وأنشئ واحدة جديدة.
 */
class UpdateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'         => 'sometimes|required|in:completed,pending,quotation,cancelled',
            'payment_method' => 'sometimes|required|in:cash,card,bank_transfer,credit',
            'notes'          => 'nullable|string|max:1000',
            'discount'       => 'nullable|numeric|min:0',
            'customer_id'    => 'nullable|exists:customers,id',
        ];
    }

    public function messages(): array
    {
        return [
            'status.in'         => 'الحالة المختارة غير صالحة.',
            'payment_method.in' => 'طريقة الدفع المختارة غير صالحة.',
            'discount.min'      => 'الخصم يجب أن يكون أكبر من أو يساوي صفر.',
        ];
    }
}
