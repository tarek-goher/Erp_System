<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
         $id = $this->route('supplier')?->id ?? 'NULL';

        return [
            'name'           => 'required|string|max:150',
            'code'           => 'nullable|string|max:50',
            'type'           => 'nullable|in:company,individual',
            'status'         => 'nullable|in:active,suspended,blocked',
            'rating'         => 'nullable|integer|min:0|max:5',
            'email'          => 'nullable|email|max:150|unique:suppliers,email,' . $id,
            'phone'          => 'nullable|string|max:20',
            'country'        => 'nullable|string|max:100',
            'city'           => 'nullable|string|max:100',
            'street'         => 'nullable|string|max:255',
            'address'        => 'nullable|string|max:500',
            'contact_person' => 'nullable|string|max:150',
            'contact_phone'  => 'nullable|string|max:20',
            'payment_method' => 'nullable|in:cash,bank_transfer,deferred',
            'payment_terms'  => 'nullable|string|max:50',
            'bank_name'      => 'nullable|string|max:150',
            'bank_account'   => 'nullable|string|max:100',
            'tax_number'     => 'nullable|string|max:50',
            'products_notes' => 'nullable|string|max:2000',
            'notes'          => 'nullable|string|max:2000',
            'is_active'      => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم المورد مطلوب.',
            'type.in'       => 'النوع يجب أن يكون شركة أو فرد.',
            'status.in'     => 'الحالة غير صحيحة.',
        ];
    }
}