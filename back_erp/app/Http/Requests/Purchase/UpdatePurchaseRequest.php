<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        if ($this->has('items')) {
            $items = collect($this->items)->map(function ($item) {
                if (isset($item['cost']) && !isset($item['unit_price'])) {
                    $item['unit_price'] = $item['cost'];
                }
                if (isset($item['qty']) && !isset($item['quantity'])) {
                    $item['quantity'] = $item['qty'];
                }
                return $item;
            })->toArray();
            $this->merge(['items' => $items]);
        }

        if ($this->expected_date && !$this->expected_at) {
            $this->merge(['expected_at' => $this->expected_date]);
        }
    }

    public function rules(): array
    {
        return [
            'supplier_id'        => 'required|exists:suppliers,id',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|min:1|exists:products,id', // ✅
            'items.*.quantity'   => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'tax'                => 'nullable|numeric|min:0',
            'tax_rate_id'        => 'nullable|exists:tax_rates,id',
            'status'             => 'nullable|in:draft,pending,approved,ordered,received,cancelled',
            'notes'              => 'nullable|string|max:1000',
            'expected_date'      => 'nullable|date',
            'expected_at'        => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'supplier_id.required'        => 'المورد مطلوب.',
            'supplier_id.exists'          => 'المورد غير موجود.',
            'items.required'              => 'يجب إضافة منتج واحد على الأقل.',
            'items.*.product_id.required' => 'يجب اختيار منتج لكل صنف.',
            'items.*.product_id.min'      => 'يجب اختيار منتج صحيح.',
            'items.*.product_id.exists'   => 'المنتج غير موجود.',
        ];
    }
}