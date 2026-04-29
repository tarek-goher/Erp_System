<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // إضافة account_type العمود
        Schema::table('accounts', function (Blueprint $table) {
            if (!Schema::hasColumn('accounts', 'account_type')) {
                $table->string('account_type')->nullable()->after('type');
                // account_type يمكن أن يكون: receivable, payable, inventory, revenue, expense_salary, bank, etc
            }
        });

        // إدراج الحسابات الافتراضية إن لم تكن موجودة
        $this->seedDefaultAccounts();
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            if (Schema::hasColumn('accounts', 'account_type')) {
                $table->dropColumn('account_type');
            }
        });
    }

    private function seedDefaultAccounts(): void
    {
        // نجيب company_id الأول (عادة 1)
        $company = DB::table('companies')->first();
        if (!$company) {
            return;
        }
        $companyId = $company->id;

        // حسابات الأصول (Assets)
        $assets = [
            ['code' => '1100', 'name' => 'نقد بالصندوق', 'name_en' => 'Cash in Hand', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'cash'],
            ['code' => '1102', 'name' => 'البنك', 'name_en' => 'Bank Account', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'bank'],
            ['code' => '1103', 'name' => 'المدينون', 'name_en' => 'Accounts Receivable', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'receivable'],
            ['code' => '1200', 'name' => 'المخزون', 'name_en' => 'Inventory', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'inventory'],
            ['code' => '1300', 'name' => 'الأراضي والعقارات', 'name_en' => 'Land & Buildings', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'fixed_asset'],
            ['code' => '1310', 'name' => 'الآلات والمعدات', 'name_en' => 'Machinery & Equipment', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'fixed_asset'],
            ['code' => '1320', 'name' => 'السيارات', 'name_en' => 'Vehicles', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'fixed_asset'],
            ['code' => '1400', 'name' => 'الإهلاك المتراكم - الأراضي', 'name_en' => 'Accumulated Depreciation - Buildings', 'type' => 'asset', 'normal_balance' => 'credit', 'account_type' => 'accumulated_depreciation'],
            ['code' => '1410', 'name' => 'الإهلاك المتراكم - الآلات', 'name_en' => 'Accumulated Depreciation - Machinery', 'type' => 'asset', 'normal_balance' => 'credit', 'account_type' => 'accumulated_depreciation'],
        ];

        // حسابات الالتزامات (Liabilities)
        $liabilities = [
            ['code' => '2100', 'name' => 'الدائنون', 'name_en' => 'Accounts Payable', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payable'],
            ['code' => '2200', 'name' => 'أوراق الدفع', 'name_en' => 'Notes Payable', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payable'],
            ['code' => '2300', 'name' => 'ضرائب مستحقة', 'name_en' => 'Taxes Payable', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'tax_payable'],
            ['code' => '2400', 'name' => 'مستحقات الموظفين', 'name_en' => 'Wages Payable', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payroll_payable'],
        ];

        // حسابات حقوق الملكية (Equity)
        $equity = [
            ['code' => '3100', 'name' => 'رأس المال', 'name_en' => 'Capital', 'type' => 'equity', 'normal_balance' => 'credit', 'account_type' => 'capital'],
            ['code' => '3200', 'name' => 'الأرباح المحتجزة', 'name_en' => 'Retained Earnings', 'type' => 'equity', 'normal_balance' => 'credit', 'account_type' => 'retained_earnings'],
        ];

        // حسابات الإيرادات (Revenue)
        $revenue = [
            ['code' => '4001', 'name' => 'إيرادات المبيعات', 'name_en' => 'Sales Revenue', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
            ['code' => '4100', 'name' => 'خصومات المبيعات', 'name_en' => 'Sales Discounts', 'type' => 'revenue', 'normal_balance' => 'debit', 'account_type' => 'revenue_contra'],
            ['code' => '4200', 'name' => 'إيرادات أخرى', 'name_en' => 'Other Income', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
        ];

        // حسابات المصاريف (Expense)
        $expense = [
            ['code' => '5001', 'name' => 'تكلفة البضاعة المباعة', 'name_en' => 'Cost of Goods Sold', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'cogs'],
            ['code' => '5003', 'name' => 'مصاريف الرواتب', 'name_en' => 'Salaries Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense_salary'],
            ['code' => '5004', 'name' => 'مصاريف الكهرباء والماء', 'name_en' => 'Utilities Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5005', 'name' => 'مصاريف الإهلاك', 'name_en' => 'Depreciation Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5010', 'name' => 'مصاريف النقل والتوزيع', 'name_en' => 'Transportation Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5020', 'name' => 'مصاريف الإعلان والتسويق', 'name_en' => 'Advertising Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5030', 'name' => 'مصاريف إدارية', 'name_en' => 'Administrative Expenses', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
        ];

        $allAccounts = array_merge($assets, $liabilities, $equity, $revenue, $expense);

        foreach ($allAccounts as $account) {
            $exists = DB::table('accounts')
                ->where('company_id', $companyId)
                ->where('code', $account['code'])
                ->exists();

            if (!$exists) {
                DB::table('accounts')->insert(array_merge($account, [
                    'company_id' => $companyId,
                    'balance' => 0,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }
};
