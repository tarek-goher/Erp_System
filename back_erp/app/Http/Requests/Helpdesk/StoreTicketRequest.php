<?php

namespace App\Http\Requests\Helpdesk;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'subject'     => 'required|string|max:200',
            'description' => 'required|string|max:5000',
            'customer_id' => 'nullable|exists:customers,id',
            'priority'    => 'nullable|in:low,medium,high,urgent',
            'channel'     => 'nullable|in:web,email,phone,whatsapp',
            'category'    => 'nullable|string|max:100',
            'assigned_to' => 'nullable|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required'     => 'عنوان التذكرة مطلوب.',
            'description.required' => 'وصف المشكلة مطلوب.',
        ];
    }
}
