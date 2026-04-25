<?php

namespace App\Listeners;

use App\Mail\TicketMailer;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * TicketNotificationListener
 *
 * يستمع لأحداث التذاكر ويرسل إيميلات للعميل.
 * يُسجَّل في EventServiceProvider على:
 *   - TicketCreated  → ticket_opened
 *   - TicketAssigned → ticket_assigned
 *
 * الـ reply و resolve يُستدعيان مباشرة من HelpdeskService
 * عبر TicketNotificationListener::sendForReply() و sendForResolved().
 *
 * التسجيل في EventServiceProvider:
 *
 *   protected $listen = [
 *       \App\Events\TicketCreated::class  => [
 *           \App\Listeners\TicketNotificationListener::class,
 *       ],
 *       \App\Events\TicketAssigned::class => [
 *           \App\Listeners\TicketNotificationListener::class,
 *       ],
 *   ];
 */
class TicketNotificationListener
{
    /**
     * يستقبل TicketCreated أو TicketAssigned
     * ويحدد نوع الإيميل بناءً على نوع الـ Event
     */
    public function handle(object $event): void
    {
        $ticket = $event->ticket;

        $eventType = match (get_class($event)) {
            \App\Events\TicketCreated::class  => 'ticket_opened',
            \App\Events\TicketAssigned::class => 'ticket_assigned',
            default => null,
        };

        if (!$eventType) {
            return;
        }

        static::dispatch($ticket, $eventType);
    }

    /**
     * إرسال إيميل عند إضافة رد من الفريق
     * يُستدعى من HelpdeskService::addMessage()
     */
    public static function sendForReply(Ticket $ticket, string $messageBody): void
    {
        static::dispatch($ticket, 'ticket_reply', $messageBody);
    }

    /**
     * إرسال إيميل عند حل التذكرة
     * يُستدعى من HelpdeskService::resolveTicket() أو changeStatus()
     */
    public static function sendForResolved(Ticket $ticket): void
    {
        static::dispatch($ticket, 'ticket_resolved');
    }

    // ── Core dispatch ─────────────────────────────────────────────

    private static function dispatch(Ticket $ticket, string $eventType, ?string $message = null): void
    {
        $email = static::getRecipientEmail($ticket);

        if (!$email) {
            return; // لا يوجد عميل أو إيميل — تجاهل بصمت
        }

        try {
            Mail::to($email)->queue(new TicketMailer($ticket, $eventType, $message));
        } catch (\Throwable $e) {
            // لا نكسر الـ flow لو الإيميل فشل
            Log::warning("TicketMailer failed [{$ticket->ticket_number}]: " . $e->getMessage());
        }
    }

    /**
     * يجيب بالإيميل من: customer → requester → null
     */
    private static function getRecipientEmail(Ticket $ticket): ?string
    {
        // يحمّل الـ relations لو مش محمّلة
        if (!$ticket->relationLoaded('customer')) {
            $ticket->loadMissing('customer', 'requester');
        }

        return $ticket->customer?->email
            ?? $ticket->requester?->email
            ?? null;
    }
}
