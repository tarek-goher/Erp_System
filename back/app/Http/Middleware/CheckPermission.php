<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// ══════════════════════════════════════════
// CheckPermission Middleware
// بيتحقق من صلاحيات المستخدم قبل ما يدخل أي route
// الاستخدام في routes/api.php:
//   Route::middleware('permission:manage-users')->group(...)
// ══════════════════════════════════════════
class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        // لو مفيش user أصلاً (مش المفروض يحصل مع sanctum لكن للأمان)
        if (! $user) {
            return response()->json([
                'message' => 'غير مصرح. سجّل دخولك أولاً.',
            ], 401);
        }

        // Super Admin عنده كل الصلاحيات - مش محتاج نتحقق
        if ($user->hasRole('super-admin')) {
            return $next($request);
        }

        // التحقق من الصلاحية المطلوبة
        if (! $user->hasPermissionTo($permission)) {
            return response()->json([
                'message'    => 'ليس لديك صلاحية للوصول لهذا المورد.',
                'permission' => $permission,
            ], 403);
        }

        return $next($request);
    }
}
