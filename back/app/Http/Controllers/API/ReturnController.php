<?php

namespace App\Http\Controllers\API;

use App\Models\SaleReturn;
use App\Services\ReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ReturnController — إدارة مرتجعات المبيعات
 */
class ReturnController extends BaseController
{
    public function __construct(private ReturnService $returnService) {}

    /**
     * قبول مرتجع
     */
    public function acceptReturn(SaleReturn $return): JsonResponse
    {
        $this->authorize('update', $return);

        $return = $this->returnService->acceptReturn($return);

        return $this->success([
            'message' => 'تم قبول المرتجع بنجاح',
            'return' => $return
        ]);
    }

    /**
     * رفض مرتجع
     */
    public function rejectReturn(SaleReturn $return): JsonResponse
    {
        $this->authorize('update', $return);

        $this->returnService->rejectReturn($return);
        $return->refresh();

        return $this->success([
            'message' => 'تم رفض المرتجع بنجاح',
            'return' => $return
        ]);
    }
}
