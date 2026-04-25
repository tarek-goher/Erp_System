<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fix Field Naming Mismatch
 * ─────────────────────────
 * المشكلة: الـ Models كانت بتستخدم qty/price
 *          لكن الـ DB عنده quantity/unit_price
 *
 * الحل: نوحّد على quantity/unit_price (زي الـ DB)
 *       ونحدّث الـ Models تبعاً لده
 *
 * ملاحظة: لو عندك بيانات موجودة في الـ DB، الـ migration ده آمن
 *         لأنه بيـ rename الأعمدة مش بيمسحها
 */
return new class extends Migration
{
    public function up(): void
    {
        // sale_items: تأكيد إن الأعمدة صح (المشكلة كانت في الـ Model مش الـ DB)
        // الـ DB عنده quantity و unit_price — صح
        // الـ Model كان بيقول qty و price — غلط
        // الحل في الـ Model نفسه (راجع SaleItem.php)

        // لو احتجت تـ rename فعلاً (لو الـ DB اتعمل بالأسماء الغلط):
        if (Schema::hasColumn('sale_items', 'qty')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->renameColumn('qty',   'quantity');
                $table->renameColumn('price', 'unit_price');
            });
        }

        if (Schema::hasColumn('purchase_items', 'qty')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                $table->renameColumn('qty',   'quantity');
                $table->renameColumn('price', 'unit_price');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('sale_items', 'quantity')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->renameColumn('quantity',   'qty');
                $table->renameColumn('unit_price', 'price');
            });
        }

        if (Schema::hasColumn('purchase_items', 'quantity')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                $table->renameColumn('quantity',   'qty');
                $table->renameColumn('unit_price', 'price');
            });
        }
    }
};
