<?php

namespace App\Http\Controllers\API;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends BaseController
{
    public function __construct(private ReportService $reportService) {}

    public function sales(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->salesReport($from, $to, $this->companyId()));
    }

    public function purchases(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->purchasesReport($from, $to, $this->companyId()));
    }

    public function inventory(): JsonResponse
    {
        return $this->success($this->reportService->inventoryReport($this->companyId()));
    }

    public function hr(Request $request): JsonResponse
    {
        $month = $request->month ?? now()->month;
        $year  = $request->year  ?? now()->year;
        return $this->success($this->reportService->hrReport($month, $year, $this->companyId()));
    }

    public function accounting(): JsonResponse
    {
        return $this->success($this->reportService->accountingReport($this->companyId()));
    }

    public function customers(): JsonResponse
    {
        return $this->success($this->reportService->topCustomers($this->companyId()));
    }

    public function products(): JsonResponse
    {
        return $this->success($this->reportService->topProducts($this->companyId()));
    }

    public function dashboard(): JsonResponse
    {
        return $this->success($this->reportService->dashboardSummary($this->companyId()));
    }

    public function incomeStatement(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->incomeStatement($from, $to, $this->companyId()));
    }

    public function balanceSheet(Request $request): JsonResponse
    {
        $asOf = $request->as_of ?? now()->toDateString();
        return $this->success($this->reportService->balanceSheet($asOf, $this->companyId()));
    }

    public function cashFlow(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->cashFlow($from, $to, $this->companyId()));
    }

    public function journalEntries(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->journalEntriesReport($from, $to, $this->companyId()));
    }

    public function salesSummary(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        return $this->success($this->reportService->salesSummary($from, $to, $this->companyId()));
    }

    public function exportSales(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $request->validate(['format' => 'required|in:pdf,excel', 'from' => 'nullable|date', 'to' => 'nullable|date']);
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        $data = $this->reportService->salesReport($from, $to, $this->companyId());
        return $this->exportReport('sales', $data, $request->format, $from, $to);
    }

    public function exportPurchases(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $request->validate(['format' => 'required|in:pdf,excel', 'from' => 'nullable|date', 'to' => 'nullable|date']);
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        $data = $this->reportService->purchasesReport($from, $to, $this->companyId());
        return $this->exportReport('purchases', $data, $request->format, $from, $to);
    }

    public function exportProfits(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $request->validate(['format' => 'required|in:pdf,excel', 'from' => 'nullable|date', 'to' => 'nullable|date']);
        $from      = $request->from ?? now()->startOfMonth()->toDateString();
        $to        = $request->to   ?? now()->toDateString();
        $sales     = $this->reportService->salesReport($from, $to, $this->companyId());
        $purchases = $this->reportService->purchasesReport($from, $to, $this->companyId());
        $data = [
            'total_sales'     => data_get($sales,     'summary.total_revenue', 0),
            'total_purchases' => data_get($purchases, 'summary.total_cost',    0),
            'gross_profit'    => data_get($sales, 'summary.total_revenue', 0) - data_get($purchases, 'summary.total_cost', 0),
            'period'          => ['from' => $from, 'to' => $to],
        ];
        return $this->exportReport('profits', $data, $request->format, $from, $to);
    }

    private function exportReport(string $type, array $data, string $format, string $from, string $to): \Symfony\Component\HttpFoundation\Response
    {
        $filename = "{$type}_report_{$from}_{$to}";

        if ($format === 'excel' && class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {

            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet       = $spreadsheet->getActiveSheet();
            $sheet->setRightToLeft(true);

            $headerStyle = [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
                'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '1a56db']],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            ];
            $titleStyle = [
                'font'      => ['bold' => true, 'size' => 14],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            ];
            $totalStyle = [
                'font' => ['bold' => true, 'size' => 11],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'dbeafe']],
            ];

            // ══ Sales ══
            if ($type === 'sales') {
                $sheet->setTitle('تقرير المبيعات');
                $sheet->mergeCells('A1:J1');
                $sheet->setCellValue('A1', 'تقرير المبيعات');
                $sheet->getStyle('A1')->applyFromArray($titleStyle);
                $sheet->mergeCells('A2:J2');
                $sheet->setCellValue('A2', 'الفترة: ' . $from . ' — ' . $to);
                $sheet->getStyle('A2')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $sheet->mergeCells('A3:J3');
                $sheet->setCellValue('A3', 'تاريخ التصدير: ' . now()->format('Y-m-d H:i'));
                $sheet->getStyle('A3')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

                $headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'تاريخ الاستحقاق', 'طريقة الدفع', 'الحالة', 'المجموع الفرعي', 'الخصم', 'الضريبة', 'الإجمالي'];
                $cols    = ['A','B','C','D','E','F','G','H','I','J'];
                foreach ($headers as $i => $h) { $sheet->setCellValue($cols[$i] . '5', $h); }
                $sheet->getStyle('A5:J5')->applyFromArray($headerStyle);

                $sales = $data['sales'] ?? [];
                $row   = 6;
                foreach ($sales as $sale) {
                    $sheet->setCellValue("A{$row}", $sale['invoice_number'] ?? '');
                    $sheet->setCellValue("B{$row}", $sale['customer_name']  ?? '—');
                    $sheet->setCellValue("C{$row}", $sale['created_at']     ?? '');
                    $sheet->setCellValue("D{$row}", $sale['due_date']       ?? '—');
                    $sheet->setCellValue("E{$row}", $sale['payment_method'] ?? '');
                    $sheet->setCellValue("F{$row}", $sale['status']         ?? '');
                    $sheet->setCellValue("G{$row}", (float) ($sale['subtotal'] ?? 0));
                    $sheet->setCellValue("H{$row}", (float) ($sale['discount'] ?? 0));
                    $sheet->setCellValue("I{$row}", (float) ($sale['tax']      ?? 0));
                    $sheet->setCellValue("J{$row}", (float) ($sale['total']    ?? 0));
                    if ($row % 2 === 0) {
                        $sheet->getStyle("A{$row}:J{$row}")->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setRGB('f8fafc');
                    }
                    $row++;
                }
                $summary  = $data['summary'] ?? [];
                $totalRow = $row + 1;
                $sheet->setCellValue("A{$totalRow}", 'الإجمالي الكلي');
                $sheet->setCellValue("G{$totalRow}", (float) ($summary['total_revenue']  ?? 0));
                $sheet->setCellValue("H{$totalRow}", (float) ($summary['total_discount'] ?? 0));
                $sheet->setCellValue("I{$totalRow}", (float) ($summary['total_tax']      ?? 0));
                $sheet->setCellValue("J{$totalRow}", (float) ($summary['total_revenue']  ?? 0));
                $sheet->getStyle("A{$totalRow}:J{$totalRow}")->applyFromArray($totalStyle);
                foreach (range('A', 'J') as $col) { $sheet->getColumnDimension($col)->setAutoSize(true); }

            // ══ Purchases ══
            } elseif ($type === 'purchases') {
                $sheet->setTitle('تقرير المشتريات');
                $sheet->mergeCells('A1:J1');
                $sheet->setCellValue('A1', 'تقرير المشتريات');
                $sheet->getStyle('A1')->applyFromArray($titleStyle);
                $sheet->mergeCells('A2:J2');
                $sheet->setCellValue('A2', 'الفترة: ' . $from . ' — ' . $to);

                $headers = ['رقم الطلب', 'المورد', 'التاريخ', 'الحالة', 'المنتج', 'المخزن', 'الكمية', 'سعر التكلفة', 'الضريبة', 'الإجمالي'];
                $cols    = ['A','B','C','D','E','F','G','H','I','J'];
                foreach ($headers as $i => $h) { $sheet->setCellValue($cols[$i] . '4', $h); }
                $sheet->getStyle('A4:J4')->applyFromArray($headerStyle);

                $purchases = $data['purchases'] ?? [];
                $row = 5;
                foreach ($purchases as $purchase) {
                    $items = $purchase['items'] ?? [];
                    if (empty($items)) {
                        $sheet->setCellValue("A{$row}", $purchase['reference']     ?? '');
                        $sheet->setCellValue("B{$row}", $purchase['supplier_name'] ?? '—');
                        $sheet->setCellValue("C{$row}", $purchase['created_at']    ?? '');
                        $sheet->setCellValue("D{$row}", $purchase['status']        ?? '');
                        $sheet->setCellValue("E{$row}", '—');
                        $sheet->setCellValue("F{$row}", '—');
                        $sheet->setCellValue("G{$row}", '—');
                        $sheet->setCellValue("H{$row}", '—');
                        $sheet->setCellValue("I{$row}", (float) ($purchase['tax']   ?? 0));
                        $sheet->setCellValue("J{$row}", (float) ($purchase['total'] ?? 0));
                        $row++;
                    } else {
                        foreach ($items as $item) {
                            $sheet->setCellValue("A{$row}", $purchase['reference']     ?? '');
                            $sheet->setCellValue("B{$row}", $purchase['supplier_name'] ?? '—');
                            $sheet->setCellValue("C{$row}", $purchase['created_at']    ?? '');
                            $sheet->setCellValue("D{$row}", $purchase['status']        ?? '');
                            $sheet->setCellValue("E{$row}", $item['product_name']      ?? '—');
                            $sheet->setCellValue("F{$row}", $item['warehouse_name']    ?? '—');
                            $sheet->setCellValue("G{$row}", (float) ($item['quantity']   ?? 0));
                            $sheet->setCellValue("H{$row}", (float) ($item['unit_price'] ?? 0));
                            $sheet->setCellValue("I{$row}", (float) ($purchase['tax']    ?? 0));
                            $sheet->setCellValue("J{$row}", (float) ($item['total']      ?? 0));
                            $row++;
                        }
                    }
                }
                $summary  = $data['summary'] ?? [];
                $totalRow = $row + 1;
                $sheet->setCellValue("A{$totalRow}", 'الإجمالي الكلي');
                $sheet->setCellValue("J{$totalRow}", (float) ($summary['total_cost'] ?? 0));
                $sheet->getStyle("A{$totalRow}:J{$totalRow}")->applyFromArray($totalStyle);
                foreach (range('A', 'J') as $col) { $sheet->getColumnDimension($col)->setAutoSize(true); }

            // ══ Profits ══
            } else {
                $sheet->setTitle('تقرير الأرباح');
                $sheet->mergeCells('A1:B1');
                $sheet->setCellValue('A1', 'تقرير الأرباح');
                $sheet->getStyle('A1')->applyFromArray($titleStyle);
                $sheet->setCellValue('A2', 'الفترة:');
                $sheet->setCellValue('B2', $from . ' — ' . $to);
                $rows = [
                    ['إجمالي المبيعات',  $data['total_sales']     ?? 0],
                    ['إجمالي المشتريات', $data['total_purchases'] ?? 0],
                    ['إجمالي الربح',     $data['gross_profit']    ?? 0],
                ];
                $r = 4;
                foreach ($rows as [$label, $value]) {
                    $sheet->setCellValue("A{$r}", $label);
                    $sheet->setCellValue("B{$r}", (float) $value);
                    $r++;
                }
                $sheet->getStyle('A4:B' . ($r - 1))->applyFromArray($headerStyle);
                $sheet->getColumnDimension('A')->setAutoSize(true);
                $sheet->getColumnDimension('B')->setAutoSize(true);
            }

            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $tmp    = tempnam(sys_get_temp_dir(), 'report') . '.xlsx';
            $writer->save($tmp);
            return response()->download($tmp, $filename . '.xlsx', [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend();
        }

        if ($format === 'pdf' && class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.export', compact('type', 'data', 'from', 'to'));
            return $pdf->download($filename . '.pdf');
        }

        return response()->json(['type' => $type, 'format' => $format, 'data' => $data])
            ->header('Content-Disposition', "attachment; filename=\"{$filename}.json\"");
    }
}