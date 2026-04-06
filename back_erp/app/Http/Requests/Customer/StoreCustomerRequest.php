<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('customer')?->id;

        return [
            'name'          => 'required|string|max:150',
            'email'         => 'nullable|email|max:150|unique:customers,email,' . $id,
            'phone'         => 'nullable|string|max:20',
            'address'       => 'nullable|string|max:500',
            'city'          => 'nullable|string|max:100',
            'country'       => 'nullable|string|max:100',
            'tax_number'    => 'nullable|string|max:50',
            'credit_limit'  => 'nullable|numeric|min:0',
            'notes'         => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'اسم العميل مطلوب.',
            'email.unique'   => 'البريد الإلكتروني مستخدم بالفعل.',
        ];
    }
}
