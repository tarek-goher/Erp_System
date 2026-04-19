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
        Schema::create('appraisal_360_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('appraisal_id')->constrained('appraisals')->cascadeOnDelete();
            $table->foreignId('from_employee_id')->constrained('employees')->cascadeOnDelete();
            $table->enum('relation', ['self', 'peer', 'manager', 'subordinate']); // من فين التقييم
            $table->json('scores')->nullable(); // درجات التقييم بصيغة JSON
            $table->text('comments')->nullable(); // التعليقات
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            
            $table->index('company_id');
            $table->index('appraisal_id');
            $table->index('from_employee_id');
            $table->index('relation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appraisal_360_feedback');
    }
};