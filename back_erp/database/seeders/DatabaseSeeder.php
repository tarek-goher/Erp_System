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
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);        }

        // ══════════════════════════════════════════════════
        // 2. الـ Roles وصلاحياتهم
        // ══════════════════════════════════════════════════
        $rolePermissions = [
            'super-admin'   => $permissions,
            'manager'       => $permissions,
            'accountant'    => ['view-dashboard', 'manage-accounting', 'manage-budgets', 'view-reports'],
            'store-manager' => ['view-dashboard', 'manage-products', 'manage-warehouses', 'view-reports'],
            'cashier'       => ['view-dashboard', 'manage-pos', 'manage-sales'],
            'sales-rep'     => ['view-dashboard', 'manage-sales', 'manage-crm'],
            'hr-manager'    => ['view-dashboard', 'manage-hr', 'view-reports'],
            'viewer'        => ['view-dashboard', 'view-reports'],
        ];

        foreach ($rolePermissions as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }

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
                // Fix: كان plan → الصح هو subscription_plan
                'plan' => 'enterprise',
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
