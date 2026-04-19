<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void {
    Schema::table('leave_requests', function (Blueprint $table) {
        $table->renameColumn('from_date', 'start_date');
        $table->renameColumn('to_date', 'end_date');
    });

    // تحديث الـ storedAs بعد الـ rename
    DB::statement('ALTER TABLE leave_requests MODIFY days INT GENERATED ALWAYS AS (DATEDIFF(end_date, start_date) + 1) STORED');
}

public function down(): void {
    Schema::table('leave_requests', function (Blueprint $table) {
        $table->renameColumn('start_date', 'from_date');
        $table->renameColumn('end_date', 'to_date');
    });

    DB::statement('ALTER TABLE leave_requests MODIFY days INT GENERATED ALWAYS AS (DATEDIFF(to_date, from_date) + 1) STORED');
}
};
