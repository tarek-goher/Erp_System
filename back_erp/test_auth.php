<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$result = \Illuminate\Support\Facades\Auth::attempt([
    'email'    => 'admin@codesphere.io',
    'password' => 'password123',
]);

echo $result ? "✅ Login SUCCESS" : "❌ Login FAILED";
echo "\n";

// تحقق إن اليوزر موجود
$user = \App\Models\User::where('email', 'admin@codesphere.io')->first();
if ($user) {
    echo "✅ User found: " . $user->name . "\n";
    echo "Password hash: " . $user->password . "\n";
} else {
    echo "❌ User NOT found in database\n";
}