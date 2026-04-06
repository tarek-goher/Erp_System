<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'supplier_id'            => 'required|exists:suppliers,id',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:products,id',
            'items.*.qty'            => 'required|numeric|min:0.001',
            'items.*.price'          => 'required|numeric|min:0',
            'tax'                    => 'nullable|numeric|min:0',
            'discount'               => 'nullable|numeric|min:0',
            'status'                 => 'nullable|in:ordered,received,cancelled',
            'notes'                  => 'nullable|string|max:1000',
            'expected_date'          => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'supplier_id.required' => 'المورد مطلوب.',
            'supplier_id.exists'   => 'المورد غير موجود.',
            'items.required'       => 'يجب إضافة منتج واحد على الأقل.',
        ];
    }
}
