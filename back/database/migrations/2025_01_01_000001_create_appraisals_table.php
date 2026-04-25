<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // أول حاجة: إنشاء الجدول الأساسي لو مش موجود
        if (!Schema::hasTable('appraisals')) {
            Schema::create('appraisals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->string('period')->nullable();         // مثال: "Q1 2025"
                $table->date('review_date')->nullable();
                $table->decimal('score', 5, 2)->nullable();
                $table->enum('status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
                $table->text('notes')->nullable();
                $table->json('criteria_scores')->nullable();
                $table->boolean('linked_promotion')->default(false);
                $table->decimal('linked_raise', 5, 2)->nullable();
                $table->json('approval_chain')->nullable();
                $table->timestamps();
            });
        } else {
            // لو الجدول موجود، بس أضف الأعمدة الناقصة
            Schema::table('appraisals', function (Blueprint $table) {
                if (!Schema::hasColumn('appraisals', 'criteria_scores')) {
                    $table->json('criteria_scores')->nullable();
                }
                if (!Schema::hasColumn('appraisals', 'linked_promotion')) {
                    $table->boolean('linked_promotion')->default(false);
                }
                if (!Schema::hasColumn('appraisals', 'linked_raise')) {
                    $table->decimal('linked_raise', 5, 2)->nullable();
                }
                if (!Schema::hasColumn('appraisals', 'approval_chain')) {
                    $table->json('approval_chain')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('appraisals');
    }
};