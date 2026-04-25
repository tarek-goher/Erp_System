<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * TicketResource — MERGED
 * أضاف: ticket_number, requester, service, tags, attachments, logs, sla fields
 * حدّث: getStatusLabel لدعم assigned / waiting_user
 */
class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'ticket_number'         => $this->ticket_number,
            'subject'               => $this->subject,
            'description'           => $this->description,
            'status'                => $this->status,
            'status_label'          => $this->getStatusLabel(),
            'priority'              => $this->priority,
            'priority_label'        => $this->getPriorityLabel(),
            'category'              => $this->category,
            'form_data'             => $this->form_data,
            'resolution'            => $this->resolution,
            // SLA
            'sla_due_at'            => $this->sla_due_at?->toDateTimeString(),
            'first_response_due_at' => $this->first_response_due_at?->toDateTimeString(),
            'resolution_due_at'     => $this->resolution_due_at?->toDateTimeString(),
            'first_response_at'     => $this->first_response_at?->toDateTimeString(),
            'sla_breached'          => $this->sla_breached,
            'is_overdue'            => $this->isOverdue(),
            'is_response_overdue'   => $this->isResponseOverdue(),
            // Dates
            'resolved_at'           => $this->resolved_at?->toDateTimeString(),
            'created_at'            => $this->created_at?->toDateTimeString(),
            // Relations
            'customer'    => $this->whenLoaded('customer',    fn() => ['id' => $this->customer?->id,    'name' => $this->customer?->name]),
            'assigned_to' => $this->whenLoaded('assignedTo',  fn() => ['id' => $this->assignedTo?->id,  'name' => $this->assignedTo?->name]),
            'requester'   => $this->whenLoaded('requester',   fn() => ['id' => $this->requester?->id,   'name' => $this->requester?->name]),
            'service'     => $this->whenLoaded('service',     fn() => ['id' => $this->service?->id,     'name' => $this->service?->name]),
            'tags'        => $this->whenLoaded('tags',        fn() => $this->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'color' => $t->color])),
            'messages'    => $this->whenLoaded('messages',    TicketMessageResource::collection($this->messages)),
            'attachments' => $this->whenLoaded('attachments', fn() => $this->attachments),
            'logs'        => $this->whenLoaded('logs',        fn() => $this->logs),
        ];
    }

    private function getStatusLabel(): string
    {
        return match ($this->status) {
            'open'         => 'مفتوحة',
            'assigned'     => 'معينة',
            'in_progress'  => 'جارية',
            'waiting_user' => 'في انتظار المستخدم',
            'resolved'     => 'محلولة',
            'closed'       => 'مغلقة',
            default        => $this->status,
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
