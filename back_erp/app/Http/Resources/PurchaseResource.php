    <?php

    namespace App\Http\Resources;

    use Illuminate\Http\Request;
    use Illuminate\Http\Resources\Json\JsonResource;

    class PurchaseResource extends JsonResource
    {
        public function toArray(Request $request): array
        {
            return [
                'id'            => $this->id,
                'order_number'  => $this->po_number,        // ✅ Frontend بيطلب order_number
                'status'        => $this->status,
                'subtotal'      => (float) $this->subtotal,
                'tax_amount'    => (float) $this->tax,       // ✅ Frontend بيطلب tax_amount
                'discount'      => (float) ($this->discount ?? 0),
                'total'         => (float) $this->total,
                'notes'         => $this->notes,
                'expected_date' => $this->expected_at?->toDateString(), // ✅ Frontend بيطلب expected_date
                'created_at'    => $this->created_at?->toDateTimeString(),

                'supplier' => $this->whenLoaded('supplier', fn() => [
                    'id'   => $this->supplier->id,
                    'name' => $this->supplier->name,
                ]),

                'user' => $this->whenLoaded('user', fn() => [
                    'id'   => $this->user->id,
                    'name' => $this->user->name,
                ]),

                'items' => $this->whenLoaded('items', fn() => $this->items->map(fn($i) => [
                    'id'         => $i->id,
                    'product_id' => $i->product_id,
                    'qty'        => (float) $i->quantity,    // ✅ Frontend بيطلب qty
                    'cost'       => (float) $i->unit_price,  // ✅ Frontend بيطلب cost
                    'total'      => (float) $i->total,
                    'product'    => $i->relationLoaded('product')
                        ? ['id' => $i->product?->id, 'name' => $i->product?->name]
                        : null,
                ])),
            ];
        }
    }