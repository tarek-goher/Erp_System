<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE purchases 
            MODIFY COLUMN status ENUM(
                'draft','pending','approved','ordered','received','cancelled'
            ) NOT NULL DEFAULT 'draft'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE purchases 
            MODIFY COLUMN status ENUM(
                'ordered','received','cancelled'
            ) NOT NULL DEFAULT 'ordered'
        ");
    }
};