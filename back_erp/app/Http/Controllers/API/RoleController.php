<?php
namespace App\Http\Controllers\API;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class RoleController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Role::with('permissions:id,name')->get()); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string|unique:roles','permissions'=>'nullable|array']);
        $role = Role::create(['name'=>$data['name'],'guard_name'=>'web']);
        if (!empty($data['permissions'])) $role->syncPermissions($data['permissions']);
        return $this->created($role->load('permissions:id,name'));
    }
    public function show(Role $role): JsonResponse { return $this->success($role->load('permissions:id,name')); }
    public function update(Request $request, Role $role): JsonResponse
    {
        if ($request->has('permissions')) $role->syncPermissions($request->permissions);
        return $this->success($role->load('permissions:id,name'),'Role updated');
    }
    public function destroy(Role $role): JsonResponse { $role->delete(); return $this->success(null,'Role deleted'); }
    public function permissions(): JsonResponse { return $this->success(Permission::all()); }
}
