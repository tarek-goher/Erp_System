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
        // ── Applicants Table ─────────────────────────────────────
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('job_id')->index();
            
            // Personal Information
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            
            // CV & Documents
            $table->string('cv_url')->nullable();
            $table->string('cv_file_name')->nullable();
            $table->unsignedBigInteger('cv_file_size')->nullable();
            $table->longText('cover_letter')->nullable();
            
            // Pipeline Management
            $table->enum('pipeline_stage', [
                'Applied',
                'Screening',
                'Interview',
                'Offer',
                'Hired',
                'Rejected'
            ])->default('Applied')->index();
            
            // Rating & Notes
            $table->unsignedTinyInteger('rating')->nullable(); // 1-5 stars
            $table->longText('notes')->nullable();
            
            // Timestamps
            $table->dateTime('applied_date')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign Keys - تم تصحيح اسم الجدول من 'recruitment' إلى 'recruitments'
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('job_id')->references('id')->on('recruitments')->onDelete('cascade');
            
            // Indexes
            $table->index(['company_id', 'pipeline_stage']);
            $table->index(['company_id', 'job_id']);
            $table->index(['email', 'company_id']);
        });

        // ── Applicant Pipeline History Table ──────────────────────
        Schema::create('applicant_pipeline_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_id')->index();
            $table->string('from_stage');
            $table->string('to_stage');
            $table->unsignedBigInteger('changed_by')->nullable(); // User who made the change
            $table->dateTime('changed_at')->index();
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('applicant_id')->references('id')->on('applicants')->onDelete('cascade');
            $table->foreign('changed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicant_pipeline_history');
        Schema::dropIfExists('applicants');
    }
};