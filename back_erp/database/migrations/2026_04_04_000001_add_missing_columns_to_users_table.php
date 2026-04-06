<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'last_login_at'))
                $table->timestamp('last_login_at')->nullable()->after('is_active');
            if (!Schema::hasColumn('users', 'is_super_admin'))
                $table->boolean('is_super_admin')->default(false)->after('is_active');
            if (!Schema::hasColumn('users', 'two_factor_secret'))
                $table->text('two_factor_secret')->nullable();
            if (!Schema::hasColumn('users', 'two_factor_enabled'))
                $table->boolean('two_factor_enabled')->default(false);
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $cols = ['last_login_at','two_factor_secret','two_factor_enabled'];
            foreach ($cols as $col)
                if (Schema::hasColumn('users', $col)) $table->dropColumn($col);
        });
    }
};
