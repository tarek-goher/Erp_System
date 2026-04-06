<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

/**
 * ProductPolicy
 *
 * Bug جديد: ProductController كان بيستدعي $this->authorize('view/update/delete', $product)
 * لكن ProductPolicy لم تكن موجودة خالص → كل طلبات show/update/delete كانت تكسر.
 *
 * النتيجة: 403 أو AuthorizationException لكل مستخدم حتى لو عنده صلاحية.
 */
class ProductPolicy
{
    /** Super Admin له كل الصلاحيات */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->is_super_admin) {
            return true;
        }
        return null;
    }

    /** عرض منتج — نفس الشركة فقط */
    public function view(User $user, Product $product): bool
    {
        return $user->company_id === $product->company_id;
    }

    /** تعديل منتج — نفس الشركة + صلاحية manage-products */
    public function update(User $user, Product $product): bool
    {
        return $user->company_id === $product->company_id
            && $user->hasPermissionTo('manage-products');
    }

    /** حذف منتج — نفس الشركة + صلاحية manage-products */
    public function delete(User $user, Product $product): bool
    {
        return $user->company_id === $product->company_id
            && $user->hasPermissionTo('manage-products');
    }

    /** إنشاء منتج */
    public function create(User $user): bool
    {
        return $user->company_id !== null
            && $user->hasPermissionTo('manage-products');
    }
}
