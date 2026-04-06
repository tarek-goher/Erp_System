<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectTaskRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'            => 'required|string|max:200',
            'description'      => 'nullable|string|max:2000',
            'assigned_to'      => 'nullable|exists:users,id',
            'priority'         => 'nullable|in:low,medium,high,urgent',
            'due_date'         => 'nullable|date',
            'estimated_hours'  => 'nullable|numeric|min:0',
            'status'           => 'nullable|in:todo,in_progress,review,done',
        ];
    }

    public function messages(): array
    {
        return ['title.required' => 'عنوان المهمة مطلوب.'];
    }
}
