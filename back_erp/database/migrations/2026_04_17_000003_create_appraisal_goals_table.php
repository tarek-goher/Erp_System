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
        Schema::create('appraisal_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('appraisal_id')->nullable()->constrained('appraisals')->cascadeOnDelete();
            $table->string('title'); // مثل: "Increase Sales Revenue"
            $table->string('title_ar')->nullable(); // مثل: "زيادة إيرادات المبيعات"
            $table->decimal('target', 10, 2); // الهدف المطلوب
            $table->decimal('current', 10, 2)->default(0); // التقدم الحالي
            $table->string('unit')->nullable(); // مثل: "EGP", "%", "units"
            $table->date('due_date')->nullable();
            $table->enum('status', ['on_track', 'at_risk', 'completed', 'overdue'])->default('on_track');
            $table->timestamps();
            
            $table->index('company_id');
            $table->index('employee_id');
            $table->index('appraisal_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appraisal_goals');
    }
};