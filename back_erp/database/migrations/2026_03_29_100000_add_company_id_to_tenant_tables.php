<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $tables = [
            'categories', 'products', 'customers', 'suppliers',
            'sales', 'purchases', 'stock_movements',
            'employees', 'attendances', 'payrolls',
            'accounts', 'journal_entries', 'pos_shifts',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'company_id')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->foreignId('company_id')
                      ->nullable()
                      ->after('id')
                      ->constrained('companies')
                      ->cascadeOnDelete();
                    $t->index('company_id');
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'categories', 'products', 'customers', 'suppliers',
            'sales', 'purchases', 'stock_movements',
            'employees', 'attendances', 'payrolls',
            'accounts', 'journal_entries', 'pos_shifts',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'company_id')) {
                Schema::table($table, function (Blueprint $t) use ($table) {
                    $t->dropForeign(["{$table}_company_id_foreign"]);
                    $t->dropColumn('company_id');
                });
            }
        }
    }
};
