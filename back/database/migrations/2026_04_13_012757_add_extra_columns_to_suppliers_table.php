<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('name');
            $table->enum('type', ['company', 'individual'])->default('company')->after('code');
            $table->enum('status', ['active', 'suspended', 'blocked'])->default('active')->after('type');
            $table->string('city', 100)->nullable()->after('address');
            $table->string('street', 255)->nullable()->after('city');
            $table->string('contact_person', 150)->nullable()->after('street');
            $table->string('contact_phone', 20)->nullable()->after('contact_person');
            $table->enum('payment_method', ['cash', 'bank_transfer', 'deferred'])->default('cash')->after('payment_terms');
            $table->string('bank_name', 150)->nullable()->after('payment_method');
            $table->string('bank_account', 100)->nullable()->after('bank_name');
            $table->text('products_notes')->nullable()->after('bank_account');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn([
                'code', 'type', 'status', 'city', 'street',
                'contact_person', 'contact_phone', 'payment_method',
                'bank_name', 'bank_account', 'products_notes',
            ]);
        });
    }
};