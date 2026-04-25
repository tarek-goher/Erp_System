<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// ══════════════════════════════════════════════════════════
// EnsureCompanyTenant Middleware
// ══════════════════════════════════════════════════════════
// بيتأكد إن كل user عنده company_id صحيح قبل ما يكمل
// يحمي من الحالات النادرة زي:
//   - user اتعمله company_id = null في الـ DB
//   - super admin بيعمل عملية بدون company context
//
// الاستخدام في routes/api.php:
//   Route::middleware(['auth:sanctum', 'company.tenant'])->group(...)
//
// Super Admin معفي تلقائياً — بيعدي بدون check
// ══════════════════════════════════════════════════════════
class EnsureCompanyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Super Admin معندوش قيود على الـ company
        if ($user && $user->is_super_admin) {
            return $next($request);
        }

        // لو User مفيش عنده company_id → ارفض الطلب
        if (! $user || ! $user->company_id) {
            return response()->json([
                'message' => 'حسابك غير مرتبط بشركة. تواصل مع المسؤول.',
            ], 403);
        }

        return $next($request);
    }
}
