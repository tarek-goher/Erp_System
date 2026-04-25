<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'status'      => $this->status,
            'progress'    => (int) ($this->progress ?? 0),
            'start_date'  => $this->start_date?->toDateString(),
            'end_date'    => $this->end_date?->toDateString(),
            'budget'      => (float) ($this->budget ?? 0),
            'created_at'  => $this->created_at?->toDateTimeString(),

            'customer'   => $this->whenLoaded('customer', fn() => ['id' => $this->customer?->id, 'name' => $this->customer?->name]),
            'tasks'      => $this->whenLoaded('tasks', ProjectTaskResource::collection($this->tasks)),
            'tasks_count'=> $this->whenCounted('tasks'),
        ];
    }
}
