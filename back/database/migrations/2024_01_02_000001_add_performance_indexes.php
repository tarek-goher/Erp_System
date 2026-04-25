<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Indexes Migration
 * بيضيف composite indexes على كل الجداول اللي بتتفلتر بـ company_id
 */
return new class extends Migration
{
    private function safeIndex(string $table, callable $callback): void
    {
        if (Schema::hasTable($table)) {
            Schema::table($table, $callback);
        }
    }

    public function up(): void
    {
        $this->safeIndex('sale_items', function ($t) {
            $t->index(['sale_id'],    'idx_sale_items_sale');
            $t->index(['product_id'], 'idx_sale_items_product');
        });

        $this->safeIndex('sale_payments', function ($t) {
            $t->index(['sale_id'], 'idx_sale_payments_sale');
        });

        $this->safeIndex('purchases', function ($t) {
            $t->index(['company_id', 'created_at'], 'idx_purchases_company_date');
        });

        $this->safeIndex('purchase_items', function ($t) {
            $t->index(['purchase_id'], 'idx_purchase_items_purchase');
            $t->index(['product_id'],  'idx_purchase_items_product');
        });

        $this->safeIndex('purchase_invoices', function ($t) {
            $t->index(['company_id', 'status'],   'idx_pinvoices_company_status');
            $t->index(['company_id', 'due_date'], 'idx_pinvoices_company_due');
            $t->index(['supplier_id'],            'idx_pinvoices_supplier');
        });

        $this->safeIndex('suppliers', function ($t) {
            $t->index(['company_id', 'is_active'], 'idx_suppliers_company_active');
        });

        $this->safeIndex('stock_movements', function ($t) {
            $t->index(['company_id', 'type'],              'idx_stock_company_type');
            $t->index(['company_id', 'created_at'],        'idx_stock_company_date');
            $t->index(['reference_type', 'reference_id'],  'idx_stock_reference');
        });

        $this->safeIndex('customers', function ($t) {
            $t->index(['company_id', 'is_active'],  'idx_customers_company_active');
            $t->index(['company_id', 'created_at'], 'idx_customers_company_date');
        });

        $this->safeIndex('employees', function ($t) {
            $t->index(['company_id', 'department'], 'idx_employees_company_dept');
        });

        $this->safeIndex('attendances', function ($t) {
            $t->index(['company_id', 'status'],  'idx_attendances_company_status');
            $t->index(['employee_id', 'date'],   'idx_attendances_emp_date');
        });

        $this->safeIndex('payrolls', function ($t) {
            $t->index(['company_id', 'status'], 'idx_payrolls_company_status');
        });

        $this->safeIndex('leave_requests', function ($t) {
            $t->index(['company_id', 'created_at'], 'idx_leave_company_date');
            $t->index(['employee_id', 'status'],    'idx_leave_emp_status');
        });

        $this->safeIndex('journal_entries', function ($t) {
            $t->index(['company_id', 'date'],   'idx_journal_company_date');
            $t->index(['company_id', 'type'],   'idx_journal_company_type');
            $t->index(['company_id', 'status'], 'idx_journal_company_status');
        });

        $this->safeIndex('accounts', function ($t) {
            $t->index(['company_id', 'type'],      'idx_accounts_company_type');
            $t->index(['company_id', 'is_active'], 'idx_accounts_company_active');
        });

        $this->safeIndex('budgets', function ($t) {
            $t->index(['company_id', 'year'], 'idx_budgets_company_year');
        });

        $this->safeIndex('bank_statements', function ($t) {
            $t->index(['company_id', 'date'], 'idx_bank_company_date');
        });

        $this->safeIndex('fixed_assets', function ($t) {
            $t->index(['company_id', 'status'], 'idx_assets_company_status');
        });

        $this->safeIndex('crm_leads', function ($t) {
            $t->index(['company_id', 'created_at'], 'idx_leads_company_date');
        });

        $this->safeIndex('support_tickets', function ($t) {
            $t->index(['company_id', 'status'],    'idx_tickets_company_status');
            $t->index(['company_id', 'priority'],  'idx_tickets_company_priority');
            $t->index(['company_id', 'created_at'],'idx_tickets_company_date');
        });

        $this->safeIndex('projects', function ($t) {
            $t->index(['company_id', 'status'], 'idx_projects_company_status');
        });

        $this->safeIndex('project_tasks', function ($t) {
            $t->index(['project_id', 'status'], 'idx_tasks_project_status');
        });

        $this->safeIndex('pos_orders', function ($t) {
            $t->index(['company_id', 'created_at'], 'idx_pos_orders_company_date');
            $t->index(['shift_id'],                 'idx_pos_orders_shift');
        });

        $this->safeIndex('audit_logs', function ($t) {
            $t->index(['company_id', 'action'],  'idx_audit_company_action');
            $t->index(['user_id', 'created_at'], 'idx_audit_user_date');
        });

        $this->safeIndex('erp_notifications', function ($t) {
            $t->index(['user_id', 'read_at'], 'idx_notifs_user_read');
        });

        $this->safeIndex('vehicles', function ($t) {
            $t->index(['company_id', 'status'], 'idx_vehicles_company_status');
        });

        $this->safeIndex('subscriptions', function ($t) {
            $t->index(['company_id', 'status'], 'idx_subs_company_status');
            $t->index(['ends_at'],              'idx_subs_ends_at');
        });
    }

    public function down(): void
    {
        $drops = [
            'sale_items'        => ['idx_sale_items_sale', 'idx_sale_items_product'],
            'sale_payments'     => ['idx_sale_payments_sale'],
            'purchases'         => ['idx_purchases_company_date'],
            'purchase_items'    => ['idx_purchase_items_purchase', 'idx_purchase_items_product'],
            'purchase_invoices' => ['idx_pinvoices_company_status', 'idx_pinvoices_company_due', 'idx_pinvoices_supplier'],
            'suppliers'         => ['idx_suppliers_company_active'],
            'stock_movements'   => ['idx_stock_company_type', 'idx_stock_company_date', 'idx_stock_reference'],
            'customers'         => ['idx_customers_company_active', 'idx_customers_company_date'],
            'employees'         => ['idx_employees_company_dept'],
            'attendances'       => ['idx_attendances_company_status', 'idx_attendances_emp_date'],
            'payrolls'          => ['idx_payrolls_company_status'],
            'leave_requests'    => ['idx_leave_company_date', 'idx_leave_emp_status'],
            'journal_entries'   => ['idx_journal_company_date', 'idx_journal_company_type', 'idx_journal_company_status'],
            'accounts'          => ['idx_accounts_company_type', 'idx_accounts_company_active'],
            'budgets'           => ['idx_budgets_company_year'],
            'bank_statements'   => ['idx_bank_company_date'],
            'fixed_assets'      => ['idx_assets_company_status'],
            'crm_leads'         => ['idx_leads_company_date'],
            'support_tickets'   => ['idx_tickets_company_status', 'idx_tickets_company_priority', 'idx_tickets_company_date'],
            'projects'          => ['idx_projects_company_status'],
            'project_tasks'     => ['idx_tasks_project_status'],
            'pos_orders'        => ['idx_pos_orders_company_date', 'idx_pos_orders_shift'],
            'audit_logs'        => ['idx_audit_company_action', 'idx_audit_user_date'],
            'erp_notifications' => ['idx_notifs_user_read'],
            'vehicles'          => ['idx_vehicles_company_status'],
            'subscriptions'     => ['idx_subs_company_status', 'idx_subs_ends_at'],
        ];

        foreach ($drops as $table => $indexes) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function ($t) use ($indexes) {
                    foreach ($indexes as $idx) {
                        try { $t->dropIndex($idx); } catch (\Exception $e) {}
                    }
                });
            }
        }
    }
};
