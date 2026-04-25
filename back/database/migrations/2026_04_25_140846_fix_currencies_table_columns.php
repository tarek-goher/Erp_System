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
    Schema::table('currencies', function (Blueprint $table) {
        // إعادة تسمية rate إلى exchange_rate
        $table->renameColumn('rate', 'exchange_rate');
        
        // إضافة الأعمدة الناقصة
        $table->string('symbol', 10)->nullable()->after('name');
        $table->boolean('is_active')->default(true)->after('is_default');
    });
}

public function down(): void
{
    Schema::table('currencies', function (Blueprint $table) {
        $table->renameColumn('exchange_rate', 'rate');
        $table->dropColumn(['symbol', 'is_active']);
    });
}
};
