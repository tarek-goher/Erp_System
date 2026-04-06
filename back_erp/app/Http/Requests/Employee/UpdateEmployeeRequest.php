<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'       => 'sometimes|string|max:150',
            'department' => 'nullable|string|max:100',
            'role'       => 'nullable|string|max:100',
            'salary'     => 'sometimes|numeric|min:0',
            'phone'      => 'nullable|string|max:20',
            'email'      => 'nullable|email|max:150',
            'status'     => 'sometimes|in:active,inactive,on_leave',
            'hire_date'  => 'sometimes|date',
            'avatar'     => 'nullable|string|max:500',
        ];
    }
}
