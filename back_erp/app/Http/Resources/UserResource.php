<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'avatar'         => $this->avatar,
            'company_id'     => $this->company_id,
            'is_super_admin' => (bool) $this->is_super_admin,
            'is_active'      => (bool) $this->is_active,
            'roles'          => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
            'permissions'    => $this->whenLoaded('permissions', fn() => $this->getAllPermissions()->pluck('name')),
            'company'        => $this->whenLoaded('company', fn() => $this->company ? [
                'id'     => $this->company->id,
                'name'   => $this->company->name,
                'plan'   => $this->company->subscription_plan,
                'active' => $this->company->status === 'active',
            ] : null),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
