<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            
            // تاريخ العطلة
            $table->date('holiday_date');
            
            // اسم العطلة (مثل: عيد الفطر، عيد الأضحى، إلخ)
            $table->string('name');
            $table->string('name_ar')->nullable();
            
            // وصف العطلة (optional)
            $table->text('description')->nullable();
            
            // هل هذه عطلة متكررة سنوياً؟
            $table->boolean('is_recurring')->default(false);
            
            $table->timestamps();
            
            // Index على company_id و holiday_date (للبحث السريع)
            $table->index(['company_id', 'holiday_date']);
            
            // Unique على company_id و holiday_date (لا تكرار نفس العطلة)
            $table->unique(['company_id', 'holiday_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_holidays');
    }
};
