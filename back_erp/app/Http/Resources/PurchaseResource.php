<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'order_number'  => $this->po_number,
            'po_number'     => $this->po_number,
            'supplier'      => $this->whenLoaded('supplier', fn() => [
                'id'    => $this->supplier->id,
                'name'  => $this->supplier->name,
                'phone' => $this->supplier->phone ?? null,
                'email' => $this->supplier->email ?? null,
            ]),
            'user'          => $this->whenLoaded('user', fn() => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'subtotal'      => (float) $this->subtotal,
            'discount'      => (float) $this->discount,  // ✅ ناقص
            'tax'           => (float) $this->tax,
            'tax_amount'    => (float) $this->tax,
            'total'         => (float) $this->total,
            'status'        => $this->status,
            'notes'         => $this->notes,
            'expected_at'   => $this->expected_at?->format('Y-m-d'),
            'expected_date' => $this->expected_at?->format('Y-m-d'),
            'created_at'    => $this->created_at?->toDateTimeString(),
            'items'         => $this->whenLoaded('items', function () {
                return $this->items->map(fn($item) => [
                    'id'          => $item->id,
                    'product_id'  => $item->product_id,
                    'product'     => $item->product ? [
                        'id'   => $item->product->id,
                        'name' => $item->product->name,
                    ] : null,
                    'warehouse_id' => $item->warehouse_id,           // ✅ ناقص
                    'warehouse'    => $item->warehouse ? [            // ✅ ناقص
                        'id'   => $item->warehouse->id,
                        'name' => $item->warehouse->name,
                    ] : null,
                    'qty'          => (float) $item->quantity,
                    'cost'         => (float) $item->unit_price,
                    'discount'     => (float) $item->discount,       // ✅ ناقص
                    'total'        => (float) $item->total,
                ]);
            }),
        ];
    }
}