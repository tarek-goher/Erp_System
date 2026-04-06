<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // إضافة purchase_price لجدول المنتجات
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'purchase_price')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('purchase_price', 15, 2)->nullable()->after('price')
                      ->comment('سعر الشراء');
            });
        }

        // إضافة tax_amount و order_number لجدول المشتريات
        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                if (!Schema::hasColumn('purchases', 'tax_amount')) {
                    $table->decimal('tax_amount', 15, 2)->default(0)->after('subtotal')
                          ->comment('قيمة الضريبة');
                }
                if (!Schema::hasColumn('purchases', 'order_number')) {
                    $table->string('order_number')->nullable()->after('id')
                          ->comment('رقم الطلب للفرونت');
                }
                if (!Schema::hasColumn('purchases', 'status')) {
                    $table->string('status')->default('draft')->after('total');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'purchase_price')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('purchase_price');
            });
        }
        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                $cols = ['tax_amount', 'order_number'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('purchases', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
