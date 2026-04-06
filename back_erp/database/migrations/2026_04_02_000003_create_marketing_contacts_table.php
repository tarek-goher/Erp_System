<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('marketing_contact_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['customers', 'leads', 'custom'])->default('custom');
            $table->timestamps();
        });

        Schema::create('marketing_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('list_id')->constrained('marketing_contact_lists')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('subscribed')->default(true);
            $table->timestamps();
        });

        // Link campaigns to contact lists
        Schema::table('campaigns', function (Blueprint $table) {
            if (!Schema::hasColumn('campaigns', 'contact_list_id')) {
                $table->foreignId('contact_list_id')->nullable()->constrained('marketing_contact_lists')->nullOnDelete();
            }
            if (!Schema::hasColumn('campaigns', 'sms_sender')) {
                $table->string('sms_sender')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropForeign(['contact_list_id']);
            $table->dropColumn(['contact_list_id', 'sms_sender']);
        });
        Schema::dropIfExists('marketing_contacts');
        Schema::dropIfExists('marketing_contact_lists');
    }
};
