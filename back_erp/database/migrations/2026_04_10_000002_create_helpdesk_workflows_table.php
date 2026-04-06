<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('helpdesk_workflows', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('trigger'); // ticket_created, sla_breach, etc.
            $table->json('conditions')->nullable(); // array of condition objects
            $table->json('actions')->nullable();    // array of action objects
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('runs')->default(0);
            $table->timestamp('last_run')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('helpdesk_workflows');
    }
};
