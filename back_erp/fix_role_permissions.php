<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$role = \Spatie\Permission\Models\Role::where('name', 'manager')->where('guard_name', 'sanctum')->first();

if (!$role) {
    echo "Role not found!\n";
    exit;
}

echo "Role: " . $role->name . "\n";
echo "Current permissions: " . $role->permissions->pluck('name')->implode(', ') . "\n";

$allPermissions = \Spatie\Permission\Models\Permission::where('guard_name', 'sanctum')->pluck('name')->toArray();
echo "All permissions: " . implode(', ', $allPermissions) . "\n";

$role->syncPermissions($allPermissions);

echo "New permissions count: " . $role->fresh()->permissions->count() . "\n";
echo "Done!\n";
