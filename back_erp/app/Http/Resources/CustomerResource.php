<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'email'        => $this->email,
            'phone'        => $this->phone,
            'address'      => $this->address,
            'city'         => $this->city,
            'country'      => $this->country,
            'tax_number'   => $this->tax_number,
            'credit_limit' => (float) ($this->credit_limit ?? 0),
            'notes'        => $this->notes,
            'created_at'   => $this->created_at?->toDateTimeString(),

            // حقول محسوبة — موجودة لو استُعلم عنها
            'total_sales'  => $this->whenCounted('sales', $this->sales_count ?? null),
            'total_value'  => $this->when(isset($this->total_sales), (float) $this->total_sales),
        ];
    }
}
