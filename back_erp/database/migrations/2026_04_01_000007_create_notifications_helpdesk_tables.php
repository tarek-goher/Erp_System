<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {

        Schema::create('erp_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');       // 'low_stock','invoice_due','leave_request', etc.
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->string('icon')->nullable();
            $table->string('url')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'read_at']);
        });

        // ticket_messages — ردود متعددة على التذكرة
        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->enum('sender_type', ['company', 'admin'])->default('company');
            $table->json('attachments')->nullable();
            $table->timestamps();
        });

        // knowledge_articles — قاعدة المعرفة
        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete(); // null = عام لكل الشركات
            $table->string('title');
            $table->text('content');
            $table->string('category')->nullable();
            $table->boolean('is_published')->default(false);
            $table->integer('views')->default(0);
            $table->timestamps();
        });

        // إضافة SLA للتذاكر
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->timestamp('first_response_at')->nullable()->after('resolved_at');
            $table->integer('response_time_hours')->nullable()->after('first_response_at');
            $table->json('attachments')->nullable()->after('response_time_hours');
        });
    }

    public function down(): void {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn(['first_response_at', 'response_time_hours', 'attachments']);
        });
        Schema::dropIfExists('knowledge_articles');
        Schema::dropIfExists('ticket_messages');
        Schema::dropIfExists('erp_notifications');
    }
};
