<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('sales', function (Blueprint $table) {
            $table->enum('sale_type', ['invoice', 'quotation'])->default('invoice')->after('status');
            $table->string('payment_terms')->nullable()->after('payment_method'); // e.g. 'immediate','net30','net60'
            $table->date('valid_until')->nullable()->after('payment_terms');      // للعروض
            $table->unsignedBigInteger('converted_from_id')->nullable()->after('valid_until'); // quotation → invoice
        });
    }

    public function down(): void {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['sale_type', 'payment_terms', 'valid_until', 'converted_from_id']);
        });
    }
};
