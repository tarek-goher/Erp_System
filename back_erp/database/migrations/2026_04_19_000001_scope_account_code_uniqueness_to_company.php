<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            if ($this->indexExists('accounts', 'accounts_code_unique')) {
                $table->dropUnique('accounts_code_unique');
            }

            if (! $this->indexExists('accounts', 'accounts_company_id_code_unique')) {
                $table->unique(['company_id', 'code'], 'accounts_company_id_code_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            if ($this->indexExists('accounts', 'accounts_company_id_code_unique')) {
                $table->dropUnique('accounts_company_id_code_unique');
            }

            if (! $this->indexExists('accounts', 'accounts_code_unique')) {
                $table->unique('code', 'accounts_code_unique');
            }
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $database = DB::getDatabaseName();

        return DB::table('information_schema.statistics')
            ->where('table_schema', $database)
            ->where('table_name', $table)
            ->where('index_name', $indexName)
            ->exists();
    }
};
