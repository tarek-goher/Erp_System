<?php

namespace App\Http\Requests\Manufacturing;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'product_id'   => 'required|exists:products,id',
            'qty'          => 'required|numeric|min:0.001',
            'scheduled_at' => 'nullable|date|after_or_equal:today',
            'notes'        => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'المنتج المراد تصنيعه مطلوب.',
            'qty.required'        => 'الكمية مطلوبة.',
        ];
    }
}
