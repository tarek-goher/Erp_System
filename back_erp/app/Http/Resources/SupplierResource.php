<?php
// ══════════════════════════════════════════════════════
// app/Http/Resources/SupplierResource.php
// ══════════════════════════════════════════════════════

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'code'            => $this->code,
            'name'            => $this->name,
            'type'            => $this->type,
            'status'          => $this->status,
            'rating'          => $this->rating,

            // Contact
            'email'           => $this->email,
            'phone'           => $this->phone,
            'country'         => $this->country,
            'city'            => $this->city,
            'street'          => $this->street,
            'address'         => $this->address,
            'contact_person'  => $this->contact_person,
            'contact_phone'   => $this->contact_phone,

            // Payment
            'payment_method'  => $this->payment_method,
            'payment_terms'   => $this->payment_terms,
            'bank_name'       => $this->bank_name,
            'bank_account'    => $this->bank_account,

            // Extra
            'tax_number'      => $this->tax_number,
            'products_notes'  => $this->products_notes,
            'notes'           => $this->notes,
            'is_active'       => $this->is_active,

            // Stats
            'purchases_count' => $this->whenCounted('purchases'),

            'created_at'      => $this->created_at?->toDateTimeString(),
        ];
    }
}