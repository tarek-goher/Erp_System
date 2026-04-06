<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── SMS Config ────────────────────────────────────────────
        Schema::create('sms_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->enum('provider', ['twilio', 'vonage'])->default('twilio');
            $table->string('account_sid')->nullable();
            $table->text('auth_token')->nullable();
            $table->string('from_number')->nullable();
            $table->string('api_key')->nullable();
            $table->text('api_secret')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            $table->unique('company_id');
        });

        // ── SMS Logs ──────────────────────────────────────────────
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->nullable();
            $table->string('to');
            $table->text('message');
            $table->enum('status', ['sent', 'failed', 'pending'])->default('pending');
            $table->string('external_id')->nullable();
            $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ── Payment Gateway Config ────────────────────────────────
        Schema::create('payment_gateway_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->enum('provider', ['paymob', 'stripe'])->default('paymob');
            $table->text('paymob_api_key')->nullable();
            $table->string('paymob_iframe_id')->nullable();
            $table->string('paymob_integration_id')->nullable();
            $table->string('stripe_public_key')->nullable();
            $table->text('stripe_secret_key')->nullable();
            $table->string('currency', 3)->default('EGP');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            $table->unique('company_id');
        });

        // ── Payment Transactions ──────────────────────────────────
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->nullable();
            $table->string('order_id')->nullable();
            $table->integer('amount_cents')->default(0);
            $table->string('currency', 3)->default('EGP');
            $table->enum('status', ['pending', 'success', 'failed', 'refunded'])->default('pending');
            $table->string('reference')->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamps();
        });

        // ── Auto-Assignment Rules ─────────────────────────────────
        Schema::create('auto_assignment_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('condition_type', ['category', 'priority', 'keyword', 'source']);
            $table->string('condition_value');
            $table->foreignId('assign_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('assign_to_team')->nullable();
            $table->integer('priority')->default(10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── Escalation Rules ──────────────────────────────────────
        Schema::create('escalation_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('condition', ['response_time', 'resolution_time', 'priority']);
            $table->integer('threshold_hours')->default(24);
            $table->foreignId('escalate_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('escalate_to_email')->nullable();
            $table->json('notify_by')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── IP Whitelist ──────────────────────────────────────────
        Schema::create('ip_whitelist_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('ip_address', 50);
            $table->string('label')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── API Keys ──────────────────────────────────────────────
        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('key_hash', 64)->unique();
            $table->json('scopes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // ── 2FA Columns on Users ──────────────────────────────────
        if (!Schema::hasColumn('users', 'two_factor_enabled')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('two_factor_enabled')->default(false)->after('password');
                $table->text('two_factor_secret')->nullable()->after('two_factor_enabled');
                $table->text('two_factor_secret_pending')->nullable()->after('two_factor_secret');
                $table->text('two_factor_backup_codes')->nullable()->after('two_factor_secret_pending');
            });
        }

        // ── IMAP columns on mail_configs ──────────────────────────
        if (!Schema::hasColumn('mail_configs', 'imap_host')) {
            Schema::table('mail_configs', function (Blueprint $table) {
                $table->string('imap_host')->nullable()->after('mail_password');
                $table->integer('imap_port')->default(993)->after('imap_host');
                $table->string('imap_username')->nullable()->after('imap_port');
                $table->text('imap_password')->nullable()->after('imap_username');
                $table->enum('imap_encryption', ['ssl', 'tls', 'none'])->default('ssl')->after('imap_password');
            });
        }

        // ── Escalation columns on support_tickets ─────────────────
        if (!Schema::hasColumn('support_tickets', 'is_escalated')) {
            Schema::table('support_tickets', function (Blueprint $table) {
                $table->boolean('is_escalated')->default(false)->after('status');
                $table->timestamp('escalated_at')->nullable()->after('is_escalated');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete()->after('escalated_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('api_keys');
        Schema::dropIfExists('ip_whitelist_entries');
        Schema::dropIfExists('escalation_rules');
        Schema::dropIfExists('auto_assignment_rules');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payment_gateway_configs');
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('sms_configs');
    }
};
