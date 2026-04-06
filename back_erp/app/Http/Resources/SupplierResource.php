<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'phone'      => $this->phone,
            'address'    => $this->address,
            'country'    => $this->country,
            'tax_number' => $this->tax_number,
            'notes'      => $this->notes,
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
