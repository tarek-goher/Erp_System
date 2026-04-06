<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // GET /api/super-admin/users
    public function index(Request $request): JsonResponse
    {
        $users = User::with('company:id,name')
            ->when($request->search, fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%"))
            ->when($request->company_id, fn($q) => $q->where('company_id', $request->company_id))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($users);
    }

    // POST /api/super-admin/users/{id}/toggle-active
    public function toggleActive(User $user): JsonResponse
    {
        $user->update(['is_active' => ! $user->is_active]);
        return response()->json([
            'message'   => $user->is_active ? 'تم تفعيل المستخدم.' : 'تم تعطيل المستخدم.',
            'is_active' => $user->is_active,
        ]);
    }

    // POST /api/super-admin/users/{id}/reset-password
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $request->validate(['password' => 'required|string|min:8']);
        $user->update(['password' => \Illuminate\Support\Facades\Hash::make($request->password)]);
        return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح.']);
    }

    // PATCH /PUT /api/super-admin/users/{user}
    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|unique:users,email,' . $user->id,
            'phone'     => 'sometimes|nullable|string|max:30',
            'is_active' => 'sometimes|boolean',
            'role'      => 'sometimes|nullable|string|exists:roles,name',
        ]);

        $user->update($request->only('name', 'email', 'phone', 'is_active'));

        // تحديث الدور لو أُرسل
        if ($request->filled('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json([
            'message' => 'تم تحديث المستخدم.',
            'user'    => $user->fresh()->load('roles'),
        ]);
    }

    // DELETE /api/super-admin/users/{user}
    public function destroy(User $user): JsonResponse
    {
        if ($user->is_super_admin) {
            return response()->json(['message' => 'لا يمكن حذف Super Admin.'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'تم حذف المستخدم.']);
    }
}
