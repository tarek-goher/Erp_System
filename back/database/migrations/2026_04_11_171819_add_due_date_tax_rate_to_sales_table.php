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
    Schema::table('sales', function (Blueprint $table) {
        $table->unsignedBigInteger('tax_rate_id')
              ->nullable()
              ->after('notes');
        $table->foreign('tax_rate_id')
              ->references('id')
              ->on('tax_rates')
              ->nullOnDelete();

        $table->date('due_date')
              ->nullable()
              ->after('tax_rate_id');
    });
}

public function down(): void
{
    Schema::table('sales', function (Blueprint $table) {
        $table->dropForeign(['tax_rate_id']);
        $table->dropColumn(['tax_rate_id', 'due_date']);
    });
}
};
