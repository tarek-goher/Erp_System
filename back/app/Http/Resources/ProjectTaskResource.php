<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'description'      => $this->description,
            'status'           => $this->status,
            'priority'         => $this->priority,
            'due_date'         => $this->due_date?->toDateString(),
            'estimated_hours'  => $this->estimated_hours,
            'completed_at'     => $this->completed_at?->toDateTimeString(),
            'assigned_to' => $this->whenLoaded('assignedTo', fn() => ['id' => $this->assignedTo?->id, 'name' => $this->assignedTo?->name]),
        ];
    }
}
