<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

/**
 * EmployeePolicy
 *
 * Fix #11: كانت EmployeeController بتستدعي $this->authorize('view', $employee)
 *          لكن مفيش EmployeePolicy معرّفة ولا مسجّلة في AuthServiceProvider.
 *          النتيجة: كل طلبات show كانت بترجع 403 أو Exception.
 *
 *          الحل: إنشاء EmployeePolicy وتسجيلها في AppServiceProvider::boot()
 *          كل methods تتحقق إن الـ employee ينتمي لنفس شركة المستخدم.
 */
class EmployeePolicy
{
    /**
     * سماح لـ Super Admin بكل العمليات تلقائياً
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->is_super_admin) {
            return true;
        }
        return null;
    }

    /** عرض موظف واحد */
    public function view(User $user, Employee $employee): bool
    {
        return $user->company_id === $employee->company_id;
    }

    /** تعديل موظف */
    public function update(User $user, Employee $employee): bool
    {
        return $user->company_id === $employee->company_id;
    }

    /** حذف موظف */
    public function delete(User $user, Employee $employee): bool
    {
        return $user->company_id === $employee->company_id;
    }

    /** إنشاء موظف */
    public function create(User $user): bool
    {
        return $user->company_id !== null;
    }
}
