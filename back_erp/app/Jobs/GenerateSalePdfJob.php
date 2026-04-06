<?php

namespace App\Jobs;

use App\Models\Sale;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

// ══════════════════════════════════════════════════════════
// GenerateSalePdfJob — توليد PDF الفاتورة في الـ background
// ══════════════════════════════════════════════════════════
// PDF generation عملية تقيلة → مش المفروض تحصل sync
//
// الاستخدام:
//   GenerateSalePdfJob::dispatch($sale, $requestingUserId);
//
// ملاحظة: المشروع مش عنده PDF library دلوقتي (Dompdf/Snappy)
// الـ job ده جاهز للاستخدام لما تضيف المكتبة:
//   composer require barryvdh/laravel-dompdf
// ══════════════════════════════════════════════════════════
class GenerateSalePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 60;

    public function __construct(
        private Sale $sale,
        private int  $requestingUserId,  // عشان نبعتله notification لما يخلص
    ) {}

    public function handle(): void
    {
        $sale = $this->sale->load(['customer', 'items.product', 'user:id,name']);

        // ─── هنا بتضيف PDF library لما تجهز ──────────────
        // مثال مع Dompdf:
        //   $pdf = Pdf::loadView('pdfs.sale', compact('sale'));
        //   $path = "sales/sale-{$sale->id}.pdf";
        //   Storage::put($path, $pdf->output());
        //
        // حالياً بنعمل JSON export كـ placeholder
        $path    = "exports/sale-{$sale->id}.json";
        $content = json_encode(['sale' => $sale], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        Storage::put($path, $content);

        // ─── إشعار المستخدم إن الملف جاهز ────────────────
        $user = User::find($this->requestingUserId);
        if ($user) {
            NotificationService::send(
                $user,
                'export_ready',
                'تصدير الفاتورة جاهز',
                "فاتورة #{$sale->id} جاهزة للتحميل",
                ['path' => $path],
                "/sales/{$sale->id}/export"
            );
        }

        Log::info("[GenerateSalePdfJob] Sale #{$sale->id} exported to {$path}");
    }

    public function failed(\Throwable $e): void
    {
        Log::error("[GenerateSalePdfJob] Sale #{$this->sale->id} failed: " . $e->getMessage());
    }
}
