<?php

use App\Exceptions\InsufficientStockException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
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
            'auth'               => \App\Http\Middleware\Authenticate::class,
            'permission'         => \App\Http\Middleware\CheckPermission::class,
            'super.admin'        => \App\Http\Middleware\CheckSuperAdmin::class,
            'check.super.admin'  => \App\Http\Middleware\CheckSuperAdmin::class,
            'company.tenant'     => \App\Http\Middleware\EnsureCompanyTenant::class,
            'audit.log'          => \App\Http\Middleware\AuditLog::class,
            'ip.whitelist'       => \App\Http\Middleware\IpWhitelist::class,
            'company.active'     => \App\Http\Middleware\EnsureCompanyActive::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->reportable(function (\Throwable $e) {
            if (app()->bound('sentry') && config('sentry.dsn')) {
                app('sentry')->captureException($e);
            }
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => '?????? ??? ?????.',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => '??? ????. ???? ????? ?????.',
                ], 401);
            }
        });

        $exceptions->render(function (InsufficientStockException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message'   => $e->getMessage(),
                    'error'     => $e->getMessage(),
                    'type'      => 'insufficient_stock',
                    'available' => $e->available,
                    'requested' => $e->requested,
                ], 422);
            }
        });

        $exceptions->render(function (\Throwable $e, Request $request) {
            if (($request->expectsJson() || $request->is('api/*'))
                && !($e instanceof ValidationException)
                && !($e instanceof AuthenticationException)
                && !($e instanceof InsufficientStockException)) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                $msg = $status < 500 ? $e->getMessage() : '??? ??? ?????. ???? ???????? ??? ????.';

                return response()->json([
                    'message' => $msg,
                    'error'   => app()->isLocal() ? $e->getMessage() : null,
                ], $status);
            }
        });

    })->create();
