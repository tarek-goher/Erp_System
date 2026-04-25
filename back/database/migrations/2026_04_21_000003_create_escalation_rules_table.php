<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MERGED Migration — escalation_rules
 *
 * الجدول موجود بالفعل في: 2026_04_10_000001_create_new_integrations_tables.php
 * بـ schema قديم (condition / threshold_hours / escalate_to_user_id ...)
 *
 * هذه المايجريشن تضيف الأعمدة الجديدة من Service Desk فوق القديمة
 * بدل ما تحذف وتعيد الإنشاء (عشان نحافظ على البيانات الموجودة)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('escalation_rules', function (Blueprint $table) {
            // أعمدة Service Desk الجديدة - بس لو مش موجودة
            if (!Schema::hasColumn('escalation_rules', 'trigger')) {
                $table->string('trigger')->nullable()->after('name');
            }
            if (!Schema::hasColumn('escalation_rules', 'after_hours')) {
                $table->integer('after_hours')->nullable()->after('trigger');
            }
            if (!Schema::hasColumn('escalation_rules', 'action')) {
                $table->string('action')->nullable()->after('after_hours');
            }
            if (!Schema::hasColumn('escalation_rules', 'action_data')) {
                $table->json('action_data')->nullable()->after('action');
            }
        });
    }

    public function down(): void
    {
        Schema::table('escalation_rules', function (Blueprint $table) {
            $table->dropColumn(array_filter([
                Schema::hasColumn('escalation_rules', 'trigger')    ? 'trigger'     : null,
                Schema::hasColumn('escalation_rules', 'after_hours') ? 'after_hours' : null,
                Schema::hasColumn('escalation_rules', 'action')     ? 'action'      : null,
                Schema::hasColumn('escalation_rules', 'action_data') ? 'action_data' : null,
            ]));
        });
    }
};
