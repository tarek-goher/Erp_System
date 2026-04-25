<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_catalog', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');                         // "Request Laptop", "Leave Request"
            $table->text('description')->nullable();
            $table->string('icon')->nullable();             // emoji أو icon name
            $table->string('category');                    // IT | HR | Admin | Finance
            $table->json('form_schema');                   // حقول الفورم الديناميكية
            $table->string('default_priority')->default('medium'); // low|medium|high|urgent
            $table->string('default_assigned_role')->nullable();   // helpdesk_agent, etc.
            $table->integer('sla_hours')->default(24);
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['company_id', 'is_active', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_catalog');
    }
};