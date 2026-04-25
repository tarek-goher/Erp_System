// database/migrations/2026_04_08_000001_fix_missing_columns.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── إصلاح جدول companies ──────────────────────────────
        Schema::table('companies', function (Blueprint $table) {
            // الكود بيبعت subscription_plan لكن الـ column اسمه plan
            // نضيف subscription_plan كـ alias أو نضيف الـ column
            if (!Schema::hasColumn('companies', 'subscription_plan')) {
                $table->enum('subscription_plan', ['starter', 'professional', 'enterprise'])
                      ->default('starter')
                      ->after('plan');
            }
        });

        // ── إصلاح جدول subscriptions ─────────────────────────
        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'billing_cycle')) {
                $table->enum('billing_cycle', ['monthly', 'quarterly', 'yearly'])
                      ->default('monthly')
                      ->after('plan');
            }
            if (!Schema::hasColumn('subscriptions', 'auto_renew')) {
                $table->boolean('auto_renew')->default(true)->after('ends_at');
            }
            // تعديل status لو ناقص suspended
            // (الأصلي عنده active, cancelled, expired بس)
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            if (Schema::hasColumn('companies', 'subscription_plan'))
                $table->dropColumn('subscription_plan');
        });
        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'billing_cycle'))
                $table->dropColumn('billing_cycle');
            if (Schema::hasColumn('subscriptions', 'auto_renew'))
                $table->dropColumn('auto_renew');
        });
    }
};