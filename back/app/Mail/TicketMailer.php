<?php

namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * TicketMailer
 *
 * Mailable موحّد لكل إشعارات التذاكر عبر البريد الإلكتروني.
 * يُرسل لـ: العميل المرتبط بالتذكرة أو الـ requester.
 *
 * الأنواع المدعومة ($event):
 *   - ticket_opened   : عند فتح تذكرة جديدة
 *   - ticket_resolved : عند حل التذكرة
 *   - ticket_reply    : عند إضافة رد من الفريق
 *   - ticket_assigned : عند تعيين موظف (للعميل)
 *
 * الاستخدام:
 *   Mail::to($email)->queue(new TicketMailer($ticket, 'ticket_opened'));
 */
class TicketMailer extends Mailable
{
    use Queueable, SerializesModels;

    public string $ticketNumber;
    public string $subject;
    public string $recipientName;
    public string $eventLabel;
    public ?string $replyBody;
    public string $ticketUrl;

    public function __construct(
        public readonly Ticket $ticket,
        public readonly string $event = 'ticket_opened',
        public readonly ?string $extraMessage = null
    ) {
        $this->ticketNumber  = $ticket->ticket_number;
        $this->recipientName = $ticket->customer?->name
            ?? $ticket->requester?->name
            ?? 'العميل';

        $this->replyBody = $extraMessage;

        $this->ticketUrl = rtrim(config('app.frontend_url', config('app.url')), '/')
            . '/helpdesk/' . $ticket->id;

        $this->eventLabel = match ($event) {
            'ticket_opened'   => 'تم استلام طلبك',
            'ticket_resolved' => 'تم حل طلبك',
            'ticket_reply'    => 'رد جديد على طلبك',
            'ticket_assigned' => 'جارٍ العمل على طلبك',
            default           => 'تحديث على طلبك',
        };

        // Subject line
        $this->subject = "[{$this->ticketNumber}] {$this->eventLabel}";
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.tickets.notification');
    }

    public function attachments(): array
    {
        return [];
    }
}
