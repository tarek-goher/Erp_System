<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::create('supplier_ledger', function (Blueprint $table) {
        $table->id();
        $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
        $table->foreignId('company_id')->constrained()->cascadeOnDelete();
        $table->enum('type', ['invoice', 'payment', 'return', 'adjustment']);
        $table->decimal('amount', 15, 2);
        $table->enum('direction', ['debit', 'credit']); // debit = عليك، credit = ليك
        $table->decimal('balance_after', 15, 2)->default(0);
        $table->string('reference')->nullable();   // رقم الفاتورة أو المرجع
        $table->text('notes')->nullable();
        $table->foreignId('created_by')->nullable()->constrained('users');
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('supplier_ledger');
}
};
