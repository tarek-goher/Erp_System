<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // This project previously had a migration with a misleading name that didn't
            // actually add these columns. Keep this migration defensive/idempotent.

            if (!Schema::hasColumn('sales', 'tax_rate_id')) {
                $table->foreignId('tax_rate_id')
                    ->nullable()
                    ->after('tax')
                    ->constrained('tax_rates')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('sales', 'due_date')) {
                $table->date('due_date')->nullable()->after('payment_method');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'tax_rate_id')) {
                $table->dropForeign(['tax_rate_id']);
                $table->dropColumn('tax_rate_id');
            }

            if (Schema::hasColumn('sales', 'due_date')) {
                $table->dropColumn('due_date');
            }
        });
    }
};

