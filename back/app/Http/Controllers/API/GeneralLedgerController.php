<?php

namespace App\Http\Controllers\API;

use App\Services\GeneralLedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeneralLedgerController extends BaseController
{
    protected $glService;

    public function __construct(GeneralLedgerService $glService)
    {
        $this->glService = $glService;
    }

    /**
     * GET /general-ledger
     * جيب دفتر الأستاذ الكامل
     * Optional Filters: from_date, to_date, account_type, format (full/summary)
     */
    public function index(Request $request): JsonResponse
    {
        $fromDate = $request->from_date ? \Carbon\Carbon::parse($request->from_date) : null;
        $toDate   = $request->to_date   ? \Carbon\Carbon::parse($request->to_date)   : null;
        $type     = $request->account_type; // asset, liability, etc.
        $format   = $request->format ?? 'summary'; // full or summary

        try {
            if ($format === 'full') {
                // كل الـ lines التفصيلية
                $data = $this->glService->getAllLedgers($fromDate, $toDate, $type);
            } else {
                // ملخص فقط بدون lines
                $data = $this->glService->getLedgerSummary($fromDate, $toDate);
            }

            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error('Failed to fetch general ledger: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /general-ledger/{accountId}
     * جيب دفتر الأستاذ لحساب معين
     */
    public function show(Request $request, $accountId): JsonResponse
    {
        $fromDate = $request->from_date ? \Carbon\Carbon::parse($request->from_date) : null;
        $toDate   = $request->to_date   ? \Carbon\Carbon::parse($request->to_date)   : null;

        try {
            $data = $this->glService->getAccountLedger($accountId, $fromDate, $toDate);
            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error('Failed to fetch account ledger: ' . $e->getMessage(), 500);
        }
    }
}