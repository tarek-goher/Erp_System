<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sla_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name');
            $table->string('priority')->default('medium'); // low, medium, high, urgent
            $table->integer('first_response_hours')->default(24);
            $table->integer('resolution_hours')->default(72);
            $table->boolean('business_hours_only')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add SLA fields to support_tickets
        Schema::table('support_tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('support_tickets', 'sla_policy_id')) {
                $table->foreignId('sla_policy_id')->nullable()->constrained('sla_policies')->nullOnDelete();
            }
            if (!Schema::hasColumn('support_tickets', 'sla_breached')) {
                $table->boolean('sla_breached')->default(false);
            }
            if (!Schema::hasColumn('support_tickets', 'resolution_due_at')) {
                $table->timestamp('resolution_due_at')->nullable();
            }
            if (!Schema::hasColumn('support_tickets', 'first_response_due_at')) {
                $table->timestamp('first_response_due_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropForeign(['sla_policy_id']);
            $table->dropColumn(['sla_policy_id','sla_breached','resolution_due_at','first_response_due_at']);
        });
        Schema::dropIfExists('sla_policies');
    }
};
