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
            // تغيير ENUM لإضافة 'on_hold'
            $table->enum('status', ['open', 'closed', 'draft', 'on_hold'])->change();
        });
    }

    public function down(): void
    {
        Schema::table('recruitments', function (Blueprint $table) {
            // العودة للقيم الأصلية
            $table->enum('status', ['open', 'closed', 'draft'])->change();
        });
    }
};