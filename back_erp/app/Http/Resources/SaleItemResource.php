<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'product_id' => $this->product_id,
            'qty'        => (float) $this->qty,
            'price'      => (float) $this->price,
            'discount'   => (float) $this->discount,
            'total'      => (float) $this->total,
            'product' => $this->whenLoaded('product', fn() => [
                'id'   => $this->product->id,
                'name' => $this->product->name,
                'sku'  => $this->product->sku,
                'unit' => $this->product->unit,
            ]),
        ];
    }
}
