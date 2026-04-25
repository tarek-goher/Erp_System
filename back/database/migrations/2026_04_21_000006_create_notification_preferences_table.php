<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('email_on_assigned')->default(true);
            $table->boolean('email_on_status_change')->default(true);
            $table->boolean('email_on_reply')->default(true);
            $table->boolean('email_on_escalation')->default(true);
            $table->boolean('inapp_on_assigned')->default(true);
            $table->boolean('inapp_on_status_change')->default(true);
            $table->boolean('inapp_on_reply')->default(true);
            $table->boolean('inapp_on_escalation')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};