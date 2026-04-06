<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreEmployeeRequest — Validation لإضافة موظف
 */
class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'       => 'required|string|max:150',
            'role'       => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'salary'     => 'required|numeric|min:0',
            'phone'      => 'nullable|string|max:20',
            'email'      => 'nullable|email|max:150',
            'hire_date'  => 'required|date',
            'status'     => 'nullable|in:active,inactive,on_leave',
            'user_id'    => 'nullable|exists:users,id',
            'avatar'     => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'اسم الموظف مطلوب.',
            'salary.required'    => 'الراتب الأساسي مطلوب.',
            'hire_date.required' => 'تاريخ التعيين مطلوب.',
            'salary.min'         => 'الراتب لا يمكن أن يكون سالباً.',
        ];
    }
}
