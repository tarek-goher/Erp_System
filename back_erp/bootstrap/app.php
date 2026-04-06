<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            \Laravel\Horizon\Horizon::auth(function ($request) {
                return $request->user() && $request->user()->hasRole('super_admin');
            });
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'permission'    => \App\Http\Middleware\CheckPermission::class,
            'super.admin'        => \App\Http\Middleware\CheckSuperAdmin::class,
            'check.super.admin'  => \App\Http\Middleware\CheckSuperAdmin::class,
            'company.tenant'=> \App\Http\Middleware\EnsureCompanyTenant::class,
            'audit.log'     => \App\Http\Middleware\AuditLog::class,
            'ip.whitelist'  => \App\Http\Middleware\IpWhitelist::class,
        ]);

        // ══════════════════════════════════════════════════════
        // CSRF Exception for API routes
        // الـ frontend بيستخدم Bearer Token مش cookies
        // لذلك نستثني كل routes الـ API من CSRF check
        // ══════════════════════════════════════════════════════
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // ══════════════════════════════════════════
        // Sentry Integration
        // بيرسل كل exception لـ Sentry تلقائياً
        // لو SENTRY_DSN موجود في الـ .env
        // ══════════════════════════════════════════
        $exceptions->reportable(function (\Throwable $e) {
            if (app()->bound('sentry') && config('sentry.dsn')) {
                app('sentry')->captureException($e);
            }
        });

        // ─── Validation Errors → 422 ──────────────
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'بيانات غير صحيحة.',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        // ─── Auth Errors → 401 ────────────────────
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'غير مصرح. سجّل دخولك أولاً.',
                ], 401);
            }
        });

        // ─── General Server Errors → 500 ──────────
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->expectsJson() && ! ($e instanceof ValidationException) && ! ($e instanceof AuthenticationException)) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                $msg    = $status < 500 ? $e->getMessage() : 'حدث خطأ داخلي. يرجى المحاولة مرة أخرى.';

                return response()->json([
                    'message' => $msg,
                    'error'   => app()->isLocal() ? $e->getMessage() : null,
                ], $status);
            }
        });

    })->create();
