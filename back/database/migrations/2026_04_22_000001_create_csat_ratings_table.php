<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CSAT (Customer Satisfaction) — تقييم رضا العميل عن التذكرة
 *
 * يُربط بجدول support_tickets.
 * العميل يقيّم من 1 إلى 5 ويكتب تعليق اختياري.
 * كل تذكرة لها تقييم واحد فقط (unique constraint).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('csat_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')
                  ->unique()                          // تذكرة واحدة = تقييم واحد
                  ->constrained('support_tickets')
                  ->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');    // 1–5
            $table->text('comment')->nullable();
            $table->string('token', 64)->unique();    // رابط التقييم الفريد (للإيميل)
            $table->timestamp('rated_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'rated_at']);
        });

        // إضافة csat_rating على tickets لتسهيل analytics queries
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->unsignedTinyInteger('csat_rating')->nullable()->after('resolved_at');
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn('csat_rating');
        });
        Schema::dropIfExists('csat_ratings');
    }
};
