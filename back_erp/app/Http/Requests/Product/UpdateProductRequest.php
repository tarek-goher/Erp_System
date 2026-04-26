<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $cost = $this->input('cost', $this->input('purchase_price'));
        $price = $this->input('price', $this->input('sell_price', $this->input('retail_price')));

        $this->merge(array_filter([
            'cost' => $cost,
            'purchase_price' => $this->input('purchase_price', $cost),
            'price' => $price,
        ], fn ($value) => $value !== null));
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'name'        => 'sometimes|string|max:200',
            'sku'         => 'sometimes|string|unique:products,sku,' . $productId,
            'barcode'     => 'nullable|string|unique:products,barcode,' . $productId,
            'price'       => 'sometimes|numeric|min:0',
            'cost'        => 'nullable|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'sell_price'  => 'nullable|numeric|min:0',
            'retail_price'=> 'nullable|numeric|min:0',
            'qty'         => 'nullable|numeric|min:0',
            'min_qty'     => 'nullable|numeric|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'tax_rate'    => 'nullable|numeric|min:0|max:100',
            'warehouse_id'=> 'nullable|exists:warehouses,id',
            'unit'        => 'nullable|string|max:50',
            'is_active'   => 'sometimes|boolean',
            'description' => 'nullable|string|max:2000',
        ];
    }
}
