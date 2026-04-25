<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\EscalationService;
use Illuminate\Console\Command;

class CheckEscalations extends Command
{
    protected $signature   = 'helpdesk:check-escalations';
    protected $description = 'فحص تذاكر الدعم الفني وتطبيق قواعد التصعيد';

    public function handle(EscalationService $service): void
    {
        $tickets = Ticket::whereNotIn('status', ['resolved', 'closed'])
            ->get();

        $this->info("فحص {$tickets->count()} تذكرة...");

        $escalated = 0;
        foreach ($tickets as $ticket) {
            try {
                $service->checkAndEscalate($ticket);
                $escalated++;
            } catch (\Throwable $e) {
                $this->error("خطأ في التذكرة #{$ticket->id}: " . $e->getMessage());
            }
        }

        $this->info("تم فحص {$escalated} تذكرة بنجاح.");
    }
}