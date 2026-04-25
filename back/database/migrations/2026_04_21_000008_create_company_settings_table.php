<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            
            // Business hours (ساعات العمل)
            $table->time('work_start_hour')->default('09:00');
            $table->time('work_end_hour')->default('17:00');
            
            // Weekend days (أيام العطل) - JSON array من أرقام الأيام
            // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
            // في مصر: 5, 6 (جمعة + سبت)
            $table->json('weekend_days')->default(json_encode([5, 6]));
            
            // Timezone
            $table->string('timezone')->default('Africa/Cairo');
            
            // اسم الشركة بصيغة أخرى (optional)
            $table->string('company_name_ar')->nullable();
            $table->string('company_name_en')->nullable();
            
            // Contact info
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            
            // Logo و الصور
            $table->string('logo_url')->nullable();
            $table->string('favicon_url')->nullable();
            
            // General settings
            $table->boolean('enable_sms_notifications')->default(false);
            $table->boolean('enable_email_notifications')->default(true);
            $table->boolean('enable_push_notifications')->default(false);
            
            $table->timestamps();
            
            // Unique على company_id
            $table->unique('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
