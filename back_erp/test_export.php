<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$request = new \Illuminate\Http\Request();
$request->merge(['format' => 'excel', 'from' => '2026-01-01', 'to' => '2026-12-31']);

try {
    $controller = app(\App\Http\Controllers\API\ReportController::class);
    $result = $controller->exportSales($request);
    echo "Success: " . get_class($result) . "\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}