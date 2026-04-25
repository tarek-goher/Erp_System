<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('fixed_assets', function (Blueprint $table) {
            $table->string('asset_code', 50)->nullable()->after('category');
            $table->string('location', 150)->nullable()->after('asset_code');
            $table->string('vendor', 150)->nullable()->after('location');
        });
    }

    public function down(): void
    {
        Schema::table('fixed_assets', function (Blueprint $table) {
            $table->dropColumn(['asset_code', 'location', 'vendor']);
        });
    }
};