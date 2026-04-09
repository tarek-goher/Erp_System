<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * TenantManager — إدارة عزل البيانات بين الشركات (Tenants)
 *
 * ═══════════════════════════════════════════════════════════════
 * Gap #6 — توضيح معمارية العزل المُستخدمة فعلياً
 * ═══════════════════════════════════════════════════════════════
 *
 * هذا النظام يستخدم أسلوب "Single Database — company_id Column"
 * وهو الأسلوب الأبسط والأكثر استخداماً للمشاريع الصغيرة-المتوسطة:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  قاعدة بيانات واحدة                         │
 *   │  ┌──────────────────────────────────────┐   │
 *   │  │ accounts  │ company_id = 1 │ ... │   │   │
 *   │  │ accounts  │ company_id = 2 │ ... │   │   │
 *   │  │ journal_entries │ company_id = 1 │  │   │
 *   │  └──────────────────────────────────────┘   │
 *   └─────────────────────────────────────────────┘
 *
 * العزل يتم عبر:
 *   1. BelongsToCompany trait — يضيف company_id تلقائياً عند الإنشاء
 *   2. CompanyScope — يُضيف WHERE company_id = ? لكل query تلقائياً
 *
 * ═══════════════════════════════════════════════════════════════
 * متى تستخدم setTenant() / createTenantDatabase() ؟
 * ═══════════════════════════════════════════════════════════════
 *
 * هذه الدوال مُعدّة للمستقبل إذا قررت الترقية إلى:
 *   "Separate Database per Tenant" — قاعدة بيانات منفصلة لكل شركة
 *
 * الترقية ستكون مفيدة عندما:
 *   - تحتاج عزلاً أمنياً أقوى (GDPR, data sovereignty)
 *   - تحتاج لتحديد موارد قاعدة البيانات لكل شركة
 *   - عدد الشركات تجاوز 1000+ وأداء الـ queries تأثر
 *
 * في الوقت الحالي: لا تستدعِ setTenant() في أي Controller
 * استمر في الاعتماد على CompanyScope فقط
 *
 * ═══════════════════════════════════════════════════════════════
 * الدوال النشطة حالياً (مستخدمة في SuperAdmin)
 * ═══════════════════════════════════════════════════════════════
 */
class TenantManager
{
    // ══════════════════════════════════════════════════════════
    // الدوال النشطة — مستخدمة في SuperAdmin Controllers
    // ══════════════════════════════════════════════════════════

    /**
     * تفعيل شركة → status = 'active'
     * يُستدعى من SuperAdmin/CompanyController عند الموافقة على شركة جديدة.
     *
     * Fix #2: كان يستخدم is_active (غير موجود في Company::$fillable)
     * الحقل الصحيح هو status بقيمة 'active' | 'suspended'.
     * Company::isActive() تتحقق من status === 'active'
     * وEnsureCompanyActive Middleware يتحقق من status === 'suspended'.
     *
     * @param  Company $company
     * @return void
     */
    public static function activateCompany(Company $company): void
    {
        $company->update(['status' => 'active']);
    }

    /**
     * تعليق/إيقاف شركة → status = 'suspended'
     * المستخدمون المنتمون لهذه الشركة لن يستطيعوا تسجيل الدخول
     * (التحقق في AuthController::login وEnsureCompanyActive Middleware).
     *
     * Fix #2: كان يستخدم is_active = false (غير موجود في Company::$fillable)
     * الحقل الصحيح هو status = 'suspended'.
     *
     * @param  Company $company
     * @return void
     */
    public static function suspendCompany(Company $company): void
    {
        $company->update(['status' => 'suspended']);
    }

    // ══════════════════════════════════════════════════════════
    // الدوال المحفوظة للمستقبل — "Separate DB" Architecture
    // لا تستخدمها في الكود الحالي
    // ══════════════════════════════════════════════════════════

    /**
     * [FUTURE USE] اسم قاعدة البيانات المخصصة للشركة
     * مثال: tenant_5_شركة_كودسفير
     *
     * @param  Company $company
     * @return string
     */
    public static function dbName(Company $company): string
    {
        return 'tenant_' . $company->id . '_' . Str::slug($company->name, '_');
    }

    /**
     * [FUTURE USE] إنشاء قاعدة بيانات مستقلة للشركة
     * استخدم هذا فقط إذا قررت التحويل إلى Separate DB Architecture
     *
     * @param  Company $company
     * @return bool
     */
    public static function createTenantDatabase(Company $company): bool
    {
        try {
            $dbName = self::dbName($company);
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $company->update(['db_name' => $dbName]);
            return true;
        } catch (\Exception $e) {
            \Log::error('[TenantManager] createTenantDatabase failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * [FUTURE USE] حذف قاعدة بيانات شركة
     *
     * @param  Company $company
     * @return bool
     */
    public static function dropTenantDatabase(Company $company): bool
    {
        try {
            $dbName = $company->db_name ?? self::dbName($company);
            DB::statement("DROP DATABASE IF EXISTS `{$dbName}`");
            return true;
        } catch (\Exception $e) {
            \Log::error('[TenantManager] dropTenantDatabase failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * [FUTURE USE] تحويل الاتصال لقاعدة بيانات الشركة
     * لا تستخدم هذه الدالة الآن — الـ CompanyScope يكفي
     *
     * @param  Company $company
     * @return void
     */
    public static function setTenant(Company $company): void
    {
        $dbName = $company->db_name ?? self::dbName($company);

        Config::set('database.connections.tenant', [
            'driver'    => 'mysql',
            'host'      => env('DB_HOST', '127.0.0.1'),
            'port'      => env('DB_PORT', '3306'),
            'database'  => $dbName,
            'username'  => env('DB_USERNAME', 'root'),
            'password'  => env('DB_PASSWORD', ''),
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix'    => '',
        ]);

        DB::purge('tenant');
        DB::reconnect('tenant');
    }

    /**
     * [FUTURE USE] مسح اتصال الـ tenant
     *
     * @return void
     */
    public static function clearTenant(): void
    {
        DB::purge('tenant');
    }
}
