<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('supplier')?->id;

        return [
            'name'       => 'required|string|max:150',
            'email'      => 'nullable|email|max:150|unique:suppliers,email,' . $id,
            'phone'      => 'nullable|string|max:20',
            'address'    => 'nullable|string|max:500',
            'country'    => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:50',
            'notes'      => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return ['name.required' => 'اسم المورد مطلوب.'];
    }
}
