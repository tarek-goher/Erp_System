<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class StoreJournalEntryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'date'               => 'required|date',
            'reference'          => 'nullable|string|max:100',
            'description'        => 'nullable|string|max:500',
            'lines'              => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.debit'      => 'required|numeric|min:0',
            'lines.*.credit'     => 'required|numeric|min:0',
            'lines.*.description'=> 'nullable|string|max:200',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $lines = $this->input('lines', []);
            $totalDebit  = collect($lines)->sum('debit');
            $totalCredit = collect($lines)->sum('credit');

            if (abs($totalDebit - $totalCredit) > 0.01) {
                $validator->errors()->add('lines', 'القيد غير متوازن: مجموع المدين (' . $totalDebit . ') لا يساوي مجموع الدائن (' . $totalCredit . ').');
            }
        });
    }

    public function messages(): array
    {
        return [
            'lines.required'              => 'يجب إضافة سطرين على الأقل.',
            'lines.*.account_id.required' => 'الحساب مطلوب لكل سطر.',
        ];
    }
}
