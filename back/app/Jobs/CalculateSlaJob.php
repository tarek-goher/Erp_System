<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Models\SlaPolicy;
use App\Services\SlaCalculator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * ✅ حساب الـ SLA في الـ background (بدل sync في request)
 * هذا بيحسن الأداء في production
 */
class CalculateSlaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Ticket $ticket)
    {
        $this->onQueue('sla'); // استخدم queue منفصل للـ SLA
    }

    public function handle(): void
    {
        try {
            $slaPolicy = $this->ticket->slaPolicy;

            // احسب الـ SLA in the background
            $this->ticket->update([
                'first_response_due_at' => SlaCalculator::calculateDueDate(
                    $this->ticket->created_at,
                    $slaPolicy ? $slaPolicy->first_response_hours : 4,
                    $slaPolicy?->business_hours_only ?? true,
                    $this->ticket->company_id
                ),
                'resolution_due_at' => SlaCalculator::calculateDueDate(
                    $this->ticket->created_at,
                    $slaPolicy ? $slaPolicy->resolution_hours : 24,
                    $slaPolicy?->business_hours_only ?? true,
                    $this->ticket->company_id
                ),
            ]);

            \Log::info("SLA calculated for ticket {$this->ticket->id}");
        } catch (\Exception $e) {
            \Log::error("Failed to calculate SLA for ticket {$this->ticket->id}", [
                'error' => $e->getMessage(),
            ]);
            $this->release(60); // أعد المحاولة بعد 60 ثانية
        }
    }

    public function failed(\Exception $exception): void
    {
        \Log::error("CalculateSlaJob failed permanently for ticket {$this->ticket->id}", [
            'error' => $exception->getMessage(),
        ]);
    }
}
