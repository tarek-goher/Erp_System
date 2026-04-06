<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:200',
            'description' => 'nullable|string|max:2000',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'budget'      => 'nullable|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'status'      => 'nullable|in:active,on_hold,completed,cancelled',
        ];
    }

    public function messages(): array
    {
        return ['name.required' => 'اسم المشروع مطلوب.'];
    }
}
