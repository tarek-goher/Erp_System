<?php

namespace App\Listeners;

use App\Events\TicketCreated;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * NotifyAdminTicketCreated — يُشعر مديري الشركة عند إنشاء تذكرة دعم جديدة.
 *
 * Fix #3: كان TicketCreated Event بدون أي Listener — لا يُنتج أثراً.
 * الحل: إضافة هذا الـ Listener + ربطه في EventServiceProvider.
 *
 * يُرسل الإشعار لمستخدمي الشركة الذين لديهم دور admin أو manager.
 * ShouldQueue = يشتغل في الـ background queue.
 */
class NotifyAdminTicketCreated implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(private NotificationService $notifications) {}

    public function handle(TicketCreated $event): void
    {
        $ticket = $event->ticket;

        $priorityLabel = match ($ticket->priority) {
            'urgent' => '🔴 عاجل',
            'high'   => '🟠 مرتفع',
            'medium' => '🟡 متوسط',
            'low'    => '🟢 منخفض',
            default  => $ticket->priority,
        };

        // إشعار لكل المديرين في الشركة (admin / manager roles)
        $adminIds = User::where('company_id', $ticket->company_id)
            ->where('is_active', true)
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['admin', 'manager']))
            ->pluck('id');

        foreach ($adminIds as $adminId) {
            $this->notifications->send(
                userId: $adminId,
                title: 'تذكرة دعم جديدة',
                body: "تم فتح تذكرة جديدة [{$priorityLabel}]: {$ticket->subject}",
                type: $ticket->priority === 'urgent' ? 'error' : 'info',
                data: ['ticket_id' => $ticket->id, 'priority' => $ticket->priority]
            );
        }
    }

    /**
     * معالجة الفشل بعد استنزاف المحاولات
     */
    public function failed(TicketCreated $event, \Throwable $exception): void
    {
        \Log::error('[NotifyAdminTicketCreated] فشل إرسال إشعار التذكرة', [
            'ticket_id' => $event->ticket->id,
            'error'     => $exception->getMessage(),
        ]);
    }
}
