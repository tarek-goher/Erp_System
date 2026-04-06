<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * MultiTenantManager — طبقة العزل بين الشركات
 * ───────────────────────────────────────────
 * دلوقتي: Shared DB + company_id (الوضع الحالي)
 * المستقبل: لما تكبر فوق 2000 شركة نشطة، ممكن تحوّل
 *           شركات معينة لـ DB منفصل من غير ما تغير الكود
 *
 * الاستخدام:
 *   MultiTenantManager::forCompany(5, function() {
 *       return Sale::all(); // هيشتغل على الـ DB الصح تلقائياً
 *   });
 *
 * أو في Middleware:
 *   MultiTenantManager::boot($company);
 */
class MultiTenantManager
{
    /**
     * تحديد الـ DB connection للشركة دي
     * دلوقتي: كلهم على نفس الـ connection (shared)
     * مستقبلاً: ممكن كل شركة يبقى عندها connection منفصل
     */
    public static function boot(Company $company): void
    {
        // لو الشركة عندها DB منفصل في الـ settings — استخدمه
        $dbConfig = $company->settings['db_connection'] ?? null;

        if ($dbConfig && config("database.connections.{$dbConfig}")) {
            // شركة عندها dedicated DB
            config(['database.default' => $dbConfig]);
            DB::setDefaultConnection($dbConfig);
        }
        // لو مفيش — يفضل على الـ shared DB العادي
    }

    /**
     * نفّذ callback على الـ DB الخاص بشركة معينة
     * بيرجّع الـ default connection بعد ما يخلص
     */
    public static function forCompany(int|Company $company, callable $callback): mixed
    {
        $company = $company instanceof Company
            ? $company
            : Company::find($company);

        if (! $company) {
            return $callback();
        }

        $originalConnection = config('database.default');

        try {
            static::boot($company);
            return $callback();
        } finally {
            // رجّع الـ connection الأصلي في كل الأحوال
            config(['database.default' => $originalConnection]);
            DB::setDefaultConnection($originalConnection);
        }
    }

    /**
     * إنشاء DB جديد لشركة (للمستقبل لما تعمل dedicated DBs)
     * مش بيتنفذ دلوقتي — جاهز للتوسع
     */
    public static function provisionDatabase(Company $company): bool
    {
        // TODO: لما تقرر تعمل DB-per-tenant
        // 1. إنشاء DB جديد
        // 2. تشغيل الـ migrations عليه
        // 3. حفظ الـ connection name في company->settings
        // 4. ترحيل بيانات الشركة من الـ shared DB
        return false;
    }

    /**
     * الـ connection name الخاص بشركة
     */
    public static function connectionFor(Company $company): string
    {
        return $company->settings['db_connection']
            ?? config('database.default');
    }

    /**
     * هل الشركة دي على dedicated DB؟
     */
    public static function hasDedicatedDb(Company $company): bool
    {
        return isset($company->settings['db_connection']);
    }
}
