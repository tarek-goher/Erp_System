<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('mail_configs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->unique();
            $table->string('host', 255);
            $table->unsignedSmallInteger('port')->default(587);
            $table->string('username', 255);
            $table->text('mail_password')->nullable(); // غيرنا الاسم هنا عشان يوافق ملف 2026
            $table->string('imap_host')->nullable();    // زودنا ده عشان التحديثات الجديدة
            $table->enum('encryption', ['tls','ssl','none'])->default('tls');
            $table->string('from_email', 255);
            $table->string('from_name', 255);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('mail_configs'); }
};