<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckSuperAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->user() || ! $request->user()->is_super_admin) {
            return response()->json(['message' => 'غير مصرح. هذا القسم للمسئولين فقط.'], 403);
        }

        return $next($request);
    }
}
