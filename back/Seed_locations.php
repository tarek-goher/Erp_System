<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\ProductLocation;

$products = Product::where('qty', '>', 0)->get();

foreach ($products as $p) {
    $warehouse = Warehouse::where('company_id', $p->company_id)->first();
    if ($warehouse) {
        ProductLocation::updateOrCreate(
            [
                'product_id'   => $p->id,
                'warehouse_id' => $warehouse->id,
                'company_id'   => $p->company_id,
            ],
            ['qty' => $p->qty]
        );
        echo "Done: {$p->name} -> {$warehouse->name} -> {$p->qty}\n";
    } else {
        echo "No warehouse found for: {$p->name}\n";
    }
}

echo "\nFinished!\n";