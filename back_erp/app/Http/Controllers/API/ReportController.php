<?php

namespace App\Http\Controllers\API;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ReportController — تقارير النظام الشاملة
 * كل الـ business logic في ReportService
 */
class ReportController extends BaseController
{
    public function __construct(private ReportService $reportService) {}

    /** GET /api/reports/sales */
    public function sales(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();

        return $this->success($this->reportService->salesReport($from, $to, $this->companyId()));
    }

    /** GET /api/reports/purchases */
    public function purchases(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();

        return $this->success($this->reportService->purchasesReport($from, $to, $this->companyId()));
    }

    /** GET /api/reports/inventory */
    public function inventory(): JsonResponse
    {
        return $this->success($this->reportService->inventoryReport($this->companyId()));
    }

    /** GET /api/reports/hr */
    public function hr(Request $request): JsonResponse
    {
        $month = $request->month ?? now()->month;
        $year  = $request->year  ?? now()->year;

        return $this->success($this->reportService->hrReport($month, $year, $this->companyId()));
    }

    /** GET /api/reports/accounting */
    public function accounting(): JsonResponse
    {
        return $this->success($this->reportService->accountingReport($this->companyId()));
    }

    /** GET /api/reports/customers */
    public function customers(): JsonResponse
    {
        return $this->success($this->reportService->topCustomers($this->companyId()));
    }

    /** GET /api/reports/products */
    public function products(): JsonResponse
    {
        return $this->success($this->reportService->topProducts($this->companyId()));
    }

    /** GET /api/reports/dashboard */
    public function dashboard(): JsonResponse
    {
        return $this->success($this->reportService->dashboardSummary($this->companyId()));
    }

    /** GET /api/reports/income-statement?from=&to= */
    public function incomeStatement(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->incomeStatement($from, $to, $this->companyId()));
    }

    /** GET /api/reports/balance-sheet?as_of= */
    public function balanceSheet(Request $request): JsonResponse
    {
        $asOf = $request->as_of ?? now()->toDateString();
        return $this->success($this->reportService->balanceSheet($asOf, $this->companyId()));
    }

    /** GET /api/reports/cash-flow?from=&to= */
    public function cashFlow(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->cashFlow($from, $to, $this->companyId()));
    }

    /** GET /api/reports/journal-entries?from=&to= */
    public function journalEntries(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->journalEntriesReport($from, $to, $this->companyId()));
    }

    /** GET /api/reports/sales-summary?from=&to= */
    public function salesSummary(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->salesSummary($from, $to, $this->companyId()));
    }

    // ══════════════════════════════════════════════════════════
    // Export Endpoints — PDF / Excel
    // GET /api/reports/export/{type}?format=pdf|excel&from=&to=
    // ══════════════════════════════════════════════════════════

    /** GET /api/reports/export/sales?format=pdf|excel&from=&to= */
    public function exportSales(Request $request): \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'format' => 'required|in:pdf,excel',
            'from'   => 'nullable|date',
            'to'     => 'nullable|date',
        ]);

        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        $data = $this->reportService->salesReport($from, $to, $this->companyId());

        return $this->exportReport('sales', $data, $request->format, $from, $to);
    }

    /** GET /api/reports/export/purchases?format=pdf|excel&from=&to= */
    public function exportPurchases(Request $request): \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'format' => 'required|in:pdf,excel',
            'from'   => 'nullable|date',
            'to'     => 'nullable|date',
        ]);

        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        $data = $this->reportService->purchasesReport($from, $to, $this->companyId());

        return $this->exportReport('purchases', $data, $request->format, $from, $to);
    }

    /** GET /api/reports/export/profits?format=pdf|excel&from=&to= */
    public function exportProfits(Request $request): \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'format' => 'required|in:pdf,excel',
            'from'   => 'nullable|date',
            'to'     => 'nullable|date',
        ]);

        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();

        $sales     = $this->reportService->salesReport($from, $to, $this->companyId());
        $purchases = $this->reportService->purchasesReport($from, $to, $this->companyId());

        $data = [
            'total_sales'     => data_get($sales,     'total_sales',     0),
            'total_purchases' => data_get($purchases,  'total_purchases', 0),
            'gross_profit'    => data_get($sales, 'total_sales', 0) - data_get($purchases, 'total_purchases', 0),
            'period'          => ['from' => $from, 'to' => $to],
        ];

        return $this->exportReport('profits', $data, $request->format, $from, $to);
    }

    /**
     * Shared export helper — generates PDF (via DomPDF) or Excel (via PhpSpreadsheet).
     * لو مش مثبّت الـ packages → ترجع JSON عادي مع header يوضح النوع.
     */
    private function exportReport(string $type, array $data, string $format, string $from, string $to): \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
    {
        $filename = "{$type}_report_{$from}_{$to}";

        if ($format === 'excel') {
            // ── Excel via PhpSpreadsheet ──────────────────────
            if (class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
                $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
                $sheet = $spreadsheet->getActiveSheet();
                $sheet->setTitle(ucfirst($type) . ' Report');
                $sheet->setCellValue('A1', 'Report: ' . ucfirst($type));
                $sheet->setCellValue('A2', 'Period: ' . $from . ' — ' . $to);
                $sheet->setCellValue('A3', 'Generated: ' . now()->toDateTimeString());

                $row = 5;
                foreach ($data as $key => $value) {
                    if (is_scalar($value)) {
                        $sheet->setCellValue('A' . $row, $key);
                        $sheet->setCellValue('B' . $row, $value);
                        $row++;
                    }
                }

                $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
                $tmp = tempnam(sys_get_temp_dir(), 'report') . '.xlsx';
                $writer->save($tmp);

                return response()->download($tmp, $filename . '.xlsx', [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ])->deleteFileAfterSend();
            }

            // Fallback: JSON with Content-Disposition
            return response()->json(['type' => $type, 'format' => 'excel', 'data' => $data])
                ->header('Content-Disposition', "attachment; filename=\"{$filename}.json\"");
        }

        // ── PDF via DomPDF ────────────────────────────────────
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.export', compact('type', 'data', 'from', 'to'));
            return $pdf->download($filename . '.pdf');
        }

        // Fallback JSON
        return response()->json(['type' => $type, 'format' => 'pdf', 'data' => $data])
            ->header('Content-Disposition', "attachment; filename=\"{$filename}.json\"");
    }
}