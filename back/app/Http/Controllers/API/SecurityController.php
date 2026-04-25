<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * SecurityController — إدارة الأمان وجلسات المستخدم
 *
 * Fix #7: addIp — Bug في قراءة الـ IP
 *  - كان: $ip = $request->ip_address ?? $request->ip
 *    - الحقل المطلوب في validation هو 'ip' مش 'ip_address'
 *    - $request->ip هي property مش موجودة (ip() هي method)
 *    - النتيجة: الـ IP المحفوظ كان null
 *  - الحل: $request->input('ip') يقرأ حقل 'ip' من الـ request body صح
 */
class SecurityController extends BaseController
{
    private function cacheKey(): string
    {
        return "ip_whitelist:{$this->companyId()}";
    }

    /** GET /api/security/ip-whitelist */
    public function ipWhitelist(): JsonResponse
    {
        $enabled = config('app.ip_whitelist_enabled', false);
        $ips     = Cache::get($this->cacheKey(), []);

        return $this->success([
            'enabled' => $enabled,
            'ips'     => array_values($ips),
        ]);
    }

    /** POST /api/security/ip-whitelist — إضافة IP */
    public function addIp(Request $request): JsonResponse
    {
        $request->validate([
            'ip'    => 'required|ip',
            'label' => 'nullable|string|max:100',
        ]);

        $ips = Cache::get($this->cacheKey(), []);

        // Fix #7: استخدام $request->input('ip') للقراءة الصحيحة من الـ request body
        // كان: $request->ip_address ?? $request->ip
        //   - ip_address غير موجود في validation
        //   - $request->ip هي property وليست method، قيمتها null دايماً
        $ip = $request->input('ip');

        if (in_array($ip, array_column($ips, 'ip'))) {
            return $this->error('هذا الـ IP مضاف بالفعل.', 409);
        }

        $ips[] = [
            'ip'       => $ip,
            'label'    => $request->input('label', ''),
            'added_at' => now()->toDateTimeString(),
            'added_by' => auth()->user()->name,
        ];

        Cache::forever($this->cacheKey(), $ips);

        return $this->success($ips, 'تم إضافة الـ IP بنجاح.');
    }

    /** DELETE /api/security/ip-whitelist/{ip} — حذف IP */
    public function removeIp(string $ip): JsonResponse
    {
        $ips      = Cache::get($this->cacheKey(), []);
        $filtered = array_filter($ips, fn($item) => $item['ip'] !== $ip);

        Cache::forever($this->cacheKey(), array_values($filtered));

        return $this->success(array_values($filtered), 'تم حذف الـ IP.');
    }

    /** GET /api/security/sessions — الجلسات النشطة */
    public function sessions(): JsonResponse
    {
        $tokens = auth()->user()
            ->tokens()
            ->latest()
            ->get(['id', 'name', 'last_used_at', 'created_at'])
            ->map(fn($t) => [
                'id'           => $t->id,
                'name'         => $t->name,
                'last_used_at' => $t->last_used_at?->diffForHumans(),
                'created_at'   => $t->created_at->toDateTimeString(),
                'is_current'   => $t->id === auth()->user()->currentAccessToken()->id,
            ]);

        return $this->success($tokens);
    }

    /** DELETE /api/security/sessions/{tokenId} — إلغاء جلسة */
    public function revokeSession(string $tokenId): JsonResponse
    {
        auth()->user()->tokens()->where('id', $tokenId)->delete();
        return $this->success(null, 'تم إلغاء الجلسة.');
    }

    /** DELETE /api/security/sessions — إلغاء كل الجلسات ما عدا الحالية */
    public function revokeAllSessions(): JsonResponse
    {
        $currentId = auth()->user()->currentAccessToken()->id;
        auth()->user()->tokens()->where('id', '!=', $currentId)->delete();
        return $this->success(null, 'تم إلغاء كل الجلسات الأخرى.');
    }
}
