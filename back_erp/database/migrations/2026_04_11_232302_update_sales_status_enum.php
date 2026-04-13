<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    DB::statement("
        ALTER TABLE sales 
        MODIFY COLUMN status 
        ENUM('draft','quotation','pending','completed','cancelled','refunded') 
        NOT NULL DEFAULT 'draft'
    ");
}

public function down(): void
{
    DB::statement("
        ALTER TABLE sales 
        MODIFY COLUMN status 
        ENUM('draft','quotation','pending','completed','cancelled') 
        NOT NULL DEFAULT 'draft'
    ");
}
};
