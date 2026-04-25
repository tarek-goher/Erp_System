<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('knowledge_articles', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

 public function down(): void
{
    Schema::table('knowledge_articles', function (Blueprint $table) {
        $table->dropForeignKey(['created_by_foreign']);
        $table->dropColumn('created_by');
    });
}
};