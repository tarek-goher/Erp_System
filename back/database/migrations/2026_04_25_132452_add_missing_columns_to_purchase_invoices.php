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
    Schema::table('purchase_invoices', function (Blueprint $table) {
        $table->decimal('tax', 15, 2)->default(0)->after('amount');
        $table->decimal('discount', 15, 2)->default(0)->after('tax');
        $table->decimal('total', 15, 2)->default(0)->after('discount');
        $table->string('reference', 100)->nullable()->after('notes');
    });
}

public function down(): void
{
    Schema::table('purchase_invoices', function (Blueprint $table) {
        $table->dropColumn(['tax', 'discount', 'total', 'reference']);
    });
}
};
