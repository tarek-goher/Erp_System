<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * DailyBackupJob
 *
 * يتشغل يومياً عبر الـ Scheduler ويعمل:
 *  1. Backup لكل جداول الـ ERP بصيغة JSON
 *  2. يحفظ locally + على S3 (لو configured)
 *  3. يحذف الـ backups القديمة (+30 يوم)
 *
 * مجدول في routes/console.php:
 *   Schedule::job(new DailyBackupJob())->dailyAt('02:00')->onOneServer();
 */
class DailyBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;  // 10 دقايق max
    public int $tries   = 3;

    private array $allTables = [
        // Core
        'companies', 'users',
        // Products & Inventory
        'products', 'categories', 'customers', 'suppliers',
        'warehouses', 'stock_movements', 'inventory_items',
        // Sales & Purchases
        'sales', 'sale_items', 'quotations', 'quotation_items',
        'purchases', 'purchase_items', 'purchase_invoices',
        // Accounting
        'accounts', 'journal_entries', 'journal_items',
        'bank_statements', 'fixed_assets', 'budgets',
        'currencies', 'exchange_rates', 'tax_rates',
        // HR
        'employees', 'attendances', 'payrolls', 'leave_requests',
        'appraisals', 'recruitment_jobs', 'candidates',
        // Projects & CRM
        'projects', 'project_tasks', 'timesheets',
        'crm_leads', 'crm_activities',
        // Helpdesk & Marketing
        'helpdesk_tickets', 'campaigns', 'marketing_contacts',
        // Fleet & Manufacturing
        'fleet_vehicles', 'fleet_trips', 'fuel_logs',
        'work_orders', 'bom_items',
        // System
        'erp_notifications', 'audit_logs',
        'mail_configs', 'company_settings',
        'roles', 'permissions',
        'subscriptions',
    ];

    public function handle(): void
    {
        $startTime = now();
        $timestamp = $startTime->format('Y-m-d_H-i-s');
        $filename  = "erp_backup_{$timestamp}.json";

        Log::info("[DailyBackup] بدأ الـ backup — {$timestamp}");

        try {
            $backup = [
                'meta' => [
                    'app'           => config('app.name'),
                    'version'       => '1.0',
                    'exported_at'   => $startTime->toIso8601String(),
                    'environment'   => config('app.env'),
                    'tables_count'  => 0,
                    'total_records' => 0,
                ],
                'tables' => [],
            ];

            $totalRecords = 0;
            $tableCount   = 0;

            foreach ($this->allTables as $table) {
                try {
                    if (! Schema::hasTable($table)) {
                        continue;
                    }

                    $rows = DB::table($table)->get()->toArray();
                    $backup['tables'][$table] = $rows;
                    $count = count($rows);
                    $totalRecords += $count;
                    $tableCount++;

                    Log::debug("[DailyBackup] ✓ {$table}: {$count} records");

                } catch (\Throwable $e) {
                    Log::warning("[DailyBackup] ✗ {$table}: " . $e->getMessage());
                    $backup['tables'][$table] = ['_error' => $e->getMessage()];
                }
            }

            $backup['meta']['tables_count']  = $tableCount;
            $backup['meta']['total_records'] = $totalRecords;
            $backup['meta']['duration_ms']   = now()->diffInMilliseconds($startTime);

            $json = json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            // ── حفظ محلي ──────────────────────────────────────────
            Storage::disk('local')->put("backups/{$filename}", $json);
            Log::info("[DailyBackup] ✓ حُفظ محلياً: backups/{$filename}");

            // ── رفع على S3 لو configured ──────────────────────────
            if ($this->isS3Configured()) {
                Storage::disk('s3')->put("erp-backups/{$filename}", $json);
                Log::info("[DailyBackup] ✓ رُفع على S3: erp-backups/{$filename}");
            }

            // ── حذف الـ backups القديمة (+30 يوم) ─────────────────
            $this->pruneOldBackups();

            $duration = round(now()->diffInMilliseconds($startTime) / 1000, 2);
            Log::info("[DailyBackup] ✅ انتهى بنجاح — {$totalRecords} record في {$duration}s");

        } catch (\Throwable $e) {
            Log::error("[DailyBackup] ❌ فشل: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e; // لـ Horizon يعيد المحاولة
        }
    }

    private function isS3Configured(): bool
    {
        return ! empty(config('filesystems.disks.s3.key'))
            && ! empty(config('filesystems.disks.s3.bucket'));
    }

    private function pruneOldBackups(): void
    {
        try {
            $cutoff = now()->subDays(30);
            $files  = Storage::disk('local')->files('backups');

            $deleted = 0;
            foreach ($files as $file) {
                $lastModified = Storage::disk('local')->lastModified($file);
                if ($lastModified < $cutoff->timestamp) {
                    Storage::disk('local')->delete($file);
                    $deleted++;
                }
            }

            if ($deleted > 0) {
                Log::info("[DailyBackup] 🗑️ حُذف {$deleted} backup قديم");
            }
        } catch (\Throwable $e) {
            Log::warning("[DailyBackup] تحذير: فشل حذف الـ backups القديمة — " . $e->getMessage());
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[DailyBackup] فشل نهائي بعد كل المحاولات', [
            'error' => $exception->getMessage(),
        ]);
    }
}
