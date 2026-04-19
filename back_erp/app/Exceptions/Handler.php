<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Handler — معالجة مركزية لكل الأخطاء
 * بيرجع JSON responses منظمة بدل HTML pages
 */
class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // يمكن ربطه بـ Sentry أو Bugsnag هنا
        });
    }

    public function render($request, Throwable $e): JsonResponse|\Illuminate\Http\Response|\Symfony\Component\HttpFoundation\Response
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->renderJsonException($e);
        }

        return parent::render($request, $e);
    }

    private function renderJsonException(Throwable $e): JsonResponse
    {
        // ── Validation Errors ─────────────────────────
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة.',
                'errors'  => $e->errors(),
            ], 422);
        }

        // ── Authentication ────────────────────────────
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح. يرجى تسجيل الدخول.',
            ], 401);
        }

        // ── Model Not Found ───────────────────────────
        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel());
            return response()->json([
                'success' => false,
                'message' => "العنصر المطلوب غير موجود ({$model}).",
            ], 404);
        }

        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'المسار غير موجود.',
            ], 404);
        }

        // ── HTTP Exceptions ───────────────────────────
        if ($e instanceof HttpException) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'خطأ في الطلب.',
            ], $e->getStatusCode());
        }

        // ── Insufficient Stock ────────────────────────
        if ($e instanceof \App\Exceptions\InsufficientStockException) {
            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
                'type'    => 'insufficient_stock',
            ], 422);
        }

        // ── Generic Server Error ──────────────────────
        $debug = config('app.debug');

        return response()->json([
            'success' => false,
            'message' => $debug ? $e->getMessage() : 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
            'trace'   => $debug ? collect(explode("\n", $e->getTraceAsString()))->take(10) : null,
        ], 500);
    }
}