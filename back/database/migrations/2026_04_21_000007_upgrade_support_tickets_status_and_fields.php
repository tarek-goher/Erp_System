<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            // رقم تذكرة مميز مثل SD-2026-0001
            if (!Schema::hasColumn('support_tickets', 'ticket_number')) {
                $table->string('ticket_number')->nullable()->unique()->after('id');
            }

            // ربط بـ Employee (طالب الخدمة)
            if (!Schema::hasColumn('support_tickets', 'requester_id')) {
                $table->foreignId('requester_id')->nullable()->constrained('users')->nullOnDelete()->after('company_id');
            }

            // ربط بـ Service Catalog
            if (!Schema::hasColumn('support_tickets', 'service_id')) {
                $table->foreignId('service_id')->nullable()->constrained('service_catalog')->nullOnDelete()->after('requester_id');
            }

            // بيانات الفورم الديناميكي من الـ Service Catalog
            if (!Schema::hasColumn('support_tickets', 'form_data')) {
                $table->json('form_data')->nullable()->after('service_id');
            }
        });

        // تحديث enum الـ status لإضافة assigned و waiting_user
        // MySQL: ALTER TABLE مباشرة
        DB::statement("ALTER TABLE support_tickets MODIFY COLUMN status ENUM('open','assigned','in_progress','waiting_user','resolved','closed') NOT NULL DEFAULT 'open'");
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropForeign(['requester_id']);
            $table->dropForeign(['service_id']);
            $table->dropColumn(['ticket_number', 'requester_id', 'service_id', 'form_data']);
        });

        DB::statement("ALTER TABLE support_tickets MODIFY COLUMN status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open'");
    }
};