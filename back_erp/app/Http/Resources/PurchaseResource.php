<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'status'     => $this->status,
            'subtotal'   => (float) $this->subtotal,
            'tax'        => (float) $this->tax,
            'discount'   => (float) $this->discount,
            'total'      => (float) $this->total,
            'notes'      => $this->notes,
            'created_at' => $this->created_at?->toDateTimeString(),

            'supplier' => $this->whenLoaded('supplier', fn() => ['id' => $this->supplier->id, 'name' => $this->supplier->name]),
            'user'     => $this->whenLoaded('user', fn() => ['id' => $this->user->id, 'name' => $this->user->name]),
            'items'    => $this->whenLoaded('items', fn() => $this->items->map(fn($i) => [
                'product_id' => $i->product_id,
                'qty'        => (float) $i->qty,
                'price'      => (float) $i->price,
                'total'      => (float) $i->total,
                'product'    => $i->relationLoaded('product') ? ['id' => $i->product?->id, 'name' => $i->product?->name] : null,
            ])),
        ];
    }
}
