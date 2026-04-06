<?php

namespace App\Services;

use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Support\Facades\DB;

/**
 * HelpdeskService — business logic لنظام الدعم الفني
 */
class HelpdeskService
{
    public function __construct(private NotificationService $notifications) {}

    /**
     * إنشاء تذكرة دعم جديدة
     */
    public function createTicket(array $data, ?int $companyId): Ticket
    {
        return DB::transaction(function () use ($data, $companyId) {
            $ticket = Ticket::create([
                'company_id'  => $companyId,
                'customer_id' => $data['customer_id'] ?? null,
                'assigned_to' => $data['assigned_to']  ?? null,
                'subject'     => $data['subject'],
                'description' => $data['description'],
                'status'      => 'open',
                'priority'    => $data['priority'] ?? 'medium',
                'category'    => $data['category'] ?? null,
                'sla_due_at'  => now()->addHours($this->getSlaHours($data['priority'] ?? 'medium')),
            ]);

            TicketCreated::dispatch($ticket);

            return $ticket->load('customer', 'assignedTo');
        });
    }

    /**
     * تعيين التذكرة لموظف
     */
    public function assignTicket(Ticket $ticket, int $userId): Ticket
    {
        $ticket->update(['assigned_to' => $userId, 'status' => 'in_progress']);
        TicketAssigned::dispatch($ticket);
        return $ticket->fresh('customer', 'assignedTo');
    }

    /**
     * إضافة رد على التذكرة
     */
    public function addMessage(Ticket $ticket, string $message, bool $isInternal = false): TicketMessage
    {
        $msg = TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'user_id'     => auth()->id(),
            'message'     => $message,
            'is_internal' => $isInternal,
        ]);

        // تحديث الحالة إلى "قيد المعالجة" لو كانت مفتوحة
        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        return $msg->load('user');
    }

    /**
     * إغلاق التذكرة وتسجيل الحل
     */
    public function resolveTicket(Ticket $ticket, ?string $resolution = null): Ticket
    {
        $ticket->update([
            'status'      => 'resolved',
            'resolution'  => $resolution,
            'resolved_at' => now(),
        ]);
        return $ticket->fresh('customer', 'assignedTo');
    }

    /**
     * إحصائيات الـ helpdesk
     */
    public function getStats(?int $companyId): array
    {
        return [
            'open'        => Ticket::where('company_id', $companyId)->where('status', 'open')->count(),
            'in_progress' => Ticket::where('company_id', $companyId)->where('status', 'in_progress')->count(),
            'resolved'    => Ticket::where('company_id', $companyId)->where('status', 'resolved')->count(),
            'urgent'      => Ticket::where('company_id', $companyId)->where('priority', 'urgent')->whereNotIn('status', ['resolved', 'closed'])->count(),
            'overdue'     => Ticket::where('company_id', $companyId)->where('sla_due_at', '<', now())->whereNotIn('status', ['resolved', 'closed'])->count(),
        ];
    }

    // ── Helpers ─────────────────────────────────────────────

    private function getSlaHours(string $priority): int
    {
        return match ($priority) {
            'urgent' => 2,
            'high'   => 8,
            'medium' => 24,
            'low'    => 72,
            default  => 24,
        };
    }
}
