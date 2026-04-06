<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ══════════════════════════════════════════════════════════════════
// Performance Indexes Migration
// ══════════════════════════════════════════════════════════════════
// ليه بنعمل indexes؟
//   - مع 80 شركة وآلاف الـ records، أي query بـ WHERE company_id
//     بتعمل Full Table Scan بدون index = بطيء جداً
//   - index بيحول الـ query من O(n) إلى O(log n)
//
// القاعدة: أي column بتفلتر بيه أو بتعمل JOIN عليه = محتاج index
//
// ملاحظة: بعض الـ indexes موجودين بالفعل من foreignId()
//         ده بيضيف الـ indexes اللي ناقصة فقط
// ══════════════════════════════════════════════════════════════════

return new class extends Migration
{
    public function up(): void
    {
        // ─── SALES ────────────────────────────────────────────────
        // بيتفلتر بـ status, sale_date, customer_id, payment_method
        Schema::table('sales', function (Blueprint $table) {
            if (!$this->indexExists('sales', 'sales_company_id_status_index')) {
                $table->index(['company_id', 'status'], 'sales_company_id_status_index');
            }
            if (!$this->indexExists('sales', 'sales_company_id_sale_date_index')) {
                $table->index(['company_id', 'sale_date'], 'sales_company_id_sale_date_index');
            }
            if (!$this->indexExists('sales', 'sales_company_id_payment_method_index')) {
                $table->index(['company_id', 'payment_method'], 'sales_company_id_payment_method_index');
            }
        });

        // ─── PRODUCTS ─────────────────────────────────────────────
        // بيتفلتر بـ is_active, category_id, qty (low stock)
        Schema::table('products', function (Blueprint $table) {
            if (!$this->indexExists('products', 'products_company_id_is_active_index')) {
                $table->index(['company_id', 'is_active'], 'products_company_id_is_active_index');
            }
            if (!$this->indexExists('products', 'products_company_id_category_id_index')) {
                $table->index(['company_id', 'category_id'], 'products_company_id_category_id_index');
            }
            if (!$this->indexExists('products', 'products_name_index')) {
                $table->index('name', 'products_name_index');
            }
        });

        // ─── EMPLOYEES ────────────────────────────────────────────
        // بيتفلتر بـ department, status, company_id
        Schema::table('employees', function (Blueprint $table) {
            if (!$this->indexExists('employees', 'employees_company_id_status_index')) {
                $table->index(['company_id', 'status'], 'employees_company_id_status_index');
            }
            if (!$this->indexExists('employees', 'employees_company_id_department_index')) {
                $table->index(['company_id', 'department'], 'employees_company_id_department_index');
            }
        });

        // ─── PURCHASES ────────────────────────────────────────────
        Schema::table('purchases', function (Blueprint $table) {
            if (!$this->indexExists('purchases', 'purchases_company_id_status_index')) {
                $table->index(['company_id', 'status'], 'purchases_company_id_status_index');
            }
            if (!$this->indexExists('purchases', 'purchases_company_id_created_at_index')) {
                $table->index(['company_id', 'created_at'], 'purchases_company_id_created_at_index');
            }
        });

        // ─── CUSTOMERS & SUPPLIERS ────────────────────────────────
        Schema::table('customers', function (Blueprint $table) {
            if (!$this->indexExists('customers', 'customers_company_id_index')) {
                $table->index('company_id', 'customers_company_id_index');
            }
            if (!$this->indexExists('customers', 'customers_name_index')) {
                $table->index('name', 'customers_name_index');
            }
        });

        Schema::table('suppliers', function (Blueprint $table) {
            if (!$this->indexExists('suppliers', 'suppliers_company_id_index')) {
                $table->index('company_id', 'suppliers_company_id_index');
            }
        });

        // ─── STOCK MOVEMENTS ──────────────────────────────────────
        // الـ reports بتعمل GROUP BY company_id + type + created_at
        Schema::table('stock_movements', function (Blueprint $table) {
            if (!$this->indexExists('stock_movements', 'stock_movements_company_id_type_index')) {
                $table->index(['company_id', 'type'], 'stock_movements_company_id_type_index');
            }
            if (!$this->indexExists('stock_movements', 'stock_movements_company_id_created_at_index')) {
                $table->index(['company_id', 'created_at'], 'stock_movements_company_id_created_at_index');
            }
        });

        // ─── ACCOUNTS (Chart of Accounts) ─────────────────────────
        // بيتجمع ويتفلتر بـ type كتير في الـ reports
        Schema::table('accounts', function (Blueprint $table) {
            if (!$this->indexExists('accounts', 'accounts_company_id_type_index')) {
                $table->index(['company_id', 'type'], 'accounts_company_id_type_index');
            }
            if (!$this->indexExists('accounts', 'accounts_company_id_is_active_index')) {
                $table->index(['company_id', 'is_active'], 'accounts_company_id_is_active_index');
            }
        });

        // ─── JOURNAL ENTRIES ──────────────────────────────────────
        // الـ balance sheet والـ income statement بتعمل queries ضخمة هنا
        Schema::table('journal_entries', function (Blueprint $table) {
            if (!$this->indexExists('journal_entries', 'journal_entries_company_id_status_index')) {
                $table->index(['company_id', 'status'], 'journal_entries_company_id_status_index');
            }
            if (!$this->indexExists('journal_entries', 'journal_entries_company_id_date_index')) {
                $table->index(['company_id', 'date'], 'journal_entries_company_id_date_index');
            }
        });

        // ─── SUPPORT TICKETS ──────────────────────────────────────
        Schema::table('support_tickets', function (Blueprint $table) {
            if (!$this->indexExists('support_tickets', 'support_tickets_company_id_status_index')) {
                $table->index(['company_id', 'status'], 'support_tickets_company_id_status_index');
            }
            if (!$this->indexExists('support_tickets', 'support_tickets_company_id_priority_index')) {
                $table->index(['company_id', 'priority'], 'support_tickets_company_id_priority_index');
            }
        });

        // ─── CRM LEADS ────────────────────────────────────────────
        // crm_leads بيستخدم stage_id مش status
        Schema::table('crm_leads', function (Blueprint $table) {
            if (!$this->indexExists('crm_leads', 'crm_leads_company_id_stage_id_index')) {
                $table->index(['company_id', 'stage_id'], 'crm_leads_company_id_stage_id_index');
            }
            if (!$this->indexExists('crm_leads', 'crm_leads_company_id_assigned_to_index')) {
                $table->index(['company_id', 'assigned_to'], 'crm_leads_company_id_assigned_to_index');
            }
        });

        // ─── PROJECTS ─────────────────────────────────────────────
        Schema::table('projects', function (Blueprint $table) {
            if (!$this->indexExists('projects', 'projects_company_id_status_index')) {
                $table->index(['company_id', 'status'], 'projects_company_id_status_index');
            }
        });

        // ─── PROJECT TASKS ────────────────────────────────────────
        Schema::table('project_tasks', function (Blueprint $table) {
            if (!$this->indexExists('project_tasks', 'project_tasks_project_id_status_index')) {
                $table->index(['project_id', 'status'], 'project_tasks_project_id_status_index');
            }
            if (!$this->indexExists('project_tasks', 'project_tasks_company_id_assigned_to_index')) {
                $table->index(['company_id', 'assigned_to'], 'project_tasks_company_id_assigned_to_index');
            }
        });

        // ─── ERP NOTIFICATIONS ────────────────────────────────────
        // الـ notification bell بتتعمل query على user_id + read_at كتير
        Schema::table('erp_notifications', function (Blueprint $table) {
            if (!$this->indexExists('erp_notifications', 'erp_notifications_company_id_user_id_index')) {
                $table->index(['company_id', 'user_id'], 'erp_notifications_company_id_user_id_index');
            }
        });

        // ─── LEAVE REQUESTS ───────────────────────────────────────
        Schema::table('leave_requests', function (Blueprint $table) {
            if (!$this->indexExists('leave_requests', 'leave_requests_company_id_status_index')) {
                $table->index(['company_id', 'status'], 'leave_requests_company_id_status_index');
            }
        });

        // ─── PAYROLLS ─────────────────────────────────────────────
        Schema::table('payrolls', function (Blueprint $table) {
            if (!$this->indexExists('payrolls', 'payrolls_company_id_year_month_index')) {
                $table->index(['company_id', 'year', 'month'], 'payrolls_company_id_year_month_index');
            }
        });

        // ─── CAMPAIGNS ────────────────────────────────────────────
        Schema::table('campaigns', function (Blueprint $table) {
            if (!$this->indexExists('campaigns', 'campaigns_company_id_status_index')) {
                $table->index(['company_id', 'status'], 'campaigns_company_id_status_index');
            }
        });
    }

    public function down(): void
    {
        // إزالة كل الـ indexes اللي أضفناها
        $indexes = [
            'sales'             => ['sales_company_id_status_index', 'sales_company_id_sale_date_index', 'sales_company_id_payment_method_index'],
            'products'          => ['products_company_id_is_active_index', 'products_company_id_category_id_index', 'products_name_index'],
            'employees'         => ['employees_company_id_status_index', 'employees_company_id_department_index'],
            'purchases'         => ['purchases_company_id_status_index', 'purchases_company_id_created_at_index'],
            'customers'         => ['customers_company_id_index', 'customers_name_index'],
            'suppliers'         => ['suppliers_company_id_index'],
            'stock_movements'   => ['stock_movements_company_id_type_index', 'stock_movements_company_id_created_at_index'],
            'accounts'          => ['accounts_company_id_type_index', 'accounts_company_id_is_active_index'],
            'journal_entries'   => ['journal_entries_company_id_status_index', 'journal_entries_company_id_date_index'],
            'support_tickets'   => ['support_tickets_company_id_status_index', 'support_tickets_company_id_priority_index'],
            'crm_leads'         => ['crm_leads_company_id_stage_id_index', 'crm_leads_company_id_assigned_to_index'],
            'projects'          => ['projects_company_id_status_index'],
            'project_tasks'     => ['project_tasks_project_id_status_index', 'project_tasks_company_id_assigned_to_index'],
            'erp_notifications' => ['erp_notifications_company_id_user_id_index'],
            'leave_requests'    => ['leave_requests_company_id_status_index'],
            'payrolls'          => ['payrolls_company_id_year_month_index'],
            'campaigns'         => ['campaigns_company_id_status_index'],
        ];

        foreach ($indexes as $table => $tableIndexes) {
            Schema::table($table, function (Blueprint $t) use ($tableIndexes) {
                foreach ($tableIndexes as $index) {
                    try { $t->dropIndex($index); } catch (\Exception $e) {}
                }
            });
        }
    }

    // ─── Helper: التحقق إن الـ index مش موجود قبل ما نضيفه ────────
    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = \Illuminate\Support\Facades\DB::select(
            "SELECT INDEX_NAME FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND INDEX_NAME = ?",
            [$table, $indexName]
        );
        return !empty($indexes);
    }
};
