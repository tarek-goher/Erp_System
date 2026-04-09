<?php

namespace App\Http\Controllers\API;

use App\Models\TaxRate as Tax;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * TaxController — إدارة الضرائب + VAT Returns
 *
 * Bug Fix: index() كانت بتستخدم Tax::all() — security issue.
 * الحل: فلترة company_id في كل العمليات + authorization.
 *
 * جديد: endpoints لـ VAT report + tax periods.
 */
class TaxController extends BaseController
{
    /** GET /api/taxes — ضرائب الشركة الحالية فقط */
    public function index(): JsonResponse
    {
        $taxes = Tax::where('company_id', $this->companyId())
            ->orderBy('name')
            ->get();

        return $this->success($taxes);
    }

    /** GET /api/taxes/active — الضرائب الفعّالة فقط (للـ dropdowns) */
    public function active(): JsonResponse
    {
        $taxes = Tax::where('company_id', $this->companyId())
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success($taxes);
    }

    /** POST /api/taxes */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:100',
            'rate'      => 'required|numeric|min:0|max:100',
            'type'      => 'nullable|in:inclusive,exclusive',
            'is_active' => 'nullable|boolean',
        ]);

        $tax = Tax::create([
            'company_id' => $this->companyId(),
            ...$data,
        ]);

        return $this->created($tax);
    }

    /** PUT /api/taxes/{tax} */
    public function update(Request $request, Tax $tax): JsonResponse
    {
        abort_if($tax->company_id !== $this->companyId(), 403, 'Unauthorized');

        $data = $request->validate([
            'name'      => 'sometimes|required|string|max:100',
            'rate'      => 'sometimes|required|numeric|min:0|max:100',
            'type'      => 'nullable|in:inclusive,exclusive',
            'is_active' => 'nullable|boolean',
        ]);

        $tax->update($data);

        return $this->success($tax, 'تم تحديث الضريبة.');
    }

    /** DELETE /api/taxes/{tax} */
    public function destroy(Tax $tax): JsonResponse
    {
        abort_if($tax->company_id !== $this->companyId(), 403, 'Unauthorized');
        $tax->delete();

        return $this->success(null, 'تم حذف الضريبة.');
    }

    /**
     * GET /api/taxes/vat-report?from=2024-01-01&to=2024-03-31
     *
     * تقرير ضريبة القيمة المضافة (VAT Return) للفترة المحددة.
     * يجمع:
     *  - المبيعات + ضريبة المخرجات (output VAT)
     *  - المشتريات + ضريبة المدخلات (input VAT)
     *  - صافي الضريبة المستحقة
     */
    public function vatReport(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        $companyId = $this->companyId();
        $from = $request->from;
        $to   = $request->to;

        // مبيعات الفترة
        $salesData = DB::table('sales')
            ->where('company_id', $companyId)
            ->where('status', 'completed')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->selectRaw('
                COUNT(*)         as count,
                SUM(subtotal)    as net_sales,
                SUM(tax)         as output_vat,
                SUM(total)       as gross_sales
            ')
            ->first();

        // مشتريات الفترة
        $purchasesData = DB::table('purchases')
            ->where('company_id', $companyId)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->selectRaw('
                COUNT(*)         as count,
                SUM(subtotal)    as net_purchases,
                SUM(tax)         as input_vat,
                SUM(total)       as gross_purchases
            ')
            ->first();

        $outputVat = (float) ($salesData->output_vat ?? 0);
        $inputVat  = (float) ($purchasesData->input_vat ?? 0);
        $netVat    = $outputVat - $inputVat;

        return $this->success([
            'period' => ['from' => $from, 'to' => $to],

            'sales' => [
                'count'      => (int)   ($salesData->count      ?? 0),
                'net_sales'  => (float) ($salesData->net_sales  ?? 0),
                'output_vat' => $outputVat,
                'gross'      => (float) ($salesData->gross_sales ?? 0),
            ],

            'purchases' => [
                'count'         => (int)   ($purchasesData->count          ?? 0),
                'net_purchases' => (float) ($purchasesData->net_purchases  ?? 0),
                'input_vat'     => $inputVat,
                'gross'         => (float) ($purchasesData->gross_purchases ?? 0),
            ],

            'summary' => [
                'output_vat'    => $outputVat,
                'input_vat'     => $inputVat,
                'net_vat_due'   => $netVat,      // موجب = مستحق الدفع
                'status'        => $netVat >= 0 ? 'payable' : 'refundable',
            ],
        ]);
    }

    /**
     * GET /api/taxes/periods
     * قائمة الأرباع المتاحة للـ VAT declaration (مثل Q1 2024).
     */
    public function periods(): JsonResponse
    {
        $periods = [];
        $now = now();

        for ($i = 0; $i < 8; $i++) {
            $date    = $now->copy()->subQuarters($i);
            $quarter = ceil($date->month / 3);
            $year    = $date->year;

            $from = $date->copy()->startOfQuarter()->toDateString();
            $to   = $date->copy()->endOfQuarter()->toDateString();

            $periods[] = [
                'label' => "Q{$quarter} {$year}",
                'from'  => $from,
                'to'    => $to,
            ];
        }

        return $this->success($periods);
    }
}
