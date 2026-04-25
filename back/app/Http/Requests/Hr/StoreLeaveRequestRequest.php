<?php

namespace App\Http\Requests\Hr;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'type'        => 'required|in:annual,sick,emergency,unpaid,maternity,paternity',
            'start_date'  => 'required|date|after_or_equal:today',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'reason'      => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'type.in'                => 'نوع الإجازة غير صحيح.',
            'start_date.after_or_equal' => 'تاريخ البداية يجب أن يكون اليوم أو بعده.',
            'end_date.after_or_equal'   => 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية.',
        ];
    }
}
