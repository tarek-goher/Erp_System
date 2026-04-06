<?php

namespace App\Jobs;

use App\Services\ReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * GenerateReportJob — توليد وحفظ التقارير في الـ cache
 * الاستخدام: GenerateReportJob::dispatch('sales', $params, $companyId)
 */
class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 120;

    public function __construct(
        private readonly string $reportType,
        private readonly array  $params,
        private readonly int    $companyId
    ) {}

    public function handle(ReportService $reportService): void
    {
        $cacheKey = "report_{$this->reportType}_{$this->companyId}_" . md5(serialize($this->params));

        $data = match ($this->reportType) {
            'sales'      => $reportService->salesReport($this->params['from'], $this->params['to'], $this->companyId),
            'purchases'  => $reportService->purchasesReport($this->params['from'], $this->params['to'], $this->companyId),
            'inventory'  => $reportService->inventoryReport($this->companyId),
            'hr'         => $reportService->hrReport($this->params['month'], $this->params['year'], $this->companyId),
            'accounting' => $reportService->accountingReport($this->companyId),
            default      => throw new \InvalidArgumentException("Unknown report type: {$this->reportType}"),
        };

        // حفظ في الـ cache لمدة ساعة
        Cache::put($cacheKey, $data, now()->addHour());

        Log::info("Report '{$this->reportType}' generated for company {$this->companyId}");
    }
}
