<?php

namespace App\Console;

use App\Console\Commands\PruneAuditLogsCommand;
use App\Jobs\CheckStockAlertsJob;
use App\Jobs\RenewSubscriptionsJob;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

/**
 * Console Kernel — جدولة المهام التلقائية
 */
class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // فحص المخزون المنخفض يومياً الساعة 8 صباحاً
        $schedule->job(new CheckStockAlertsJob())->dailyAt('08:00');

        // تجديد الاشتراكات المنتهية تلقائياً يومياً الساعة 1 صباحاً
        $schedule->job(new RenewSubscriptionsJob())->dailyAt('01:00');

        // تنظيف الإشعارات القديمة (أكتر من 3 شهور) أسبوعياً
        $schedule->command('model:prune', ['--model' => 'App\\Models\\ErpNotification'])
            ->weekly()->sundays()->at('02:00');

        // تنظيف سجلات الأنشطة القديمة (أكتر من 90 يوم) شهرياً — PruneAuditLogs
        $schedule->command('audit:prune', ['--days' => 90])
            ->monthly()->at('03:00');

        // تنظيف الـ failed jobs القديمة أسبوعياً
        $schedule->command('queue:flush')->weekly()->sundays()->at('04:00');
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}
