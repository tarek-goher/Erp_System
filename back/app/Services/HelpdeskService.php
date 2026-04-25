<?php

namespace App\Services;

use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Listeners\TicketNotificationListener;
use App\Models\Tag;
use App\Models\Ticket;
use App\Models\TicketLog;
use App\Models\TicketMessage;
use Illuminate\Support\Facades\DB;

/**
 * HelpdeskService — MERGED
 * دمج ERP القديم (Events + Notifications) مع Service Desk الجديد (SLA + Status + Tags + Logs)
 */
class HelpdeskService
{
    public function __construct(private NotificationService $notifications) {}

    // ── Create ───────────────────────────────────────────────

    public function createTicket(array $data, ?int $companyId): Ticket
    {
        return DB::transaction(function () use ($data, $companyId) {
            $ticket = Ticket::create([
                'company_id'   => $companyId,
                'customer_id'  => $data['customer_id']  ?? null,
                'requester_id' => $data['requester_id'] ?? null,
                'service_id'   => $data['service_id']   ?? null,
                'form_data'    => $data['form_data']    ?? null,
                'assigned_to'  => $data['assigned_to']  ?? null,
                'subject'      => $data['subject'],
                'description'  => $data['description'],
                'status'       => 'open',
                'priority'     => $data['priority'] ?? 'medium',
                'category'     => $data['category'] ?? null,
                'sla_due_at'   => now()->addHours($this->getSlaHours($data['priority'] ?? 'medium')),
            ]);

            TicketLog::create([
                'ticket_id' => $ticket->id,
                'done_by'   => auth()->id(),
                'action'    => 'created',
            ]);

            // Fire ERP event (يشغّل الـ Listeners الموجودة في ERP)
            TicketCreated::dispatch($ticket);

            return $ticket->load('customer', 'assignedTo', 'service', 'tags');
        });
    }

    // ── Assign ───────────────────────────────────────────────

    public function assignTicket(Ticket $ticket, int $userId): Ticket
    {
        $old = $ticket->assigned_to;

        $ticket->update([
            'assigned_to' => $userId,
            'status'      => $ticket->status === 'open' ? 'assigned' : $ticket->status,
        ]);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => auth()->id(),
            'action'    => 'assigned',
            'old_value' => $old,
            'new_value' => $userId,
        ]);

        // Fire ERP event
        TicketAssigned::dispatch($ticket);

        return $ticket->fresh('customer', 'assignedTo');
    }

    // ── Status Change ─────────────────────────────────────────

    public function changeStatus(Ticket $ticket, string $newStatus, ?string $notes = null): Ticket
    {
        if (!$ticket->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException(
                "لا يمكن الانتقال من '{$ticket->status}' إلى '{$newStatus}'"
            );
        }

        $old = $ticket->status;

        $updates = ['status' => $newStatus];

        if ($newStatus === 'resolved') {
            $updates['resolved_at'] = now();
        }

        // تسجيل أول رد لو كانت التذكرة لسه مش اترد عليها
        if (in_array($newStatus, ['assigned', 'in_progress']) && !$ticket->first_response_at) {
            $updates['first_response_at'] = now();
        }

        $ticket->update($updates);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => auth()->id(),
            'action'    => 'status_changed',
            'old_value' => $old,
            'new_value' => $newStatus,
            'notes'     => $notes,
        ]);

        return $ticket->fresh();
    }

    // ── Reply ─────────────────────────────────────────────────

    public function addMessage(Ticket $ticket, string $message, bool $isInternal = false): TicketMessage
    {
        $msg = TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'user_id'     => auth()->id(),
            'message'     => $message,
            'is_internal' => $isInternal,
        ]);

        // تسجيل أول رد تلقائياً
        if (!$ticket->first_response_at) {
            $ticket->update(['first_response_at' => now()]);
        }

        // تحديث الحالة تلقائياً لو كانت open أو assigned
        if (in_array($ticket->status, ['open', 'assigned'])) {
            $this->changeStatus($ticket, 'in_progress');
        }

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => auth()->id(),
            'action'    => 'commented',
        ]);

        // إيميل للعميل عند رد الفريق (مش رد داخلي)
        if (!$isInternal) {
            TicketNotificationListener::sendForReply($ticket, $message);
        }

        return $msg->load('user');
    }

    // ── Resolve ───────────────────────────────────────────────

    public function resolveTicket(Ticket $ticket, ?string $resolution = null): Ticket
    {
        $ticket->update([
            'status'      => 'resolved',
            'resolution'  => $resolution,
            'resolved_at' => now(),
        ]);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => auth()->id(),
            'action'    => 'resolved',
        ]);

        // إيميل للعميل عند الحل
        TicketNotificationListener::sendForResolved($ticket->fresh('customer', 'requester'));

        return $ticket->fresh('customer', 'assignedTo');
    }

    // ── Tags ──────────────────────────────────────────────────

    public function addTag(Ticket $ticket, int $tagId): void
    {
        $tag = Tag::where('company_id', $ticket->company_id)->findOrFail($tagId);
        $ticket->tags()->syncWithoutDetaching([$tagId]);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => auth()->id(),
            'action'    => 'tag_added',
            'new_value' => $tag->name,
        ]);
    }

    public function removeTag(Ticket $ticket, int $tagId): void
    {
        $tag = Tag::find($tagId);
        $ticket->tags()->detach($tagId);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => auth()->id(),
            'action'    => 'tag_removed',
            'old_value' => $tag?->name,
        ]);
    }

    // ── Stats ─────────────────────────────────────────────────

    public function getStats(?int $companyId): array
    {
        $base = Ticket::where('company_id', $companyId);

        return [
            'open'         => (clone $base)->where('status', 'open')->count(),
            'assigned'     => (clone $base)->where('status', 'assigned')->count(),
            'in_progress'  => (clone $base)->where('status', 'in_progress')->count(),
            'waiting_user' => (clone $base)->where('status', 'waiting_user')->count(),
            'resolved'     => (clone $base)->where('status', 'resolved')->count(),
            'urgent'       => (clone $base)->where('priority', 'urgent')->whereNotIn('status', ['resolved', 'closed'])->count(),
            'overdue'      => (clone $base)->overdue()->count(),
            'sla_breached' => (clone $base)->where('sla_breached', true)->whereNotIn('status', ['resolved', 'closed'])->count(),
        ];
    }

    // ── Helpers ───────────────────────────────────────────────

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
