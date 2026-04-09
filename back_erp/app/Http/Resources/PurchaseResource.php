<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'order_number' => $this->po_number,        // ← Frontend بيدور على order_number
            'supplier'     => $this->whenLoaded('supplier', fn() => [
                'id'   => $this->supplier->id,
                'name' => $this->supplier->name,
            ]),
            'user'         => $this->whenLoaded('user', fn() => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'subtotal'     => (float) $this->subtotal,
            'tax_amount'   => (float) $this->tax,      // ← Frontend بيدور على tax_amount
            'total'        => (float) $this->total,
            'status'       => $this->status,
            'notes'        => $this->notes,
            'expected_date'=> $this->expected_at?->format('Y-m-d'), // ← Frontend بيدور على expected_date
            'created_at'   => $this->created_at,
            'items'        => $this->whenLoaded('items', function () {
                return $this->items->map(fn($item) => [
                    'id'         => $item->id,
                    'product_id' => $item->product_id,
                    'product'    => $item->product ? [
                        'id'   => $item->product->id,
                        'name' => $item->product->name,
                    ] : null,
                    'qty'        => $item->quantity,        // ← Frontend بيدور على qty
                    'cost'       => (float) $item->unit_price, // ← Frontend بيدور على cost
                    'total'      => (float) $item->total,
                ]);
            }),
        ];
    }
}