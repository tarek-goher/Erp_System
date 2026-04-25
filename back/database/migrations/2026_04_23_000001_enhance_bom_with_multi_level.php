<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // تحسين جدول Bill of Materials ليدعم multi-level
        Schema::table('bom_items', function (Blueprint $table) {
            if (!Schema::hasColumn('bom_items', 'parent_bom_id')) {
                // شلنا الـ after عشان نضمن إن المايجريشن يكمل حتى لو العمود مش موجود
                $table->unsignedBigInteger('parent_bom_id')->nullable();
                $table->foreign('parent_bom_id')->references('id')->on('bom_items')->onDelete('cascade');
            }
            
            if (!Schema::hasColumn('bom_items', 'level')) {
                $table->unsignedInteger('level')->default(1);
            }
            
            if (!Schema::hasColumn('bom_items', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            
            if (!Schema::hasColumn('bom_items', 'notes')) {
                $table->text('notes')->nullable();
            }
        });

        // إنشاء جدول لمركز العمل (Work Centers) - تم نقله للأعلى لضمان وجوده قبل الروتينج
        if (!Schema::hasTable('work_centers')) {
            Schema::create('work_centers', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->string('name')->unique();
                $table->text('description')->nullable();
                $table->string('code')->unique();
                $table->decimal('capacity', 10, 2); 
                $table->decimal('hourly_rate', 10, 2)->default(0); 
                $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
                $table->timestamps();
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->index(['company_id', 'status']);
            });
        }

        // إنشاء جدول للروتينج (manufacturing routing)
        if (!Schema::hasTable('work_center_routings')) {
            Schema::create('work_center_routings', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('product_id');
                $table->unsignedBigInteger('work_center_id');
                $table->integer('sequence');
                $table->decimal('setup_time', 10, 2)->default(0); 
                $table->decimal('operation_time', 10, 2)->default(0); 
                $table->decimal('unit_time', 10, 2); 
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
                $table->foreign('work_center_id')->references('id')->on('work_centers')->onDelete('restrict');
                $table->index(['product_id', 'sequence']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('work_center_routings');
        Schema::dropIfExists('work_centers');
        
        Schema::table('bom_items', function (Blueprint $table) {
            if (Schema::hasColumn('bom_items', 'parent_bom_id')) {
                $table->dropForeign(['parent_bom_id']);
                $table->dropColumn('parent_bom_id');
            }
            if (Schema::hasColumn('bom_items', 'level')) {
                $table->dropColumn('level');
            }
            if (Schema::hasColumn('bom_items', 'is_active')) {
                $table->dropColumn('is_active');
            }
            if (Schema::hasColumn('bom_items', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};