<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::table('purchase_items', function (Blueprint $table) {
        $table->foreignId('warehouse_id')->nullable()->after('product_id');
        $table->decimal('discount', 10, 2)->default(0)->after('unit_price');
    });
}

public function down(): void
{
    Schema::table('purchase_items', function (Blueprint $table) {
        $table->dropForeign(['warehouse_id']);
        $table->dropColumn(['warehouse_id', 'discount']);
    });
}
};
