<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'name_en'     => $this->name_en,
            'sku'         => $this->sku,
            'barcode'     => $this->barcode,
            'price'       => (float) $this->price,
            'cost'        => (float) $this->cost,
            'qty'         => (float) $this->qty,
            'min_qty'     => (float) $this->min_qty,
            'unit'        => $this->unit,
            'tax_rate'    => (float) $this->tax_rate,
            'description' => $this->description,
            'is_active'   => (bool) $this->is_active,
            'is_low_stock'=> $this->qty <= $this->min_qty,
            'stock_value' => round($this->qty * $this->cost, 2),
            'created_at'  => $this->created_at?->toDateTimeString(),

            'category' => $this->whenLoaded('category', fn() => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ]),
            'warehouse' => $this->whenLoaded('warehouse', fn() => [
                'id'   => $this->warehouse->id,
                'name' => $this->warehouse->name,
            ]),
            'locations' => $this->whenLoaded('locations', fn() =>
                $this->locations->map(fn($l) => [
                    'warehouse_id' => $l->warehouse_id,
                    'qty'          => (float) $l->qty,
                ])->values()
            ),
        ];
    }
}
