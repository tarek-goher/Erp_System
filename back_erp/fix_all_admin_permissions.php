<?php
/**
 * fix_all_admin_permissions.php
 * شغّل هذا السكريبت مرة واحدة لإعطاء كل الـ admin roles الصلاحيات الكاملة
 * php artisan tinker --execute="require base_path('fix_all_admin_permissions.php');"
 * أو: php fix_all_admin_permissions.php
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

$allPermissions = [
    'manage-sales', 'manage-purchases', 'manage-products',
    'manage-accounting', 'manage-hr', 'manage-crm',
    'manage-projects', 'manage-warehouses', 'manage-pos',
    'view-reports', 'manage-users', 'manage-settings',
];

echo "🔧 إنشاء الصلاحيات...\n";
foreach ($allPermissions as $perm) {
    Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'sanctum']);
    echo "  ✅ $perm\n";
}

echo "\n🔧 إعطاء role=admin كل الصلاحيات...\n";
$adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
$adminRole->syncPermissions($allPermissions);
echo "  ✅ admin role حصل على " . count($allPermissions) . " صلاحية\n";

echo "\n🔧 مزامنة صلاحيات كل يوزر admin...\n";
$users = \App\Models\User::role('admin')->get();
foreach ($users as $user) {
    $user->syncPermissions($allPermissions);
    echo "  ✅ {$user->name} ({$user->email})\n";
}

echo "\n✅ تم! كل الـ admin accounts عندهم الصلاحيات الكاملة الآن.\n";
