<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\SlaCalculator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RecalculateSlaCommand extends Command
{
    protected $signature = 'sla:recalculate {--company-id= : Recalculate for specific company} {--force : Skip confirmation}';
    protected $description = 'Recalculate SLA for all tickets (when company settings change)';

    public function handle(): int
    {
        $companyId = $this->option('company-id');
        
        if (!$this->option('force')) {
            if (!$this->confirm('هل أنت متأكد من إعادة حساب الـ SLA؟ هذا قد يأخذ وقتاً طويلاً')) {
                return 1;
            }
        }

        try {
            $query = Ticket::query()
                ->whereIn('status', ['open', 'assigned', 'in_progress', 'waiting_user']);

            if ($companyId) {
                $query->where('company_id', $companyId);
                $this->info("Recalculating SLA for company {$companyId}...");
            } else {
                $this->info("Recalculating SLA for all companies...");
            }

            $tickets = $query->get();
            $count = 0;
            $bar = $this->output->createProgressBar($tickets->count());

            foreach ($tickets as $ticket) {
                DB::transaction(function () use ($ticket) {
                    $slaPolicy = $ticket->slaPolicy;

                    // Recalculate due dates
                    $ticket->update([
                        'first_response_due_at' => SlaCalculator::calculateDueDate(
                            $ticket->created_at,
                            $slaPolicy ? $slaPolicy->first_response_hours : 4,
                            $slaPolicy?->business_hours_only ?? true,
                            $ticket->company_id
                        ),
                        'resolution_due_at' => SlaCalculator::calculateDueDate(
                            $ticket->created_at,
                            $slaPolicy ? $slaPolicy->resolution_hours : 24,
                            $slaPolicy?->business_hours_only ?? true,
                            $ticket->company_id
                        ),
                    ]);
                });

                $bar->advance();
                $count++;
            }

            $bar->finish();
            $this->newLine();
            $this->info("✅ Recalculated SLA for {$count} tickets");

            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            return 1;
        }
    }
}
