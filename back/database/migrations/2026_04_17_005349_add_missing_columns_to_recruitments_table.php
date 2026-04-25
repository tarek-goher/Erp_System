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
    Schema::table('recruitments', function (Blueprint $table) {
        $table->decimal('salary_range_min', 10, 2)->nullable()->after('status');
        $table->decimal('salary_range_max', 10, 2)->nullable()->after('salary_range_min');
        $table->boolean('is_archived')->default(false)->after('salary_range_max');
        $table->date('open_date')->nullable()->after('is_archived');
        $table->date('close_date')->nullable()->after('open_date');
    });
}

public function down(): void
{
    Schema::table('recruitments', function (Blueprint $table) {
        $table->dropColumn([
            'salary_range_min',
            'salary_range_max', 
            'is_archived',
            'open_date',
            'close_date',
        ]);
    });
}
};
