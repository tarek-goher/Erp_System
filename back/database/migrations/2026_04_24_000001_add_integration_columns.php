<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // إضافة أعمدة للعمليات المحاسبية المختلفة

        // 1. جدول Payroll - إضافة journal_entry_id
        if (Schema::hasTable('payrolls')) {
            Schema::table('payrolls', function (Blueprint $table) {
                if (!Schema::hasColumn('payrolls', 'journal_entry_id')) {
                    $table->unsignedBigInteger('journal_entry_id')->nullable()->after('id');
                }
                if (!Schema::hasColumn('payrolls', 'accounting_status')) {
                    $table->enum('accounting_status', ['pending', 'journalized', 'posted'])->default('pending')->after('status');
                }
            });
        }

        // 2. جدول POS Orders - إضافة journal_entry_id
        if (Schema::hasTable('pos_orders')) {
            Schema::table('pos_orders', function (Blueprint $table) {
                if (!Schema::hasColumn('pos_orders', 'journal_entry_id')) {
                    $table->unsignedBigInteger('journal_entry_id')->nullable()->after('id');
                }
            });
        }

        // 3. جدول Expenses - إضافة journal_entry_id
        if (Schema::hasTable('expenses')) {
            Schema::table('expenses', function (Blueprint $table) {
                if (!Schema::hasColumn('expenses', 'journal_entry_id')) {
                    $table->unsignedBigInteger('journal_entry_id')->nullable()->after('id');
                }
                if (!Schema::hasColumn('expenses', 'accounting_status')) {
                    $table->enum('accounting_status', ['pending', 'journalized', 'posted'])->default('pending')->after('status');
                }
            });
        }

        // 4. جدول Leave Requests - إضافة leave_request_id في Attendance
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                if (!Schema::hasColumn('attendances', 'leave_request_id')) {
                    $table->unsignedBigInteger('leave_request_id')->nullable()->after('id');
                }
            });
        }

        // 5. جدول Applicants - إضافة employee_id
        if (Schema::hasTable('applicants')) {
            Schema::table('applicants', function (Blueprint $table) {
                if (!Schema::hasColumn('applicants', 'employee_id')) {
                    $table->unsignedBigInteger('employee_id')->nullable()->after('id');
                }
            });
        }

        // 6. جدول CRM Opportunities - إضافة sale_id
        if (Schema::hasTable('crm_opportunities')) {
            Schema::table('crm_opportunities', function (Blueprint $table) {
                if (!Schema::hasColumn('crm_opportunities', 'sale_id')) {
                    $table->unsignedBigInteger('sale_id')->nullable()->after('id');
                }
            });
        }

        // 7. جدول Projects - إضافة invoice_id وinvoiced
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                if (!Schema::hasColumn('projects', 'invoice_id')) {
                    $table->unsignedBigInteger('invoice_id')->nullable()->after('id');
                }
                if (!Schema::hasColumn('projects', 'invoiced')) {
                    $table->boolean('invoiced')->default(false)->after('status');
                }
            });
        }

        // 8. جدول Fleet Maintenance - إضافة journal_entry_id
        if (Schema::hasTable('fleet_maintenances')) {
            Schema::table('fleet_maintenances', function (Blueprint $table) {
                if (!Schema::hasColumn('fleet_maintenances', 'journal_entry_id')) {
                    $table->unsignedBigInteger('journal_entry_id')->nullable()->after('id');
                }
            });
        }

        // 9. جدول Fuel Logs - إضافة journal_entry_id
        if (Schema::hasTable('fuel_logs')) {
            Schema::table('fuel_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('fuel_logs', 'journal_entry_id')) {
                    $table->unsignedBigInteger('journal_entry_id')->nullable()->after('id');
                }
            });
        }

        // 10. جدول Sales - إضافة حقول المشاريع والفرص
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (!Schema::hasColumn('sales', 'opportunity_id')) {
                    $table->unsignedBigInteger('opportunity_id')->nullable()->after('id');
                }
                if (!Schema::hasColumn('sales', 'project_id')) {
                    $table->unsignedBigInteger('project_id')->nullable()->after('id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn('journal_entry_id', 'accounting_status');
        });

        Schema::table('pos_orders', function (Blueprint $table) {
            $table->dropColumn('journal_entry_id');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn('journal_entry_id', 'accounting_status');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn('leave_request_id');
        });

        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn('employee_id');
        });

        Schema::table('crm_opportunities', function (Blueprint $table) {
            $table->dropColumn('sale_id');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('invoice_id', 'invoiced');
        });

        Schema::table('fleet_maintenances', function (Blueprint $table) {
            $table->dropColumn('journal_entry_id');
        });

        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->dropColumn('journal_entry_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('opportunity_id', 'project_id');
        });
    }
};
