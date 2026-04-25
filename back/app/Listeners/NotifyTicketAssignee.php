<?php

namespace App\Listeners;

use App\Events\TicketAssigned;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * NotifyTicketAssignee — إشعار الموظف المعين على التذكرة
 */
class NotifyTicketAssignee implements ShouldQueue
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(TicketAssigned $event): void
    {
        $this->notifications->send(
            userId: $event->agentId,
            title: 'تذكرة جديدة بانتظارك',
            body: "تم تعيين تذكرة: {$event->ticket->subject} لك.",
            type: 'info',
            url: '/helpdesk/tickets/' . $event->ticket->id
        );
    }
}
