<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

/**
 * BelongsToCompany — يُستخدم في كل Model لعزل بيانات كل شركة
 * يضيف Global Scope تلقائي بحيث كل query مقيدة بـ company_id
 *
 * Fix #8: Medium Bug — الـ Scope مش بيتطبق على Seeders وConsole Commands
 *
 * المشكلة: الـ Scope شرطه auth()->check()، يعني في:
 *   - Queue Jobs
 *   - Console Commands / Artisan
 *   - Seeders
 *   الـ scope مش بيتضاف، ولو في Model::all() جوا Job بدون where company_id
 *   صريح، هيرجع بيانات كل الشركات (data leakage).
 *
 * الحل:
 *   1. Jobs و Console Commands لازم تستخدم where('company_id', $id) صريح
 *      أو تستخدم ->withoutGlobalScopes() لو المقصود بيانات كل الشركات.
 *   2. أضفنا static method withCompany($companyId) للاستخدام في Jobs بدون auth.
 *   3. أضفنا static method allCompanies() كـ explicit opt-in للـ super admin.
 *
 * مثال استخدام في Job:
 *   Employee::withCompany($companyId)->where('status', 'active')->get();
 */
trait BelongsToCompany
{
    protected static function bootBelongsToCompany(): void
    {
        // لو مفيش authenticated user (Job/Console/Seeder)، لا تضيف scope
        // الـ Job لازم يستخدم where('company_id', ...) صريح أو withCompany()
        if (!auth()->check()) {
            return;
        }

        $user = auth()->user();

        // Super Admin يشوف كل الشركات — لا تضيفله Global Scope
        if ($user->is_super_admin ?? false) {
            return;
        }

        // مستخدم عادي → فلترة على company_id الخاص بيه
        if ($user->company_id) {
            static::addGlobalScope('company', function (Builder $builder) use ($user) {
                $builder->where(
                    (new static())->getTable() . '.company_id',
                    $user->company_id
                );
            });
        }
    }

    /**
     * استخدم هذا في Jobs/Console Commands للفلترة على شركة محددة بدون auth.
     *
     * مثال:
     *   Sale::withCompany($companyId)->where('status', 'pending')->get();
     */
    public static function withCompany(int $companyId): Builder
    {
        return static::withoutGlobalScope('company')
            ->where((new static())->getTable() . '.company_id', $companyId);
    }

    /**
     * للحصول على بيانات كل الشركات (Super Admin / Reports).
     * استخدام صريح يمنع الخطأ غير المقصود.
     *
     * مثال:
     *   Sale::allCompanies()->where('status', 'paid')->sum('total');
     */
    public static function allCompanies(): Builder
    {
        return static::withoutGlobalScope('company');
    }
}
