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
    Schema::table('branches', function (Blueprint $table) {
        $table->string('email')->nullable()->after('phone');
        $table->string('code')->nullable()->after('name');
        $table->string('city')->nullable()->after('email');
        $table->string('manager_name')->nullable()->after('city');
        $table->string('status')->default('active')->after('manager_name');
        $table->integer('employees_count')->default(0)->after('status');
        $table->decimal('monthly_sales', 15, 2)->default(0)->after('employees_count');
    });
}

public function down()
{
    Schema::table('branches', function (Blueprint $table) {
        $table->dropColumn(['email', 'code', 'city', 'manager_name', 'status', 'employees_count', 'monthly_sales']);
    });
}
};
