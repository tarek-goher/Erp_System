<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * PruneAuditLogs — تنظيف الـ audit logs القديمة
 * ────────────────────────────────────────────────
 * على 1000 شركة × 1000 action/يوم = مليون صف يومياً
 * في سنة: 365 مليون صف — هيبطّل الـ DB
 *
 * الحل: نمسح اللي فاق 90 يوم (قابل للتعديل)
 *
 * الجدولة: في Kernel.php
 *   $schedule->command('audit:prune')->weeklyOn(0, '03:00');
 *
 * الاستخدام اليدوي:
 *   php artisan audit:prune
 *   php artisan audit:prune --days=30
 *   php artisan audit:prune --dry-run
 */
class PruneAuditLogsCommand extends Command
{
    protected $signature   = 'audit:prune
                                {--days=90   : احذف اللي فاق X يوم}
                                {--dry-run   : اعرض بس كام صف هيتحذف من غير ما تحذف}
                                {--company=  : حذف لشركة معينة بس (company_id)}';

    protected $description = 'حذف audit logs أقدم من X يوم للحفاظ على أداء الـ DB';

    public function handle(): int
    {
        $days      = (int) $this->option('days');
        $dryRun    = $this->option('dry-run');
        $companyId = $this->option('company');
        $cutoff    = now()->subDays($days);

        $query = DB::table('audit_logs')
            ->where('created_at', '<', $cutoff);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $count = $query->count();

        if ($dryRun) {
            $this->info("Dry run — هيتحذف: {$count} صف أقدم من {$days} يوم (قبل {$cutoff->toDateString()})");
            return self::SUCCESS;
        }

        if ($count === 0) {
            $this->info('مفيش logs قديمة تتحذف.');
            return self::SUCCESS;
        }

        // نحذف على دفعات عشان منحملش الـ DB
        $deleted = 0;
        do {
            $batch    = (clone $query)->limit(5000)->delete();
            $deleted += $batch;
            $this->output->write('.');
        } while ($batch > 0);

        $this->newLine();
        $this->info("تم حذف {$deleted} صف من audit_logs (أقدم من {$days} يوم).");

        return self::SUCCESS;
    }
}
