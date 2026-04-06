<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('fuel_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->decimal('liters', 10, 2)->default(0);
            $table->decimal('price_per_liter', 10, 2)->default(0);
            $table->decimal('total_cost', 12, 2)->default(0);
            $table->integer('odometer')->default(0);
            $table->string('station')->nullable();
            $table->boolean('full_tank')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_logs'); }
};
