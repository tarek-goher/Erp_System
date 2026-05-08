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
    Schema::table('payrolls', function (Blueprint $table) {
        if (!Schema::hasColumn('payrolls', 'allowances')) {
            $table->decimal('allowances', 15, 2)->default(0)->after('basic_salary');
        }
        if (!Schema::hasColumn('payrolls', 'deductions')) {
            $table->decimal('deductions', 15, 2)->default(0)->after('allowances');
        }
    });
}

public function down()
{
    Schema::table('payrolls', function (Blueprint $table) {
        $table->dropColumn(['allowances', 'deductions']);
    });
}
};
