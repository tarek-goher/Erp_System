<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'name'        => 'sometimes|string|max:200',
            'sku'         => 'sometimes|string|unique:products,sku,' . $productId,
            'price'       => 'sometimes|numeric|min:0',
            'cost'        => 'nullable|numeric|min:0',
            'qty'         => 'nullable|numeric|min:0',
            'min_qty'     => 'nullable|numeric|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'tax_rate'    => 'nullable|numeric|min:0|max:100',
            'is_active'   => 'sometimes|boolean',
            'description' => 'nullable|string|max:2000',
        ];
    }
}
