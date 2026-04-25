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
        Schema::create('appraisal_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name'); // مثل: "Standard Performance Appraisal"
            $table->string('name_ar')->nullable(); // مثل: "تقييم الأداء القياسي"
            $table->json('criteria')->nullable(); // مثل: [{"key": "communication", "label": "Communication", "weight": 20}]
            $table->timestamps();
            
            $table->index('company_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appraisal_templates');
    }
};