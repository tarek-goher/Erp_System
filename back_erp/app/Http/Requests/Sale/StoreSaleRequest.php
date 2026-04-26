<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreSaleRequest — Validation لإنشاء فاتورة مبيعات
 *
 * التصليحات:
 *  - Fix #1: أضفنا due_date للـ validation
 *  - Fix #2: أضفنا items.*.warehouse_id للـ validation
 *  - Fix #3: discount الآن نسبة مئوية (0-100) مش قيمة مطلقة
 */
class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    /**
     * تحويل unit_price → price قبل الـ validation
     * وتحويل transfer → bank_transfer
     */
    protected function prepareForValidation(): void
    {
        // ✅ حوّل unit_price → price في كل item
        if ($this->has('items')) {
            $items = collect($this->items)->map(function ($item) {
                if (isset($item['unit_price']) && !isset($item['price'])) {
                    $item['price'] = $item['unit_price'];
                }
                return $item;
            })->toArray();
            $this->merge(['items' => $items]);
        }

        // ✅ حوّل transfer → bank_transfer
        if ($this->payment_method === 'transfer') {
            $this->merge(['payment_method' => 'bank_transfer']);
        }
    }

    public function rules(): array
    {
        return [
            'customer_id'                => 'nullable|exists:customers,id',

            // الأصناف
            'items'                      => 'required|array|min:1',
            'items.*.product_id'         => 'required|exists:products,id',
            'items.*.qty'                => 'required|numeric|min:0.001',
            'items.*.price'              => 'required|numeric|min:0',
            // Fix #2: warehouse_id
            'items.*.warehouse_id'       => 'nullable|exists:warehouses,id',
            // Fix #3: discount نسبة مئوية 0-100
            'items.*.discount'           => 'nullable|numeric|min:0|max:100',

            // الضريبة
            'tax'                        => 'nullable|numeric|min:0',
            'tax_rate_id'                => 'nullable|exists:tax_rates,id',

            // خصم على مستوى الفاتورة (نسبة مئوية 0-100)
            // Fix #3: max:100 عشان نسبة مئوية
            'discount'                   => 'nullable|numeric|min:0|max:100',

            // بيانات الفاتورة
            'payment_method'             => 'nullable|in:cash,card,bank_transfer,credit',
            'status'                     => 'nullable|in:completed,pending,draft,quotation,cancelled',
            'notes'                      => 'nullable|string|max:1000',

            // Fix #1: due_date
            'due_date'                   => 'nullable|date|after_or_equal:today',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'                  => 'يجب إضافة منتج واحد على الأقل.',
            'items.*.product_id.required'     => 'يجب تحديد المنتج.',
            'items.*.product_id.exists'       => 'المنتج غير موجود.',
            'items.*.qty.required'            => 'يجب تحديد الكمية.',
            'items.*.qty.min'                 => 'الكمية يجب أن تكون أكبر من صفر.',
            'items.*.price.required'          => 'يجب تحديد السعر.',
            'items.*.price.min'               => 'السعر يجب أن يكون 0 أو أكبر.',
            'items.*.warehouse_id.exists'     => 'المستودع غير موجود.',
            'items.*.discount.max'            => 'الخصم يجب أن يكون بين 0 و 100%.',
            'discount.max'                    => 'خصم الفاتورة يجب أن يكون بين 0 و 100%.',
            'due_date.after_or_equal'         => 'تاريخ الاستحقاق يجب أن يكون اليوم أو بعده.',
            'tax_rate_id.exists'              => 'معدل الضريبة غير موجود.',
        ];
    }
}
