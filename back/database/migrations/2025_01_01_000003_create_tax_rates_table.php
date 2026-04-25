<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name', 100);
            $table->decimal('rate', 8, 4);          // مثال: 14.0000%
            $table->enum('type', ['percentage','fixed'])->default('percentage');
            $table->enum('applies_to', ['sales','purchases','both'])->default('both');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('company_id');
        });
    }
    public function down(): void { Schema::dropIfExists('tax_rates'); }
};
