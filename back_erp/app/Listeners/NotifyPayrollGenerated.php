<?php

namespace App\Listeners;

use App\Events\PayrollGenerated;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * NotifyPayrollGenerated — يُرسل إشعاراً داخلياً لمستخدمي الشركة
 * عند اكتمال توليد الرواتب الشهرية.
 *
 * Fix #3: كان PayrollGenerated Event بدون أي Listener — لا يُنتج أثراً.
 * الحل: إضافة هذا الـ Listener + ربطه في EventServiceProvider.
 *
 * ShouldQueue = يشتغل في الـ background queue لتفادي تأخير الـ request.
 */
class NotifyPayrollGenerated implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(private NotificationService $notifications) {}

    public function handle(PayrollGenerated $event): void
    {
        $this->notifications->broadcastToCompany(
            companyId: $event->companyId,
            title: 'اكتمل توليد الرواتب',
            body: "تم توليد {$event->count} راتب لشهر {$event->month}/{$event->year} بنجاح. يمكنك مراجعتها الآن.",
            type: 'success'
        );
    }

    /**
     * معالجة الفشل بعد استنزاف المحاولات
     */
    public function failed(PayrollGenerated $event, \Throwable $exception): void
    {
        \Log::error('[NotifyPayrollGenerated] فشل إرسال إشعار الرواتب', [
            'company_id' => $event->companyId,
            'month'      => $event->month,
            'year'       => $event->year,
            'error'      => $exception->getMessage(),
        ]);
    }
}
