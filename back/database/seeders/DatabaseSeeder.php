<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ══════════════════════════════════════════════════
        // 1. الـ Permissions
        // ══════════════════════════════════════════════════
        $permissions = [
            'view-dashboard', 'manage-users', 'manage-settings',
            'manage-products', 'manage-sales', 'manage-purchases',
            'manage-accounting', 'manage-hr', 'manage-pos',
            'manage-projects', 'manage-crm', 'manage-warehouses',
            'manage-budgets', 'view-reports',
            // Fix: permissions الناقصة للوحدات الجديدة
            'manage-helpdesk', 'view-helpdesk',
            'manage-fleet', 'manage-manufacturing',
            'manage-recruitment', 'manage-marketing',
            'view-audit-logs', 'manage-escalation-rules',
            // Permissions for Branch Manager
            'create-users', 'edit-users', 'view-users',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ══════════════════════════════════════════════════
        // 2. الـ Roles وصلاحياتهم
        // ══════════════════════════════════════════════════
        $corePermissions = [
            'view-dashboard', 'manage-users', 'manage-settings',
            'manage-products', 'manage-sales', 'manage-purchases',
            'manage-accounting', 'manage-hr', 'manage-pos',
            'manage-projects', 'manage-crm', 'manage-warehouses',
            'manage-budgets', 'view-reports',
            'manage-helpdesk', 'view-helpdesk',
            'manage-fleet', 'manage-manufacturing',
            'manage-recruitment', 'manage-marketing',
            'view-audit-logs', 'manage-escalation-rules',
        ];

        $rolePermissions = [
            'super-admin'   => $corePermissions,
            'manager'       => $corePermissions,
            'accountant'    => ['view-dashboard', 'manage-accounting', 'manage-budgets', 'view-reports', 'view-helpdesk'],
            'store-manager' => ['view-dashboard', 'manage-products', 'manage-warehouses', 'view-reports', 'manage-manufacturing', 'view-helpdesk'],
            'cashier'       => ['view-dashboard', 'manage-pos', 'manage-sales', 'view-helpdesk'],
            'sales-rep'     => ['view-dashboard', 'manage-sales', 'manage-crm', 'view-helpdesk'],
            'hr-manager'    => ['view-dashboard', 'manage-hr', 'view-reports', 'manage-recruitment', 'view-helpdesk'],
            'viewer'        => ['view-dashboard', 'view-reports', 'view-helpdesk'],
        ];

        foreach ($rolePermissions as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }

        // ══════════════════════════════════════════════════
        // 4. Branch Manager Role (Special Case)
        // ══════════════════════════════════════════════════
        // Create branch_manager role if not exists
        $branchManager = Role::firstOrCreate(
            ['name' => 'branch_manager', 'guard_name' => 'web']
        );
        
        // Give branch_manager specific permissions
        $branchManager->givePermissionTo([
            'create-users',
            'edit-users',
            'view-users',
            'view-dashboard',
            'view-helpdesk'
        ]);

        // ══════════════════════════════════════════════════
        // 3. شركة تجريبية + مستخدمين
        //
        // Bug جديد — إصلاح أسماء الحقول:
        //   - كان is_active → لكن Company model ليس فيه is_active في $fillable
        //     الحقل الصحيح هو status
        //   - كان plan → لكن الحقل الصحيح هو subscription_plan
        // ══════════════════════════════════════════════════
        $company = Company::firstOrCreate(
            ['email' => 'demo@codesphere.io'],
            [
                'name'              => 'شركة CodeSphere التجريبية',
                'phone'             => '01000000000',
                'country'           => 'مصر',
                // Fix: كان is_active → الحقل غير موجود في Company $fillable
                // الصح هو status = 'active'
                'status'            => 'active',
                // Fix: كان 'plan' والحقل الصح في الـ Model هو subscription_plan
                'subscription_plan' => 'enterprise',
            ]
        );

        // كلمة المرور من .env أو قيمة افتراضية للـ dev
        // Bug #17: كانت hardcoded 'password' في الكود مباشرة
        // الأفضل استخدام env() مع fallback للـ development فقط
        $defaultPassword = env('SEED_DEFAULT_PASSWORD', 'password');

        $users = [
            ['name' => 'Super Admin',   'email' => 'superadmin@codesphere.io', 'is_super_admin' => true,  'role' => 'super-admin',   'company_id' => null],
            ['name' => 'Admin',         'email' => 'admin@codesphere.io',      'is_super_admin' => false, 'role' => 'manager',       'company_id' => $company->id],
            ['name' => 'فاطمة محاسبة', 'email' => 'fatma@codesphere.io',      'is_super_admin' => false, 'role' => 'accountant',    'company_id' => $company->id],
            ['name' => 'محمد مخازن',   'email' => 'mohamad@codesphere.io',    'is_super_admin' => false, 'role' => 'store-manager', 'company_id' => $company->id],
            ['name' => 'سارة كاشير',   'email' => 'sara@codesphere.io',       'is_super_admin' => false, 'role' => 'cashier',       'company_id' => $company->id],
            ['name' => 'خالد مبيعات',  'email' => 'khaled@codesphere.io',     'is_super_admin' => false, 'role' => 'sales-rep',     'company_id' => $company->id],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password'  => Hash::make($defaultPassword),
                    'is_active' => true,
                ])
            );
            $user->syncRoles([$role]);
        }
    }
}
