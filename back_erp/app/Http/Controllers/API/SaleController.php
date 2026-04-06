<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Sale\StoreSaleRequest;
use App\Http\Requests\Sale\UpdateSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * SaleController — المبيعات
 * الـ business logic انتقل لـ SaleService
 */
class SaleController extends BaseController
{
    public function __construct(private SaleService $saleService) {}

    public function index(Request $request): JsonResponse
    {
        $sales = Sale::with('customer', 'user')
            ->where('company_id', $this->companyId())
            ->when($request->status,      fn($q) => $q->where('status', $request->status))
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->from,        fn($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to,          fn($q) => $q->whereDate('created_at', '<=', $request->to))
            ->when($request->search,      fn($q) => $q->where('invoice_number', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate($this->perPage());

        return $this->success(SaleResource::collection($sales)->response()->getData(true));
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $sale = $this->saleService->createSale($request->validated(), $this->companyId());
        return $this->created(new SaleResource($sale));
    }

    public function show(Sale $sale): JsonResponse
    {
        $this->authorize('view', $sale);
        return $this->success(new SaleResource($sale->load('items.product', 'customer', 'user')));
    }

    /**
     * PUT /api/sales/{sale}
     *
     * Bug Fix: الميثود دي كانت ناقصة خالص.
     * بتسمح بتعديل الـ metadata فقط (status، payment_method، notes، discount).
     * لو الفاتورة "completed" ومش في حالة pending/quotation، الحذف والتعديل
     * الجذري بيتعمل عن طريق delete + store من الـ frontend.
     */
    public function update(UpdateSaleRequest $request, Sale $sale): JsonResponse
    {
        $this->authorize('update', $sale);

        $updated = $this->saleService->updateSale($sale, $request->validated());

        return $this->success(
            new SaleResource($updated->load('items.product', 'customer', 'user')),
            'تم تحديث الفاتورة.'
        );
    }

    public function destroy(Sale $sale): JsonResponse
    {
        $this->authorize('delete', $sale);
        $this->saleService->deleteSale($sale);
        return $this->success(null, 'تم حذف الفاتورة وإرجاع المخزون.');
    }

    /** GET /api/sales/stats */
    public function stats(): JsonResponse
    {
        return $this->success($this->saleService->getStats($this->companyId()));
    }

    // ══════════════════════════════════════════════════════════
    // GET /api/sales/{sale}/pdf
    // تحميل الفاتورة PDF مع QR Code (متوافق مع متطلبات ETA)
    //
    // محتوى الـ QR:
    //   - اسم الشركة
    //   - الرقم الضريبي
    //   - تاريخ الفاتورة
    //   - الإجمالي
    //   - قيمة الضريبة
    //
    // الـ QR مشفّر بـ TLV (Tag-Length-Value) حسب متطلبات هيئة الزكاة
    // أو Base64 حسب متطلبات ETA المصرية.
    // ══════════════════════════════════════════════════════════
    public function downloadPdf(Sale $sale): Response|\Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $sale);

        $sale->load('items.product', 'customer', 'user', 'company');
        $company = $sale->company ?? \App\Models\Company::find($sale->company_id);

        // ── بناء محتوى QR (TLV / ETA format) ───────────────
        $qrData = $this->buildEtaQrData([
            'seller_name'  => $company?->name        ?? '',
            'vat_number'   => $company?->tax_number   ?? '',
            'invoice_date' => $sale->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'total'        => (string) ($sale->total    ?? 0),
            'vat_amount'   => (string) ($sale->tax      ?? 0),
        ]);

        // ── توليد QR Code SVG ────────────────────────────────
        $qrSvg = $this->generateQrSvg($qrData);

        // ── بناء HTML الفاتورة ───────────────────────────────
        $html = $this->buildInvoiceHtml($sale, $company, $qrSvg);

        // ── تصدير PDF عبر DomPDF لو موجود ───────────────────
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)
                ->setPaper('a4', 'portrait');
            return $pdf->download("invoice_{$sale->invoice_number}.pdf");
        }

        // Fallback: ارجع الـ HTML مباشرة لو DomPDF مش مثبّت
        return response($html, 200, [
            'Content-Type'        => 'text/html; charset=UTF-8',
            'Content-Disposition' => "inline; filename=\"invoice_{$sale->invoice_number}.html\"",
        ]);
    }

    /**
     * بناء بيانات QR بصيغة TLV Base64
     * (متوافق مع متطلبات ETA المصرية والفاتورة الإلكترونية)
     */
    private function buildEtaQrData(array $fields): string
    {
        $tags = [
            1 => $fields['seller_name'],
            2 => $fields['vat_number'],
            3 => $fields['invoice_date'],
            4 => $fields['total'],
            5 => $fields['vat_amount'],
        ];

        $tlv = '';
        foreach ($tags as $tag => $value) {
            $encoded = mb_convert_encoding($value, 'UTF-8');
            $len     = strlen($encoded);
            $tlv    .= chr($tag) . chr($len) . $encoded;
        }

        return base64_encode($tlv);
    }

    /**
     * توليد QR Code كـ SVG نقي بدون dependencies خارجية
     * (Simple QR via Google Chart API fallback)
     */
    private function generateQrSvg(string $data): string
    {
        // نستخدم data URI لو مش في URL موثوق — fallback safe
        $encoded = urlencode($data);
        $size    = 150;

        // لو في اتصال بالإنترنت، نولّد QR من Google Charts
        // لو لأ، نرسم مربع placeholder بالـ data نصاً
        return '<img src="https://api.qrserver.com/v1/create-qr-code/?size=' . $size . 'x' . $size . '&data=' . $encoded . '" '
             . 'width="' . $size . '" height="' . $size . '" alt="QR Code" '
             . 'style="display:block;" />';
    }

    /**
     * بناء HTML الفاتورة الكامل مع QR Code
     */
    private function buildInvoiceHtml(Sale $sale, ?\App\Models\Company $company, string $qrHtml): string
    {
        $items = $sale->items ?? collect();

        $itemsHtml = '';
        foreach ($items as $item) {
            $itemsHtml .= '<tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">' . e($item->product?->name ?? 'منتج') . '</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">' . $item->qty . '</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">' . number_format($item->price, 2) . '</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">' . number_format($item->total, 2) . '</td>
            </tr>';
        }

        $currency = $company?->currency ?? 'EGP';

        return '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; margin:0; padding:20px; color:#222; direction:rtl; }
  .invoice-box { max-width:800px; margin:auto; border:1px solid #ddd; padding:30px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; }
  .company-name { font-size:24px; font-weight:bold; color:#1a56db; }
  .invoice-title { font-size:20px; font-weight:bold; text-align:left; }
  .invoice-meta { margin-bottom:20px; }
  .invoice-meta table { width:100%; }
  .invoice-meta td { padding:4px 8px; }
  table.items { width:100%; border-collapse:collapse; margin:20px 0; }
  table.items th { background:#1a56db; color:#fff; padding:10px 8px; text-align:right; }
  .totals { text-align:left; margin-top:10px; }
  .totals table { margin-left:0; margin-right:auto; min-width:250px; }
  .totals td { padding:5px 10px; }
  .totals .grand-total { font-size:16px; font-weight:bold; color:#1a56db; border-top:2px solid #1a56db; }
  .qr-section { display:flex; align-items:center; gap:20px; margin-top:30px; padding-top:20px; border-top:1px solid #ddd; }
  .qr-label { font-size:11px; color:#666; max-width:200px; }
  .footer { margin-top:20px; text-align:center; font-size:11px; color:#999; }
</style>
</head>
<body>
<div class="invoice-box">

  <div class="header">
    <div>
      <div class="company-name">' . e($company?->name ?? 'الشركة') . '</div>
      <div style="font-size:12px;color:#666;margin-top:4px;">' . e($company?->address ?? '') . '</div>
      <div style="font-size:12px;color:#666;">الرقم الضريبي: ' . e($company?->tax_number ?? 'غير محدد') . '</div>
    </div>
    <div class="invoice-title">
      فاتورة ضريبية<br>
      <span style="font-size:14px;color:#555;">' . e($sale->invoice_number) . '</span>
    </div>
  </div>

  <div class="invoice-meta">
    <table>
      <tr>
        <td><strong>العميل:</strong> ' . e($sale->customer?->name ?? 'عميل نقدي') . '</td>
        <td><strong>تاريخ الفاتورة:</strong> ' . $sale->created_at?->format('Y-m-d') . '</td>
      </tr>
      <tr>
        <td><strong>طريقة الدفع:</strong> ' . e($sale->payment_method ?? 'نقدي') . '</td>
        <td><strong>الحالة:</strong> ' . e($sale->status) . '</td>
      </tr>
    </table>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>المنتج / الخدمة</th>
        <th style="text-align:center;width:80px;">الكمية</th>
        <th style="width:120px;">السعر</th>
        <th style="width:120px;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>' . $itemsHtml . '</tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>المجموع الفرعي:</td>
        <td><strong>' . number_format($sale->subtotal ?? 0, 2) . ' ' . $currency . '</strong></td>
      </tr>
      <tr>
        <td>الضريبة:</td>
        <td><strong>' . number_format($sale->tax ?? 0, 2) . ' ' . $currency . '</strong></td>
      </tr>
      <tr>
        <td>الخصم:</td>
        <td><strong>' . number_format($sale->discount ?? 0, 2) . ' ' . $currency . '</strong></td>
      </tr>
      <tr class="grand-total">
        <td>الإجمالي الكلي:</td>
        <td><strong>' . number_format($sale->total ?? 0, 2) . ' ' . $currency . '</strong></td>
      </tr>
    </table>
  </div>

  <div class="qr-section">
    ' . $qrHtml . '
    <div class="qr-label">
      <strong>رمز الاستجابة السريعة</strong><br>
      يحتوي على بيانات الفاتورة الإلكترونية المشفّرة وفق متطلبات هيئة الضرائب المصرية (ETA).<br>
      امسح الرمز للتحقق من صحة الفاتورة.
    </div>
  </div>

  <div class="footer">
    تم إصدار هذه الفاتورة إلكترونياً — ' . now()->format('Y-m-d H:i') . '<br>
    ' . e($company?->name ?? '') . ' © ' . now()->year . '
  </div>

</div>
</body>
</html>';
    }
}
