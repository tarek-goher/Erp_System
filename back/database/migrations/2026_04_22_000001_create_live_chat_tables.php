<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Live Chat Visitors
        Schema::create('live_chat_visitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('session_id')->unique();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('browser')->nullable();
            $table->string('device')->nullable();
            $table->text('current_page')->nullable();
            $table->text('referrer')->nullable();
            $table->enum('status', ['online', 'idle', 'offline'])->default('online');
            $table->dateTime('last_activity_at');
            $table->timestamps();
        });

        // Live Chat Sessions
        Schema::create('live_chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('visitor_id')->constrained('live_chat_visitors')->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('session_token')->unique();
            $table->enum('status', ['pending', 'active', 'closed', 'transferred'])->default('pending');
            $table->dateTime('started_at');
            $table->dateTime('assigned_at')->nullable();
            $table->dateTime('ended_at')->nullable();
            $table->integer('wait_time_seconds')->nullable();
            $table->integer('chat_duration_seconds')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Live Chat Messages
        Schema::create('live_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('session_id')->constrained('live_chat_sessions')->onDelete('cascade');
            $table->foreignId('sender_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('sender_type'); // 'visitor', 'agent', 'bot'
            $table->longText('message');
            $table->json('attachments')->nullable();
            $table->enum('message_type', ['text', 'file', 'image', 'video'])->default('text');
            $table->boolean('is_read')->default(false);
            $table->dateTime('read_at')->nullable();
            $table->timestamps();
        });

        // Chat Agents (Status & Availability)
        Schema::create('live_chat_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['available', 'busy', 'away', 'offline'])->default('offline');
            $table->integer('max_concurrent_chats')->default(5);
            $table->integer('current_chats')->default(0);
            $table->text('bio')->nullable();
            $table->string('avatar_url')->nullable();
            $table->dateTime('last_seen_at')->nullable();
            $table->timestamps();
        });

        // Chat Routing Rules
        Schema::create('live_chat_routing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['round_robin', 'load_balanced', 'skill_based'])->default('round_robin');
            $table->json('agent_ids');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Chat Analytics
        Schema::create('live_chat_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->date('date');
            $table->integer('total_sessions')->default(0);
            $table->integer('missed_chats')->default(0);
            $table->decimal('avg_wait_time', 10, 2)->default(0);
            $table->decimal('avg_chat_duration', 10, 2)->default(0);
            $table->decimal('satisfaction_score', 3, 2)->default(0);
            $table->integer('total_messages')->default(0);
            $table->timestamps();
            $table->unique(['company_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_chat_analytics');
        Schema::dropIfExists('live_chat_routing_rules');
        Schema::dropIfExists('live_chat_agents');
        Schema::dropIfExists('live_chat_messages');
        Schema::dropIfExists('live_chat_sessions');
        Schema::dropIfExists('live_chat_visitors');
    }
};
