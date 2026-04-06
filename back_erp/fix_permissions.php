<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'admin@codesphere.io')->first();

if (!$user) {
    echo "User not found!\n";
    exit;
}

echo "User found: " . $user->name . "\n";
echo "Current roles: " . $user->getRoleNames()->implode(', ') . "\n";

$user->syncRoles(['manager']);

echo "New roles: " . $user->fresh()->getRoleNames()->implode(', ') . "\n";
echo "Done!\n";
