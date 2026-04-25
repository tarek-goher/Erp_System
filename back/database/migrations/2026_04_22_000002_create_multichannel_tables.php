<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Multi-Channel Integration Settings
        Schema::create('channel_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->enum('channel_type', ['whatsapp', 'facebook', 'instagram', 'telegram', 'email'])->index();
            $table->string('channel_name');
            $table->text('api_credentials')->encrypted();
            $table->string('webhook_url')->nullable();
            $table->string('webhook_token')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable(); // rate_limit, features, etc
            $table->dateTime('last_synced_at')->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'channel_type']);
        });

        // Channel Contact Mapping (MUST be before channel_messages)
        Schema::create('channel_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('crm_contact_id')->nullable()->constrained('crm_leads')->onDelete('set null');
            $table->enum('channel_type', ['whatsapp', 'facebook', 'instagram', 'telegram', 'email']);
            $table->string('channel_identifier'); // phone, page_id, email, etc
            $table->string('display_name')->nullable();
            $table->string('avatar_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'channel_type', 'channel_identifier'], 'cc_company_type_id_unique');
        });

        // Unified Messages (across all channels)
        Schema::create('channel_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('channel_integration_id')->constrained('channel_integrations')->onDelete('cascade');
            $table->foreignId('ticket_id')->nullable()->constrained('support_tickets')->onDelete('cascade');
            $table->foreignId('contact_id')->nullable()->constrained('channel_contacts')->onDelete('set null');
            $table->string('external_message_id')->unique();
            $table->string('external_contact_id');
            $table->string('contact_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->enum('direction', ['inbound', 'outbound'])->index();
            $table->longText('message_content');
            $table->json('media')->nullable(); // urls, types, sizes
            $table->enum('status', ['pending', 'sent', 'delivered', 'read', 'failed'])->default('pending');
            $table->json('metadata')->nullable(); // channel-specific data
            $table->dateTime('sent_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->dateTime('read_at')->nullable();
            $table->timestamps();
        });

        // Conversation Threads
        Schema::create('channel_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('ticket_id')->nullable()->constrained('support_tickets')->onDelete('cascade');
            $table->string('external_conversation_id')->unique();
            $table->string('contact_phone_or_id');
            $table->string('contact_name')->nullable();
            $table->json('channels')->nullable(); // which channels this conversation spans
            $table->enum('status', ['open', 'pending', 'resolved', 'closed'])->default('open');
            $table->foreignId('assigned_agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('message_count')->default(0);
            $table->dateTime('last_message_at')->nullable();
            $table->dateTime('closed_at')->nullable();
            $table->timestamps();
        });

        // WhatsApp Specific
        Schema::create('whatsapp_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('template_name');
            $table->string('external_template_id')->unique();
            $table->longText('content');
            $table->json('variables')->nullable();
            $table->enum('status', ['approved', 'rejected', 'pending', 'disabled'])->default('pending');
            $table->string('category'); // marketing, transactional, etc
            $table->timestamps();
        });

        // Facebook/Instagram Settings
        Schema::create('social_media_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->enum('platform', ['facebook', 'instagram'])->index();
            $table->string('page_id');
            $table->string('page_name');
            $table->string('page_access_token')->encrypted();
            $table->json('business_info')->nullable();
            $table->boolean('auto_reply_enabled')->default(true);
            $table->text('auto_reply_message')->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'platform', 'page_id'], 'sms_company_platform_page_unique');
        });

        // Message Analytics
        Schema::create('channel_message_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->enum('channel_type', ['whatsapp', 'facebook', 'instagram']);
            $table->date('date');
            $table->integer('inbound_messages')->default(0);
            $table->integer('outbound_messages')->default(0);
            $table->integer('failed_messages')->default(0);
            $table->decimal('avg_response_time', 10, 2)->default(0);
            $table->integer('total_conversations')->default(0);
            $table->integer('resolved_conversations')->default(0);
            $table->timestamps();
            $table->unique(['company_id', 'channel_type', 'date'], 'cma_company_type_date_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channel_message_analytics');
        Schema::dropIfExists('channel_contacts');
        Schema::dropIfExists('social_media_settings');
        Schema::dropIfExists('whatsapp_templates');
        Schema::dropIfExists('channel_conversations');
        Schema::dropIfExists('channel_messages');
        Schema::dropIfExists('channel_integrations');
    }
};