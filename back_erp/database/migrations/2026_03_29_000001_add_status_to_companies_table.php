<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // status — ممكن يكون موجود بالفعل في الـ companies migration الحديث
        if (!Schema::hasColumn('companies', 'status')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->enum('status', ['active', 'suspended', 'under_review', 'inactive'])
                      ->default('under_review')
                      ->after('is_active');
            });
        }

        // image_url للمنتجات (اختياري)
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'image_url')) {
            Schema::table('products', function (Blueprint $table) {
                $table->string('image_url')->nullable()->after('description');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('companies', 'status')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'image_url')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('image_url');
            });
        }
    }
};
