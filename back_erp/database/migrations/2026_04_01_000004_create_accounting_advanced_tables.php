<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {

        Schema::create('bank_statements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
            $table->date('transaction_date');
            $table->text('description');
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->decimal('balance', 14, 2)->default(0);
            $table->string('reference')->nullable();
            $table->boolean('is_reconciled')->default(false);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category')->nullable();
            $table->decimal('purchase_value', 14, 2);
            $table->decimal('salvage_value', 14, 2)->default(0);
            $table->decimal('depreciation_rate', 5, 2)->default(0); // % سنوي
            $table->enum('depreciation_method', ['straight_line', 'declining_balance'])->default('straight_line');
            $table->date('purchase_date');
            $table->integer('useful_life_years')->default(5);
            $table->decimal('accumulated_depreciation', 14, 2)->default(0);
            $table->decimal('book_value', 14, 2)->storedAs('purchase_value - accumulated_depreciation');
            $table->enum('status', ['active', 'disposed', 'under_maintenance'])->default('active');
            $table->timestamps();
        });

        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
            $table->integer('month');
            $table->integer('year');
            $table->decimal('planned_amount', 14, 2)->default(0);
            $table->decimal('actual_amount', 14, 2)->default(0);
            $table->timestamps();
            $table->unique(['company_id', 'account_id', 'month', 'year']);
        });

        // إضافة حساب ضريبة VAT لشجرة الحسابات
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('tax_type')->nullable()->after('type'); // 'vat','withholding', null
        });
    }

    public function down(): void {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('tax_type');
        });
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('fixed_assets');
        Schema::dropIfExists('bank_statements');
    }
};
