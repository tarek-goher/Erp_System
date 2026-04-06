<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'subject'          => $this->subject,
            'description'      => $this->description,
            'status'           => $this->status,
            'status_label'     => $this->getStatusLabel(),
            'priority'         => $this->priority,
            'priority_label'   => $this->getPriorityLabel(),
            'channel'          => $this->channel,
            'category'         => $this->category,
            'resolution'       => $this->resolution,
            'first_response_at'=> $this->first_response_at?->toDateTimeString(),
            'resolved_at'      => $this->resolved_at?->toDateTimeString(),
            'sla_deadline'     => $this->sla_deadline?->toDateTimeString(),
            'is_overdue'       => $this->sla_deadline && $this->sla_deadline->isPast() && !in_array($this->status, ['resolved', 'closed']),
            'created_at'       => $this->created_at?->toDateTimeString(),

            'customer'    => $this->whenLoaded('customer', fn() => ['id' => $this->customer?->id, 'name' => $this->customer?->name]),
            'assigned_to' => $this->whenLoaded('assignedTo', fn() => ['id' => $this->assignedTo?->id, 'name' => $this->assignedTo?->name]),
            'messages'    => $this->whenLoaded('messages', TicketMessageResource::collection($this->messages)),
        ];
    }

    private function getStatusLabel(): string
    {
        return match ($this->status) {
            'open'        => 'مفتوحة',
            'in_progress' => 'جارية',
            'resolved'    => 'محلولة',
            'closed'      => 'مغلقة',
            default       => $this->status,
        };
    }

    private function getPriorityLabel(): string
    {
        return match ($this->priority) {
            'low'    => 'منخفضة',
            'medium' => 'متوسطة',
            'high'   => 'عالية',
            'urgent' => 'عاجلة',
            default  => $this->priority,
        };
    }
}
