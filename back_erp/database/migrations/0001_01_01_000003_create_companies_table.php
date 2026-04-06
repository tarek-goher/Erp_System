<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('companies')) {
            return;
        }

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_type')->nullable();
            $table->string('country')->default('مصر');
            $table->string('phone')->nullable();
            $table->string('email')->unique()->nullable();
            $table->string('logo')->nullable();
            $table->enum('status', ['active', 'suspended', 'under_review', 'inactive'])
                  ->default('under_review');
            $table->enum('plan', ['starter', 'professional', 'enterprise'])->default('professional');
            $table->boolean('is_active')->default(false);
            $table->string('db_name')->nullable();
            $table->json('settings')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
