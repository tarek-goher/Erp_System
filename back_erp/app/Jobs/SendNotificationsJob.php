<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

// ══════════════════════════════════════════════════════════
// SendNotificationsJob — إرسال الإشعارات لكل users شركة
// ══════════════════════════════════════════════════════════
// بدل NotificationService::sendToCompany() اللي كان بيعمل
// DB inserts sync في نفس الـ request، دلوقتي بيحصل في background
//
// الاستخدام:
//   SendNotificationsJob::dispatch($companyId, 'low_stock', 'مخزون منخفض', 'المنتج X وصل للحد الأدنى');
// ══════════════════════════════════════════════════════════
class SendNotificationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct(
        private int    $companyId,
        private string $type,
        private string $title,
        private string $body    = '',
        private array  $data    = [],
        private string $url     = '',
        private ?string $role   = null,  // لو null → لكل users الشركة
    ) {}

    public function handle(): void
    {
        $query = User::where('company_id', $this->companyId)
            ->where('is_active', true)
            ->select('id', 'company_id');

        // لو محدد role → فلتر
        if ($this->role) {
            $query->whereHas('roles', fn($q) => $q->where('name', $this->role));
        }

        $count = 0;

        // chunk() → عشان نتجنب تحميل كل الـ users في الـ memory
        $query->chunk(200, function ($users) use (&$count) {
            foreach ($users as $user) {
                NotificationService::send(
                    $user,
                    $this->type,
                    $this->title,
                    $this->body,
                    $this->data,
                    $this->url
                );
                $count++;
            }
        });

        Log::info("[SendNotificationsJob] Sent '{$this->type}' to {$count} users in company #{$this->companyId}");
    }

    public function failed(\Throwable $e): void
    {
        Log::error("[SendNotificationsJob] Failed for company #{$this->companyId}: " . $e->getMessage());
    }
}
