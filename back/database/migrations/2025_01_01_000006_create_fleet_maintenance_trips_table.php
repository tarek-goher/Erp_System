<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('maintenance_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('vehicle_id');
            $table->string('type', 100);
            $table->text('description')->nullable();
            $table->decimal('cost', 15, 2)->default(0);
            $table->date('date');
            $table->date('next_date')->nullable();
            $table->decimal('odometer', 10, 2)->nullable();
            $table->timestamps();
            $table->index(['company_id', 'vehicle_id']);
        });

        Schema::create('fleet_trips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('vehicle_id');
            $table->unsignedBigInteger('driver_id')->nullable();
            $table->date('trip_date');
            $table->string('origin', 200);
            $table->string('destination', 200);
            $table->decimal('distance_km', 10, 2)->default(0);
            $table->string('purpose', 300)->nullable();
            $table->timestamps();
            $table->index(['company_id', 'vehicle_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('fleet_trips');
        Schema::dropIfExists('maintenance_records');
    }
};
