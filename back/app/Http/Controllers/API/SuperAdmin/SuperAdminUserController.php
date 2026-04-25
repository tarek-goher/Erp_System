<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\API\BaseController;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * SuperAdmin\SuperAdminUserController
 * المسارات: /api/super-admin/users
 * يتحكم في: إدارة المستخدمين من منظور السوبر أدمن (كل الشركات)
 */
class SuperAdminUserController extends BaseController
{
    /** GET /api/super-admin/users */
    public function index(Request $request): JsonResponse
    {
        $users = User::with('company:id,name', 'roles:id,name')
            ->when($request->company_id, fn($q) => $q->where('company_id', $request->company_id))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($users);
    }

    /** PATCH /api/super-admin/users/{user} */
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'email'         => 'sometimes|email|unique:users,email,' . $user->id,
            'is_active'     => 'sometimes|boolean',
            'is_super_admin'=> 'sometimes|boolean',
            'company_id'    => 'nullable|exists:companies,id',
        ]);

        $user->update($data);
        return $this->success($user->fresh('company', 'roles'), 'User updated');
    }

    /** DELETE /api/super-admin/users/{user} */
    public function destroy(User $user): JsonResponse
    {
        abort_if($user->is_super_admin && User::where('is_super_admin', true)->count() <= 1, 422,
            'Cannot delete the last super admin.');
        $user->delete();
        return $this->success(null, 'User deleted');
    }

    /** POST /api/super-admin/users/{user}/toggle-active */
    public function toggleActive(User $user): JsonResponse
    {
        $user->update(['is_active' => !$user->is_active]);
        return $this->success($user, $user->is_active ? 'User activated' : 'User deactivated');
    }

    /** POST /api/super-admin/users/{user}/reset-password */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $request->validate(['password' => 'required|min:8|confirmed']);
        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete(); // force re-login
        return $this->success(null, 'Password reset successfully');
    }
}
