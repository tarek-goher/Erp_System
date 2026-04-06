<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'month'        => $this->month,
            'year'         => $this->year,
            'month_label'  => now()->setMonth($this->month)->format('F') . ' ' . $this->year,
            'basic_salary' => (float) $this->basic_salary,
            'allowances'   => (float) $this->allowances,
            'deductions'   => (float) $this->deductions,
            'net_salary'   => (float) $this->net_salary,
            'status'       => $this->status,
            'status_label' => $this->status === 'paid' ? 'مصروف' : 'معلق',
            'paid_at'      => $this->paid_at?->toDateTimeString(),
            'notes'        => $this->notes,
            'created_at'   => $this->created_at?->toDateTimeString(),

            'employee' => $this->whenLoaded('employee', fn() => [
                'id'         => $this->employee->id,
                'name'       => $this->employee->name,
                'department' => $this->employee->department,
            ]),
        ];
    }
}
