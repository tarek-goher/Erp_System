<?php

namespace App\Http\Requests\Crm;

use Illuminate\Foundation\Http\FormRequest;

class StoreCrmLeadRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'    => 'required|string|max:150',
            'email'   => 'nullable|email|max:150',
            'phone'   => 'nullable|string|max:20',
            'company' => 'nullable|string|max:150',
            'source'  => 'nullable|in:website,referral,social_media,email,phone,manual,other',
            'score'   => 'nullable|integer|min:0|max:100',
            'notes'   => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return ['name.required' => 'اسم العميل المحتمل مطلوب.'];
    }
}
