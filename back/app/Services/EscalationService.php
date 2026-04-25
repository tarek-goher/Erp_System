<?php

namespace App\Services;

use App\Models\EscalationRule;
use App\Models\ErpNotification;
use App\Models\Ticket;
use App\Models\TicketLog;
use App\Models\User;

/**
 * EscalationService — تصعيد التذاكر تلقائياً
 *
 * ضعه في: app/Services/EscalationService.php
 *
 * يُشغَّل من: php artisan helpdesk:check-escalations
 * أو في Kernel.php: ->everyFifteenMinutes()
 */
class EscalationService
{
    /**
     * فحص تذكرة واحدة وتطبيق قواعد التصعيد عليها
     */
    public function checkAndEscalate(Ticket $ticket): void
    {
        $rules = EscalationRule::where('company_id', $ticket->company_id)
            ->where('is_active', true)
            ->get();

        foreach ($rules as $rule) {
            if ($this->shouldTrigger($ticket, $rule)) {
                $this->executeAction($ticket, $rule);
            }
        }
    }

    /**
     * هل يجب تفعيل القاعدة على هذه التذكرة؟
     */
    private function shouldTrigger(Ticket $ticket, EscalationRule $rule): bool
    {
        return match ($rule->trigger) {
            'sla_response_breach' =>
                $ticket->first_response_due_at
                && $ticket->first_response_due_at->addHours($rule->after_hours)->isPast()
                && !$ticket->first_response_at,

            'sla_resolution_breach' =>
                $ticket->resolution_due_at
                && $ticket->resolution_due_at->addHours($rule->after_hours)->isPast()
                && !in_array($ticket->status, ['resolved', 'closed']),

            'no_update' =>
                $ticket->updated_at->diffInHours(now()) >= $rule->after_hours
                && !in_array($ticket->status, ['resolved', 'closed']),

            default => false,
        };
    }

    /**
     * تنفيذ الإجراء المحدد في القاعدة
     */
    private function executeAction(Ticket $ticket, EscalationRule $rule): void
    {
        match ($rule->action) {
            'notify_supervisor' => $this->notifySupervisor($ticket, $rule),
            'reassign'          => $this->reassignTicket($ticket, $rule),
            'change_priority'   => $this->changePriority($ticket, $rule),
            'send_email'        => $this->sendEmail($ticket, $rule),
            default             => null,
        };

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => null,
            'action'    => 'escalated',
            'notes'     => "Rule: {$rule->name} | Action: {$rule->action}",
        ]);
    }

    private function notifySupervisor(Ticket $ticket, EscalationRule $rule): void
    {
        $supervisors = User::where('company_id', $ticket->company_id)
            ->whereHas('roles', fn($q) => $q->where('name', 'supervisor'))
            ->get();

        foreach ($supervisors as $supervisor) {
            ErpNotification::create([
                'company_id' => $ticket->company_id,
                'user_id'    => $supervisor->id,
                'type'       => 'ticket_escalated',
                'title'      => 'تذكرة تحتاج تدخل',
                'body'       => "التذكرة #{$ticket->ticket_number} تجاوزت الـ SLA",
                'url'        => "/helpdesk/{$ticket->id}",
                'data'       => ['ticket_id' => $ticket->id],
            ]);
        }
    }

    private function reassignTicket(Ticket $ticket, EscalationRule $rule): void
    {
        $targetUserId = $rule->action_data['user_id'] ?? null;
        if ($targetUserId) {
            $ticket->update(['assigned_to' => $targetUserId]);
        }
    }

    private function changePriority(Ticket $ticket, EscalationRule $rule): void
    {
        $newPriority = $rule->action_data['priority'] ?? 'high';
        $old         = $ticket->priority;
        $ticket->update(['priority' => $newPriority]);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => null,
            'action'    => 'priority_changed',
            'old_value' => $old,
            'new_value' => $newPriority,
            'notes'     => 'تغيير تلقائي بسبب قاعدة تصعيد',
        ]);
    }

    private function sendEmail(Ticket $ticket, EscalationRule $rule): void
    {
        // يمكن ربطه بـ Mail::to()->send() لاحقاً
        // مثال:
        // Mail::to($ticket->assignedTo->email ?? $rule->action_data['email'])
        //     ->send(new TicketEscalatedMail($ticket, $rule));
    }
}
