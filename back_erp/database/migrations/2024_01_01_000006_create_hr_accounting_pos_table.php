<?php
// ════════════════════════════════════════════
// database/migrations/2024_01_01_000006_create_hr_accounting_pos_table.php
// ════════════════════════════════════════════
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {

        // ══════════════════════════════════════
        // HR - الموارد البشرية
        // ══════════════════════════════════════

Schema::create('employees', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->cascadeOnDelete(); // <-- أضف هذا
    $table->string('name');
    $table->string('role');
    $table->string('department');
    $table->decimal('salary', 10, 2)->default(0);
    $table->string('phone')->nullable();
    $table->string('email')->nullable();
    $table->date('hire_date')->nullable();
    $table->enum('status', ['active', 'inactive'])->default('active');
    $table->string('avatar')->nullable();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('manager_id')->nullable()->constrained('employees')->nullOnDelete();
    $table->softDeletes();
    $table->timestamps();
});

Schema::create('attendances', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->cascadeOnDelete();  // ← أضف هذا
    $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
    $table->date('date');
    $table->time('check_in')->nullable();
    $table->time('check_out')->nullable();
    $table->enum('status', ['present', 'absent', 'late', 'leave'])->default('present');
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->unique(['employee_id', 'date']);  // حضور واحد في اليوم
    $table->index(['company_id', 'status']);  // لو عندك Index لاحقًا
});

Schema::create('payrolls', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->cascadeOnDelete(); // أضف هذا
    $table->foreignId('employee_id')->constrained()->restrictOnDelete();
    $table->integer('month');
    $table->integer('year');
    $table->decimal('basic_salary',  10, 2)->default(0);
    $table->decimal('bonus',         10, 2)->default(0);
    $table->decimal('deductions',    10, 2)->default(0);
    $table->decimal('net_salary',    10, 2)->default(0);
    $table->enum('status', ['draft', 'approved', 'paid'])->default('draft');
    $table->date('paid_at')->nullable();
    $table->timestamps();

    $table->unique(['employee_id', 'month', 'year']);
    $table->index(['company_id', 'status']); // Index بعد إضافة العمود
});

        // ══════════════════════════════════════
        // ACCOUNTING - المحاسبة
        // ══════════════════════════════════════
Schema::create('accounts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->cascadeOnDelete(); // أضف هذا
    $table->string('code')->unique();
    $table->string('name');
    $table->string('name_en')->nullable();
    $table->enum('type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
    $table->enum('normal_balance', ['debit', 'credit']);
    $table->decimal('balance', 14, 2)->default(0);
    $table->foreignId('parent_id')->nullable()->constrained('accounts')->nullOnDelete();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

Schema::create('journal_entries', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->cascadeOnDelete(); // أضف هذا
    $table->string('ref')->unique();                         // JE-00001
    $table->date('date');
    $table->text('description');
    $table->enum('status', ['draft', 'posted'])->default('draft');
    $table->enum('type', ['manual', 'auto'])->default('manual');
    $table->foreignId('user_id')->constrained()->restrictOnDelete();
    $table->string('reference_type')->nullable();
    $table->unsignedBigInteger('reference_id')->nullable();
    $table->timestamps();

    $table->index(['company_id', 'date']); // بعد إضافة العمود
});

        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();
            $table->decimal('debit',  14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->text('description')->nullable();
        });

        // ══════════════════════════════════════
        // POS - نقطة البيع
        // ══════════════════════════════════════

        Schema::create('pos_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->decimal('opening_cash',   12, 2)->default(0);
            $table->decimal('closing_cash',   12, 2)->nullable();
            $table->decimal('total_sales',    12, 2)->default(0);
            $table->integer('sales_count')->default(0);
            $table->decimal('cash_difference', 12, 2)->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('pos_shifts');
        Schema::dropIfExists('journal_entry_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('employees');
    }
};
