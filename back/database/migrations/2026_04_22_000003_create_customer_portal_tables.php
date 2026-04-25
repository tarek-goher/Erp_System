<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Customer Portal Users
        Schema::create('portal_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('crm_contact_id')->constrained('crm_leads')->onDelete('cascade');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone')->nullable();
            $table->string('avatar_url')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended', 'pending'])->default('active');
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->dateTime('email_verified_at')->nullable();
            $table->dateTime('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Portal Ticket Submissions
        Schema::create('portal_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('portal_user_id')->constrained('portal_users')->onDelete('cascade');
            $table->foreignId('support_ticket_id')->nullable()->constrained('support_tickets')->onDelete('cascade');
            $table->string('title');
            $table->longText('description');
            $table->enum('category', ['billing', 'technical', 'general', 'feature_request'])->default('general');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'])->default('open');
            $table->json('attachments')->nullable();
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();
        });

        // Portal Orders
        Schema::create('portal_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('portal_user_id')->constrained('portal_users')->onDelete('cascade');
            $table->foreignId('sale_id')->nullable()->constrained('sales')->onDelete('cascade');
            $table->string('order_number')->unique();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'partial', 'paid', 'refunded'])->default('unpaid');
            $table->string('tracking_number')->nullable();
            $table->string('shipping_method')->nullable();
            $table->dateTime('shipped_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->timestamps();
        });

        // Portal Order Items
        Schema::create('portal_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('portal_order_id')->constrained('portal_orders')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->string('product_name');
            $table->string('sku')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->timestamps();
        });

        // Portal Invoices
        Schema::create('portal_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('portal_user_id')->constrained('portal_users')->onDelete('cascade');
            $table->foreignId('portal_order_id')->nullable()->constrained('portal_orders')->onDelete('cascade');
            $table->string('invoice_number')->unique();
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['draft', 'sent', 'viewed', 'partially_paid', 'paid'])->default('sent');
            $table->dateTime('issued_at');
            $table->dateTime('due_at');
            $table->dateTime('paid_at')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });

        // Portal Payments
        Schema::create('portal_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('portal_user_id')->constrained('portal_users')->onDelete('cascade');
            $table->foreignId('portal_invoice_id')->nullable()->constrained('portal_invoices')->onDelete('cascade');
            $table->string('payment_reference')->unique();
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->enum('method', ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe'])->default('credit_card');
            $table->text('transaction_id')->nullable();
            $table->json('payment_details')->nullable();
            $table->dateTime('processed_at')->nullable();
            $table->timestamps();
        });

        // Portal Knowledge Base
        Schema::create('portal_knowledge_base', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content');
            $table->string('category');
            $table->boolean('is_published')->default(true);
            $table->integer('views')->default(0);
            $table->integer('helpful_count')->default(0);
            $table->integer('not_helpful_count')->default(0);
            $table->timestamps();
        });

        // Portal Activity Log
        Schema::create('portal_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('portal_user_id')->constrained('portal_users')->onDelete('cascade');
            $table->string('action'); // 'login', 'view_ticket', 'submit_ticket', etc
            $table->string('model_type')->nullable();
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('changes')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });

        // Portal Settings
        Schema::create('portal_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->boolean('enable_self_service')->default(true);
            $table->boolean('enable_knowledge_base')->default(true);
            $table->boolean('enable_order_tracking')->default(true);
            $table->boolean('enable_payment_online')->default(true);
            $table->boolean('require_email_verification')->default(true);
            $table->integer('max_file_upload_size')->default(10); // MB
            $table->json('allowed_file_types')->nullable();
            $table->text('portal_description')->nullable();
            $table->string('portal_logo_url')->nullable();
            $table->string('portal_custom_domain')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portal_settings');
        Schema::dropIfExists('portal_activity_logs');
        Schema::dropIfExists('portal_knowledge_base');
        Schema::dropIfExists('portal_payments');
        Schema::dropIfExists('portal_invoices');
        Schema::dropIfExists('portal_order_items');
        Schema::dropIfExists('portal_orders');
        Schema::dropIfExists('portal_tickets');
        Schema::dropIfExists('portal_users');
    }
};
