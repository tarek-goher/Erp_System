<?php

namespace App\Http\Controllers\API\ETA;

use App\Http\Controllers\API\BaseController;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ETAController — تكامل منظومة الفاتورة الإلكترونية المصرية (ETA)
 *
 * Bug Fix #6: الـ folder كان موجود فاضي بدون أي controller
 * → بيرجع error لو حاولت تعمل route عليه.
 *
 * ملحوظة: الـ ETA integration الحقيقي يحتاج credentials من
 * هيئة الضرائب المصرية. الكود ده skeleton جاهز للتوصيل.
 *
 * API Endpoints:
 *   POST /api/eta/submit/{sale}     → إرسال فاتورة للمنظومة
 *   GET  /api/eta/status/{sale}     → استعلام حالة الفاتورة
 *   GET  /api/eta/documents         → قائمة المستندات المرسلة
 */
class ETAController extends BaseController
{
    private string $etaBaseUrl;
    private string $clientId;
    private string $clientSecret;

    public function __construct()
    {
        $this->etaBaseUrl   = config('services.eta.base_url',     'https://api.invoicing.eta.gov.eg/api/v1');
        $this->clientId     = config('services.eta.client_id',     '');
        $this->clientSecret = config('services.eta.client_secret', '');
    }

    /**
     * POST /api/eta/submit/{sale}
     * إرسال فاتورة البيع لمنظومة الفاتورة الإلكترونية
     */
    public function submit(Sale $sale): JsonResponse
    {
        abort_if($sale->company_id !== $this->companyId(), 403);
        abort_if(empty($this->clientId), 503, 'ETA integration غير مفعّل. يرجى إعداد بيانات الاتصال أولاً.');

        try {
            $token    = $this->getAccessToken();
            $document = $this->buildDocument($sale->load('items.product', 'customer'));

            $response = Http::withToken($token)
                ->post("{$this->etaBaseUrl}/documentsubmissions", [
                    'documents' => [$document],
                ]);

            if ($response->successful()) {
                $result = $response->json();
                Log::info("[ETA] Submitted sale #{$sale->id}", ['response' => $result]);

                // حفظ الـ submission UUID في الـ sale metadata
                $sale->update([
                    'notes' => ($sale->notes ? $sale->notes . "\n" : '')
                        . '[ETA] UUID: ' . ($result['submissionId'] ?? 'N/A'),
                ]);

                return $this->success([
                    'submission_id'  => $result['submissionId'] ?? null,
                    'accepted_count' => $result['acceptedDocuments'] ?? [],
                    'rejected_count' => $result['rejectedDocuments'] ?? [],
                ], 'تم إرسال الفاتورة لمنظومة ETA.');
            }

            Log::error("[ETA] Submit failed for sale #{$sale->id}", [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            return $this->error('فشل إرسال الفاتورة: ' . $response->body(), $response->status());
        } catch (\Throwable $e) {
            Log::error("[ETA] Exception: {$e->getMessage()}");
            return $this->error('خطأ في الاتصال بمنظومة ETA.', 500);
        }
    }

    /**
     * GET /api/eta/status/{sale}
     * استعلام حالة فاتورة مرسلة
     */
    public function status(Sale $sale): JsonResponse
    {
        abort_if($sale->company_id !== $this->companyId(), 403);
        abort_if(empty($this->clientId), 503, 'ETA integration غير مفعّل.');

        // استخرج الـ UUID من notes إذا كان متحفظ
        preg_match('/\[ETA\] UUID: ([^\n]+)/', $sale->notes ?? '', $matches);
        $uuid = $matches[1] ?? null;

        if (!$uuid || $uuid === 'N/A') {
            return $this->error('لم يتم إرسال هذه الفاتورة لمنظومة ETA بعد.', 404);
        }

        try {
            $token    = $this->getAccessToken();
            $response = Http::withToken($token)
                ->get("{$this->etaBaseUrl}/documents/{$uuid}/details");

            if ($response->successful()) {
                return $this->success($response->json());
            }

            return $this->error('تعذر الاستعلام عن الفاتورة.', $response->status());
        } catch (\Throwable $e) {
            return $this->error('خطأ في الاتصال بمنظومة ETA.', 500);
        }
    }

    /**
     * GET /api/eta/documents
     * قائمة المستندات المرسلة للمنظومة
     */
    public function documents(Request $request): JsonResponse
    {
        abort_if(empty($this->clientId), 503, 'ETA integration غير مفعّل.');

        try {
            $token    = $this->getAccessToken();
            $response = Http::withToken($token)
                ->get("{$this->etaBaseUrl}/documents/search", [
                    'pageSize' => $request->get('per_page', 20),
                    'pageNo'   => $request->get('page', 1),
                ]);

            if ($response->successful()) {
                return $this->success($response->json());
            }

            return $this->error('تعذر جلب المستندات.', $response->status());
        } catch (\Throwable $e) {
            return $this->error('خطأ في الاتصال بمنظومة ETA.', 500);
        }
    }

    // ── Private Helpers ──────────────────────────────────────

    private function getAccessToken(): string
    {
        $response = Http::asForm()->post(
            'https://id.eta.gov.eg/connect/token',
            [
                'grant_type'    => 'client_credentials',
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]
        );

        abort_if(!$response->successful(), 503, 'فشل الحصول على token من ETA.');

        return $response->json('access_token');
    }

    private function buildDocument(Sale $sale): array
    {
        $company = $sale->company ?? auth()->user()->company;

        return [
            'issuer' => [
                'type'    => 'B',
                'id'      => $company->tax_number ?? '',
                'name'    => $company->name,
                'address' => [
                    'branchID'    => '0',
                    'country'     => 'EG',
                    'governate'   => $company->governate ?? 'Cairo',
                    'regionCity'  => $company->city ?? 'Cairo',
                    'street'      => $company->address ?? '',
                    'buildingNumber' => '1',
                ],
            ],
            'receiver' => [
                'type'    => $sale->customer ? 'B' : 'P',
                'id'      => $sale->customer?->tax_number ?? '',
                'name'    => $sale->customer?->name ?? 'عميل نقدي',
                'address' => [
                    'country'    => 'EG',
                    'governate'  => 'Cairo',
                    'regionCity' => 'Cairo',
                    'street'     => $sale->customer?->address ?? '',
                    'buildingNumber' => '1',
                ],
            ],
            'documentType'    => 'I',
            'documentTypeVersion' => '1.0',
            'dateTimeIssued'  => $sale->created_at->toISOString(),
            'taxpayerActivityCode' => $company->activity_code ?? '4799',
            'internalID'      => $sale->invoice_number,
            'invoiceLines'    => $sale->items->map(fn($item) => [
                'description'   => $item->product?->name ?? 'منتج',
                'itemType'      => 'GS1',
                'itemCode'      => (string) ($item->product?->id ?? '0'),
                'unitType'      => 'EA',
                'quantity'      => (float) $item->quantity,
                'unitValue'     => ['currencySold' => 'EGP', 'amountEGP' => (float) $item->unit_price],
                'salesTotal'    => (float) ($item->quantity * $item->unit_price),
                'total'         => (float) $item->total,
                'taxableItems'  => [],
                'netTotal'      => (float) $item->total,
                'valueDifference' => 0,
                'totalTaxableFees' => 0,
                'itemsDiscount' => (float) $item->discount,
                'discount'      => ['rate' => 0, 'amount' => (float) $item->discount],
            ])->toArray(),
            'totalSalesAmount'    => (float) $sale->subtotal,
            'totalDiscountAmount' => (float) $sale->discount,
            'netAmount'           => (float) ($sale->subtotal - $sale->discount),
            'taxTotals'           => $sale->tax > 0 ? [
                ['taxType' => 'T1', 'amount' => (float) $sale->tax],
            ] : [],
            'totalAmount'         => (float) $sale->total,
            'extraDiscountAmount' => 0,
            'totalItemsDiscountAmount' => 0,
        ];
    }

    // protected function error(string $message, int $status = 400): JsonResponse
    // {
    //     return response()->json(['success' => false, 'message' => $message], $status);
    // }
}
