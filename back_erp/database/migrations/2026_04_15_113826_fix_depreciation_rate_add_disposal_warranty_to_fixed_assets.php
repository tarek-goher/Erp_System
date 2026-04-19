<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('fixed_assets', function (Blueprint $table) {
            // ✅ تحديث depreciation_rate بشكل آمن - نسمح بـ NULL
            // لكن نحتاج نعدل البيانات الموجودة أولاً
            if (Schema::hasColumn('fixed_assets', 'depreciation_rate')) {
                // تحديث أي قيم NULL أو غريبة قبل التعديل
                DB::statement('UPDATE fixed_assets SET depreciation_rate = 0 WHERE depreciation_rate IS NULL OR depreciation_rate > 100');
                
                // الآن نعدل العمود
                $table->decimal('depreciation_rate', 5, 2)->nullable()->change();
            }

            // إضافة الأعمدة الجديدة
            if (!Schema::hasColumn('fixed_assets', 'warranty_expiry_date')) {
                $table->date('warranty_expiry_date')->nullable()->after('vendor');
            }

            if (!Schema::hasColumn('fixed_assets', 'disposal_date')) {
                $table->date('disposal_date')->nullable()->after('status');
            }

            if (!Schema::hasColumn('fixed_assets', 'disposal_value')) {
                $table->decimal('disposal_value', 15, 2)->nullable()->after('disposal_date');
            }

            if (!Schema::hasColumn('fixed_assets', 'disposal_reason')) {
                $table->string('disposal_reason', 255)->nullable()->after('disposal_value');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fixed_assets', function (Blueprint $table) {
            if (Schema::hasColumn('fixed_assets', 'depreciation_rate')) {
                $table->decimal('depreciation_rate', 5, 2)->nullable(false)->change();
            }

            if (Schema::hasColumn('fixed_assets', 'warranty_expiry_date')) {
                $table->dropColumn('warranty_expiry_date');
            }
            if (Schema::hasColumn('fixed_assets', 'disposal_date')) {
                $table->dropColumn('disposal_date');
            }
            if (Schema::hasColumn('fixed_assets', 'disposal_value')) {
                $table->dropColumn('disposal_value');
            }
            if (Schema::hasColumn('fixed_assets', 'disposal_reason')) {
                $table->dropColumn('disposal_reason');
            }
        });
    }
};