<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // جدول البنوك
        if (!Schema::hasTable('bank_accounts')) {
            Schema::create('bank_accounts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->string('name');
                $table->string('bank_name');
                $table->string('account_number')->unique();
                $table->string('branch_code')->nullable();
                $table->unsignedBigInteger('account_id'); // GL Account
                $table->string('currency')->default('USD');
                $table->decimal('opening_balance', 15, 2)->default(0);
                $table->enum('status', ['active', 'inactive', 'closed'])->default('active');
                $table->timestamps();
                
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->foreign('account_id')->references('id')->on('accounts')->onDelete('restrict');
                $table->index(['company_id', 'status']);
            });
        }

        // جدول كشف البنك
        if (!Schema::hasTable('bank_statements')) {
            Schema::create('bank_statements', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('bank_account_id');
                $table->date('statement_date');
                $table->decimal('opening_balance', 15, 2);
                $table->decimal('closing_balance', 15, 2);
                $table->integer('transaction_count')->default(0);
                $table->enum('status', ['draft', 'in_progress', 'reconciled', 'verified'])->default('draft');
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->foreign('bank_account_id')->references('id')->on('bank_accounts')->onDelete('cascade');
                $table->index(['company_id', 'statement_date']);
            });
        }

        // تفاصيل البنك
        if (!Schema::hasTable('bank_statement_details')) {
            Schema::create('bank_statement_details', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('bank_statement_id');
                $table->date('transaction_date');
                $table->string('reference')->nullable();
                $table->text('description');
                $table->decimal('debit', 15, 2)->nullable();
                $table->decimal('credit', 15, 2)->nullable();
                $table->decimal('balance', 15, 2);
                $table->unsignedBigInteger('matched_transaction_id')->nullable();
                $table->enum('status', ['unmatched', 'matched', 'pending'])->default('unmatched');
                $table->timestamps();
                
                $table->foreign('bank_statement_id')->references('id')->on('bank_statements')->onDelete('cascade');
                $table->index(['status', 'matched_transaction_id']);
            });
        }

        // تطابق المعاملات
        if (!Schema::hasTable('bank_reconciliations')) {
            Schema::create('bank_reconciliations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('bank_account_id');
                $table->unsignedBigInteger('bank_statement_id');
                $table->date('reconciliation_date');
                $table->decimal('statement_balance', 15, 2);
                $table->decimal('calculated_balance', 15, 2);
                $table->decimal('difference', 15, 2)->default(0);
                $table->integer('matched_count')->default(0);
                $table->integer('unmatched_count')->default(0);
                $table->enum('status', ['draft', 'completed', 'posted'])->default('draft');
                $table->unsignedBigInteger('reconciled_by')->nullable();
                $table->timestamp('reconciled_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                
                $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                $table->foreign('bank_account_id')->references('id')->on('bank_accounts')->onDelete('cascade');
                $table->foreign('bank_statement_id')->references('id')->on('bank_statements')->onDelete('cascade');
                $table->foreign('reconciled_by')->references('id')->on('users')->onDelete('set null');
                $table->index(['company_id', 'reconciliation_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_reconciliations');
        Schema::dropIfExists('bank_statement_details');
        Schema::dropIfExists('bank_statements');
        Schema::dropIfExists('bank_accounts');
    }
};
