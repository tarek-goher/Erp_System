<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('plate');
            $table->string('type')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->float('odometer')->default(0);
            $table->enum('fuel_type', ['petrol','diesel','electric','hybrid'])->default('petrol');
            $table->enum('status', ['available','in_use','maintenance','retired'])->default('available');
            $table->string('assigned_to')->nullable();
            $table->date('next_service_date')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('vehicle_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['trip','maintenance','fuel','insurance','other'])->default('trip');
            $table->date('date');
            $table->text('description')->nullable();
            $table->float('odometer')->nullable();
            $table->float('cost')->default(0);
            $table->string('driver')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_logs');
        Schema::dropIfExists('vehicles');
    }
};
