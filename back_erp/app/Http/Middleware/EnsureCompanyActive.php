<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureCompanyActive
 * ───────────────────
 * يرفض الطلبات في حالتين:
 *   1. الشركة suspended
 *   2. الاشتراك منتهي
 *
 * Fix #1: كان بيستخدم subscription_ends_at لكن الـ Company model
 *         عنده الحقل باسم subscription_expires_at في $fillable و$casts.
 *         النتيجة كانت إن الفحص مبيشتغلش أبداً (null دايماً).
 */
class EnsureCompanyActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check() && ! auth()->user()->is_super_admin) {
            $company = auth()->user()->company;

            if (! $company) {
                return response()->json([
                    'message' => 'No company associated with your account.',
                ], 403);
            }

            // 1. الشركة معلّقة
            if ($company->status === 'suspended') {
                return response()->json([
                    'message' => 'Your company account has been suspended. Please contact support.',
                    'reason'  => 'suspended',
                ], 403);
            }

            // 2. الاشتراك منتهي
            // Fix: كان subscription_ends_at (غير موجود) → الصح subscription_expires_at
            if (
                $company->subscription_expires_at !== null &&
                $company->subscription_expires_at->isPast()
            ) {
                return response()->json([
                    'message'    => 'Your subscription has expired. Please renew to continue.',
                    'reason'     => 'subscription_expired',
                    'expired_at' => $company->subscription_expires_at->toDateTimeString(),
                ], 402);
            }
        }

        return $next($request);
    }
}
