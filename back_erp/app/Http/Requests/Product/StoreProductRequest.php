<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreProductRequest — Validation لإنشاء منتج
 */
class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'name'         => 'required|string|max:200',
            'sku'          => 'required|string|unique:products,sku,' . $productId,
            'barcode'      => 'nullable|string|unique:products,barcode,' . $productId,
            'category_id'  => 'required|exists:categories,id',
            'price'        => 'required|numeric|min:0',
            'cost'         => 'nullable|numeric|min:0',
            'qty'          => 'nullable|numeric|min:0',
            'min_qty'      => 'nullable|numeric|min:0',
            'unit'         => 'nullable|string|max:50',
            'description'  => 'nullable|string|max:2000',
            'tax_rate'     => 'nullable|numeric|min:0|max:100',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'is_active'    => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'اسم المنتج مطلوب.',
            'sku.required'         => 'كود المنتج (SKU) مطلوب.',
            'sku.unique'           => 'كود المنتج موجود بالفعل.',
            'category_id.required' => 'التصنيف مطلوب.',
            'price.required'       => 'سعر البيع مطلوب.',
        ];
    }
}
