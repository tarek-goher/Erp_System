<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('canned_responses', function (Blueprint $table) {
            // إضافة الأعمدة الجديدة لو ما موجودة
            if (!Schema::hasColumn('canned_responses', 'title')) {
                $table->string('title')->after('company_id');
            }
            if (!Schema::hasColumn('canned_responses', 'content')) {
                $table->text('content')->after('title');
            }
            if (!Schema::hasColumn('canned_responses', 'tags')) {
                $table->json('tags')->nullable()->after('content');
            }
            
            // حذف الأعمدة القديمة
            if (Schema::hasColumn('canned_responses', 'name')) {
                $table->dropColumn('name');
            }
            if (Schema::hasColumn('canned_responses', 'body')) {
                $table->dropColumn('body');
            }
            if (Schema::hasColumn('canned_responses', 'category')) {
                $table->dropColumn('category');
            }
        });
    }

    public function down(): void
    {
        Schema::table('canned_responses', function (Blueprint $table) {
            // ما تقلق من down() - بس للـ rollback
        });
    }
};