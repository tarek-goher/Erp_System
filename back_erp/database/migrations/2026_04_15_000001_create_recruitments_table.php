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
    Schema::create('recruitments', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('company_id')->index();
        $table->string('title');
        $table->string('department')->nullable();
        $table->string('location')->nullable();
        $table->enum('status', ['open', 'closed', 'draft'])->default('open');
        $table->integer('vacancies')->default(1);
        $table->text('description')->nullable();
        $table->text('requirements')->nullable();
        $table->date('deadline')->nullable();
        $table->timestamps();
        $table->softDeletes();

        $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
    });
}

public function down(): void
{
    Schema::dropIfExists('recruitments');
}
};
