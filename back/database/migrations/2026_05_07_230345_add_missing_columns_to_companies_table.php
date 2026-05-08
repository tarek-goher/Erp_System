<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::table('companies', function (Blueprint $table) {
        if (!Schema::hasColumn('companies', 'address')) {
            $table->string('address')->nullable()->after('email');
        }
        if (!Schema::hasColumn('companies', 'phone')) {
            $table->string('phone')->nullable()->after('address');
        }
        if (!Schema::hasColumn('companies', 'website')) {
            $table->string('website')->nullable()->after('phone');
        }
        if (!Schema::hasColumn('companies', 'currency')) {
            $table->string('currency')->nullable()->after('website');
        }
    });
}

public function down()
{
    Schema::table('companies', function (Blueprint $table) {
        $table->dropColumn(['address', 'phone', 'website', 'currency']);
    });
}
};
