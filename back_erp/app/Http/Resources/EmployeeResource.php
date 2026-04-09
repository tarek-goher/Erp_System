<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'role'       => $this->role,
            'department' => $this->department,
            'salary'     => (float) $this->salary,
            'phone'      => $this->phone,
            'email'      => $this->email,
            'hire_date'  => $this->hire_date?->toDateString(),
            'status'     => $this->status,
            'status_label'=> $this->getStatusLabel(),
            'avatar'     => $this->avatar,
            'created_at' => $this->created_at?->toDateTimeString(),

            'user' => $this->whenLoaded('user', fn() => [
                'id'    => $this->user?->id,
                'name'  => $this->user?->name,
                'email' => $this->user?->email,
            ]),
        ];
    }

private function getStatusLabel(): string
{
    return match ($this->status ?? 'inactive') {
        'active'   => 'نشط',
        'inactive' => 'غير نشط',
        'on_leave' => 'في إجازة',
        default    => $this->status ?? 'غير محدد',
    };
}
}
