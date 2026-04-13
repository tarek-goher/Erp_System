<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_items', 'warehouse_id')) {
                $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('purchase_items', 'discount')) {
                $table->decimal('discount', 15, 2)->default(0)->after('unit_price');
            }
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