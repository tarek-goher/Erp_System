<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

/**
 * BaseController — نقطة أساسية لكل controllers
 * بيوفر helper methods لتوحيد شكل الـ API responses
 */
abstract class BaseController extends Controller
{
    /** رد ناجح */
    protected function success($data = null, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $code);
    }

    /** رد بعد إنشاء سجل */
    protected function created($data = null, string $message = 'Created successfully'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    /** رد خطأ */
    protected function error(string $message = 'Error', int $code = 400, $errors = null): JsonResponse
    {
        $response = ['success' => false, 'message' => $message];
        if ($errors) {
            $response['errors'] = $errors;
        }
        return response()->json($response, $code);
    }

    /** رد غير موجود */
    protected function notFound(string $message = 'Record not found'): JsonResponse
    {
        return $this->error($message, 404);
    }

    /** Company ID للمستخدم الحالي */
    protected function companyId(): ?int
    {
        return auth()->user()?->company_id;
    }

    /** pagination افتراضي */
    protected function perPage(int $default = 15): int
    {
        return min((int) request('per_page', $default), 100);
    }
}
