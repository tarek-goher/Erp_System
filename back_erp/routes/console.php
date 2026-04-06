<?php

use App\Jobs\DailyBackupJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Task Scheduler
|--------------------------------------------------------------------------
|
| ضيف في crontab على السيرفر:
|   * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
|
*/

// ── Backup يومي الساعة 2 الصبح ────────────────────────────────────────────
Schedule::job(new DailyBackupJob())
    ->dailyAt('02:00')
    ->onOneServer()           // مهم في حالة multi-server — ما يتشغلش مرتين
    ->withoutOverlapping()
    ->name('daily-backup')
    ->onFailure(function () {
        \Illuminate\Support\Facades\Log::error('[Scheduler] DailyBackupJob فشل — راجع Horizon');
    });

// ── تنظيف الـ expired Sanctum tokens كل أسبوع ──────────────────────────────
Schedule::command('sanctum:prune-expired --hours=168')
    ->weekly()
    ->sundays()
    ->at('03:00');

// ── تنظيف الـ failed jobs القديمة (أكتر من 30 يوم) ─────────────────────────
Schedule::command('queue:prune-failed --hours=720')
    ->weekly()
    ->mondays()
    ->at('03:30');

// ── Horizon Snapshots — كل 5 دقايق للـ metrics ──────────────────────────────
Schedule::command('horizon:snapshot')
    ->everyFiveMinutes();
