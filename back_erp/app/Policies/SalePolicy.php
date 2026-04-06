<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;

/**
 * SalePolicy — التحكم في الصلاحيات على الفواتير
 *
 * Bug جديد: SaleController كان بيستدعي authorize('update', $sale)
 * لكن SalePolicy كانت بتعرّف view() و delete() فقط بدون update().
 * النتيجة: كل طلبات تعديل الفاتورة (PUT /api/sales/{id}) كانت تكسر.
 */
class SalePolicy
{
    /** Super Admin له كل الصلاحيات */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->is_super_admin) {
            return true;
        }
        return null;
    }

    /** مشاهدة الفاتورة — نفس الشركة فقط */
    public function view(User $user, Sale $sale): bool
    {
        return $user->company_id === $sale->company_id;
    }

    /**
     * تعديل الفاتورة — نفس الشركة فقط
     * Bug Fix: كانت ناقصة خالص → exception عند PUT /api/sales/{id}
     */
    public function update(User $user, Sale $sale): bool
    {
        return $user->company_id === $sale->company_id;
    }

    /** حذف الفاتورة — نفس الشركة + صلاحية manage-sales أو role admin */
    public function delete(User $user, Sale $sale): bool
    {
        return $user->company_id === $sale->company_id
            && ($user->hasRole('admin') || $user->hasRole('manager') || $user->hasPermissionTo('manage-sales'));
    }
}
