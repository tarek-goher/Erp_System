<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// كل الشركات وفواتيرها
$results = \App\Models\Sale::withoutGlobalScopes()
    ->selectRaw('company_id, count(*) as count, sum(total) as total')
    ->groupBy('company_id')
    ->get();

echo "=== الفواتير لكل شركة ===\n";
foreach ($results as $r) {
    echo "company_id: {$r->company_id} | عدد الفواتير: {$r->count} | الإجمالي: " . number_format($r->total, 2) . "\n";
}

// كل اليوزرز وشركاتهم
echo "\n=== اليوزرز ===\n";
$users = \App\Models\User::withoutGlobalScopes()->select('id', 'name', 'company_id', 'email')->get();
foreach ($users as $u) {
    echo "id: {$u->id} | name: {$u->name} | email: {$u->email} | company_id: {$u->company_id}\n";
}