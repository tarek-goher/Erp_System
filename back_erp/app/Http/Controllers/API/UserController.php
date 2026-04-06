<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * UserController
 * المسارات: /api/users
 *
 * Fix #10: User::forCompany() scope غير موجود في User model
 *  - كان: User::forCompany($this->companyId()) → BadMethodCallException
 *  - الحل: استخدام ->where('company_id', ...) مباشرةً
 */
class UserController extends BaseController
{
    /** GET /api/users */
    public function index(Request $request): JsonResponse
    {
        // Fix #10: User model ليس فيه scopeForCompany
        // استبدلنا User::forCompany() بـ where('company_id', ...) مباشرةً
        $users = User::where('company_id', $this->companyId())
            ->with('roles:id,name')
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->paginate($this->perPage());

        return $this->success($users);
    }

    /** POST /api/users */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|min:8',
            'phone'      => 'nullable|string|max:20',
            'department' => 'nullable|string',
            'role'       => 'nullable|string',
        ]);

        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'phone'      => $data['phone'] ?? null,
            'company_id' => $this->companyId(),
            'is_active'  => true,
        ]);

        if (!empty($data['role'])) {
            $user->assignRole($data['role']);
        }

        return $this->created($user->load('roles:id,name'));
    }

    /** GET /api/users/{user} */
    public function show(User $user): JsonResponse
    {
        abort_unless($user->company_id === $this->companyId(), 403);
        return $this->success($user->load('roles', 'employee'));
    }

    /** PUT /api/users/{user} */
    public function update(Request $request, User $user): JsonResponse
    {
        abort_unless($user->company_id === $this->companyId(), 403);

        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'phone'      => 'nullable|string|max:20',
            'department' => 'nullable|string',
            'is_active'  => 'sometimes|boolean',
        ]);

        $user->update($data);
        return $this->success($user, 'User updated');
    }

    /** DELETE /api/users/{user} */
    public function destroy(User $user): JsonResponse
    {
        abort_unless($user->company_id === $this->companyId(), 403);
        $user->delete();
        return $this->success(null, 'User deleted');
    }

    /** POST /api/users/{user}/assign-role */
    public function assignRole(Request $request, User $user): JsonResponse
    {
        abort_unless($user->company_id === $this->companyId(), 403);
        $request->validate(['role' => 'required|string']);
        $user->syncRoles([$request->role]);
        return $this->success($user->load('roles:id,name'), 'Role assigned');
    }
}
