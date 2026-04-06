<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

// ══════════════════════════════════════════════════════════
// CacheService — إدارة الـ Cache بشكل مركزي
// ══════════════════════════════════════════════════════════
// بدل ما كل controller يكتب Cache::remember بشكل مختلف
// هنا بنوحّد الـ keys والـ TTL والـ invalidation
//
// الاستخدام:
//   // جلب البيانات (بيتحفظ تلقائي):
//   $products = CacheService::remember(
//       CacheService::key('products', $companyId),
//       fn() => Product::where('company_id', $companyId)->get()
//   );
//
//   // مسح الـ cache لما تتغير البيانات:
//   CacheService::forget('products', $companyId);
//
// TTL الافتراضي: 5 دقايق (300 ثانية)
// ══════════════════════════════════════════════════════════
class CacheService
{
    // مدة الـ cache الافتراضية (بالثواني)
    private const DEFAULT_TTL = 300;  // 5 دقايق

    // مدة خاصة لكل نوع بيانات
    private const TTL_MAP = [
        'products'   => 300,   // 5 دقايق — بتتغير من وقت للتاني
        'categories' => 600,   // 10 دقايق — بتتغير أقل
        'customers'  => 300,
        'suppliers'  => 300,
        'employees'  => 600,
        'accounts'   => 600,   // chart of accounts مش بتتغير كتير
        'currencies' => 1800,  // 30 دقيقة — نادراً بتتغير
        'tax_rates'  => 1800,
        'warehouses' => 600,
        'reports'    => 180,   // 3 دقايق — بيانات حية
        'dashboard'  => 120,   // دقيقتين — محتاج تحديث متكرر
    ];

    // ─── بناء مفتاح الـ cache ──────────────────────────────
    public static function key(string $type, int|null $companyId, string $extra = ''): string
    {
        $cid  = $companyId ?? 0;   // لو null نستخدم 0 بدل crash
        $base = "erp:{$cid}:{$type}";
        return $extra ? "{$base}:{$extra}" : $base;
    }

    // ─── جلب أو تخزين ─────────────────────────────────────
    public static function remember(string $key, callable $callback, ?int $ttl = null): mixed
    {
        // استخرج نوع البيانات من الـ key عشان نحدد الـ TTL
        $type     = explode(':', $key)[2] ?? 'default';
        $duration = $ttl ?? (self::TTL_MAP[$type] ?? self::DEFAULT_TTL);

        return Cache::remember($key, $duration, $callback);
    }

    // ─── مسح cache نوع معين لشركة ─────────────────────────
    public static function forget(string $type, int|null $companyId, string $extra = ''): void
    {
        Cache::forget(self::key($type, $companyId, $extra));
    }

    // ─── مسح كل الـ cache الخاص بشركة معينة ───────────────
    // مفيد لما تعمل bulk update أو import
    public static function forgetAll(int|null $companyId): void
    {
        $types = array_keys(self::TTL_MAP);
        foreach ($types as $type) {
            Cache::forget(self::key($type, $companyId));
        }
    }
}
