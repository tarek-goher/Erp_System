<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. جدول الفنيين
        if (!Schema::hasTable('field_technicians')) {
            Schema::create('field_technicians', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('employee_id');
                $table->string('license_number')->nullable()->unique();
                $table->date('license_expiry')->nullable();
                $table->json('skills')->nullable(); 
                $table->decimal('hourly_rate', 10, 2);
                $table->enum('status', ['active', 'inactive', 'on_leave'])->default('active');
                $table->string('phone')->nullable();
                $table->text('address')->nullable();
                // تعديل: استخدام geometry بدل point
                $table->geometry('location')->nullable(); 
                $table->timestamps();
                
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
                $table->index(['company_id', 'status']);
            });
        }

        // 2. جدول طلبات الخدمة الميدانية
        if (!Schema::hasTable('field_service_requests')) {
            Schema::create('field_service_requests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('customer_id');
                $table->unsignedBigInteger('assigned_technician_id')->nullable();
                $table->string('reference')->unique();
                $table->text('description');
                // تعديل: geometry سادة بدون باراميتر 'point'
                $table->geometry('location')->nullable(); 
                $table->datetime('scheduled_date');
                $table->datetime('actual_start')->nullable();
                $table->datetime('actual_end')->nullable();
                $table->decimal('estimated_duration', 8, 2); 
                $table->decimal('actual_duration', 8, 2)->nullable(); 
                $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
                $table->enum('status', ['new', 'assigned', 'in_progress', 'completed', 'cancelled'])->default('new');
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
                $table->foreign('assigned_technician_id')->references('id')->on('field_technicians')->onDelete('set null');
                $table->index(['company_id', 'status', 'scheduled_date']);
            });
        }

        // 3. جدول تفاصيل الخدمة
        if (!Schema::hasTable('field_service_details')) {
            Schema::create('field_service_details', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('field_service_request_id');
                $table->string('item_type'); 
                $table->unsignedBigInteger('item_id');
                $table->integer('quantity')->default(1);
                $table->decimal('unit_price', 10, 2);
                $table->decimal('total_price', 10, 2);
                $table->text('description')->nullable();
                $table->timestamps();
                
                $table->foreign('field_service_request_id')->references('id')->on('field_service_requests')->onDelete('cascade');
                $table->index('field_service_request_id');
            });
        }

        // 4. جدول تقارير الخدمة الميدانية
        if (!Schema::hasTable('field_service_reports')) {
            Schema::create('field_service_reports', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('field_service_request_id');
                $table->unsignedBigInteger('technician_id');
                $table->text('summary');
                $table->text('work_done');
                $table->text('issues_found')->nullable();
                $table->text('recommendations')->nullable();
                $table->json('images')->nullable(); 
                $table->decimal('total_amount', 10, 2);
                $table->enum('customer_signature_status', ['pending', 'signed', 'rejected'])->default('pending');
                $table->text('customer_signature')->nullable(); 
                $table->timestamp('signed_at')->nullable();
                $table->timestamps();
                
                $table->foreign('field_service_request_id')->references('id')->on('field_service_requests')->onDelete('cascade');
                $table->foreign('technician_id')->references('id')->on('field_technicians')->onDelete('restrict');
                $table->unique('field_service_request_id');
            });
        }

        // 5. جدول تتبع الفنيين
        if (!Schema::hasTable('field_technician_tracking')) {
            Schema::create('field_technician_tracking', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('field_technician_id');
                // تعديل: geometry سادة
                $table->geometry('location');
                $table->dateTime('timestamp');
                $table->float('accuracy')->nullable(); 
                $table->string('source')->default('mobile'); 
                $table->timestamps();
                
                $table->foreign('field_technician_id')->references('id')->on('field_technicians')->onDelete('cascade');
                $table->index(['field_technician_id', 'timestamp']);
            });
        }

        // 6. جدول تقييم الفنيين
        if (!Schema::hasTable('field_technician_ratings')) {
            Schema::create('field_technician_ratings', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('field_service_request_id');
                $table->unsignedBigInteger('technician_id');
                $table->unsignedBigInteger('customer_id');
                $table->integer('rating')->default(5); 
                $table->text('comment')->nullable();
                $table->timestamps();
                
                $table->foreign('field_service_request_id')->references('id')->on('field_service_requests')->onDelete('cascade');
                $table->foreign('technician_id')->references('id')->on('field_technicians')->onDelete('cascade');
                $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
                $table->index(['technician_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('field_technician_ratings');
        Schema::dropIfExists('field_technician_tracking');
        Schema::dropIfExists('field_service_reports');
        Schema::dropIfExists('field_service_details');
        Schema::dropIfExists('field_service_requests');
        Schema::dropIfExists('field_technicians');
    }
};