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
    Schema::table('purchase_invoices', function (Blueprint $table) {
        $table->foreignId('purchase_id')->nullable()->change();
        
        $table->enum('status', [
            'draft', 'pending', 'matched', 'discrepancy',
            'approved', 'paid', 'overdue', 'cancelled'
        ])->default('draft')->change();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
