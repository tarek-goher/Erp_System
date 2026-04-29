<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // إضافة الحسابات الجديدة والإضافية
        $this->seedExpandedAccounts();
    }

    public function down(): void
    {
        // لا نحذف (لأن فيه بيانات قد تكون مرتبطة)
    }

    private function seedExpandedAccounts(): void
    {
        $company = DB::table('companies')->first();
        if (!$company) {
            return;
        }
        $companyId = $company->id;

        $newAccounts = [
            // ── حسابات الأصول الإضافية ──
            ['code' => '1104', 'name' => 'أوراق القبض', 'name_en' => 'Notes Receivable', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'receivable'],
            ['code' => '1105', 'name' => 'الضرائب المدفوعة مقدماً', 'name_en' => 'Prepaid Taxes', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'prepaid'],
            ['code' => '1106', 'name' => 'المصاريف المدفوعة مقدماً', 'name_en' => 'Prepaid Expenses', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'prepaid'],
            ['code' => '1150', 'name' => 'السلف المدفوعة للموظفين', 'name_en' => 'Employee Advances', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'receivable'],
            ['code' => '1200', 'name' => 'المخزون - الخامات', 'name_en' => 'Raw Materials', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'inventory'],
            ['code' => '1210', 'name' => 'المخزون - مواد نصف مصنعة', 'name_en' => 'Work in Progress', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'inventory'],
            ['code' => '1220', 'name' => 'المخزون - منتجات تامة', 'name_en' => 'Finished Goods', 'type' => 'asset', 'normal_balance' => 'debit', 'account_type' => 'inventory'],
            
            // ── الإهلاك والتحفظات ──
            ['code' => '1420', 'name' => 'الإهلاك المتراكم - السيارات', 'name_en' => 'Accumulated Depreciation - Vehicles', 'type' => 'asset', 'normal_balance' => 'credit', 'account_type' => 'accumulated_depreciation'],
            ['code' => '1430', 'name' => 'مخصص الديون المشكوك فيها', 'name_en' => 'Allowance for Doubtful Accounts', 'type' => 'asset', 'normal_balance' => 'credit', 'account_type' => 'contra_asset'],
            
            // ── حسابات الالتزامات الإضافية ──
            ['code' => '2101', 'name' => 'الدائنون - موردون', 'name_en' => 'Accounts Payable - Suppliers', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payable'],
            ['code' => '2102', 'name' => 'الدائنون - آخرون', 'name_en' => 'Accounts Payable - Others', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payable'],
            ['code' => '2201', 'name' => 'أوراق الدفع - قصيرة الأجل', 'name_en' => 'Notes Payable - Short Term', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payable'],
            ['code' => '2202', 'name' => 'أوراق الدفع - طويلة الأجل', 'name_en' => 'Notes Payable - Long Term', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payable'],
            ['code' => '2301', 'name' => 'ضرائب الدخل المستحقة', 'name_en' => 'Income Tax Payable', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'tax_payable'],
            ['code' => '2302', 'name' => 'ضرائب المبيعات المستحقة', 'name_en' => 'Sales Tax Payable', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'tax_payable'],
            ['code' => '2310', 'name' => 'اشتراكات الضمان الاجتماعي', 'name_en' => 'Social Insurance Payable', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payroll_payable'],
            ['code' => '2401', 'name' => 'راتب الموظفين المستحق', 'name_en' => 'Accrued Salaries', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payroll_payable'],
            ['code' => '2402', 'name' => 'مكافآت الموظفين المستحقة', 'name_en' => 'Accrued Bonuses', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'payroll_payable'],
            ['code' => '2500', 'name' => 'الإيجار المستحق', 'name_en' => 'Accrued Rent', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'accrued_expense'],
            ['code' => '2501', 'name' => 'الفوائد المستحقة', 'name_en' => 'Accrued Interest', 'type' => 'liability', 'normal_balance' => 'credit', 'account_type' => 'accrued_expense'],

            // ── حقوق الملكية الإضافية ──
            ['code' => '3101', 'name' => 'رأس المال - المالك الأول', 'name_en' => 'Capital - Owner 1', 'type' => 'equity', 'normal_balance' => 'credit', 'account_type' => 'capital'],
            ['code' => '3102', 'name' => 'رأس المال - المالك الثاني', 'name_en' => 'Capital - Owner 2', 'type' => 'equity', 'normal_balance' => 'credit', 'account_type' => 'capital'],
            ['code' => '3201', 'name' => 'الأرباح الموزعة', 'name_en' => 'Dividends', 'type' => 'equity', 'normal_balance' => 'debit', 'account_type' => 'dividend'],
            ['code' => '3300', 'name' => 'الاحتياطي النظامي', 'name_en' => 'Statutory Reserve', 'type' => 'equity', 'normal_balance' => 'credit', 'account_type' => 'reserve'],

            // ── الإيرادات الإضافية ──
            ['code' => '4002', 'name' => 'إيرادات المبيعات - محلي', 'name_en' => 'Domestic Sales', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
            ['code' => '4003', 'name' => 'إيرادات المبيعات - تصدير', 'name_en' => 'Export Sales', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
            ['code' => '4010', 'name' => 'إيرادات الخدمات', 'name_en' => 'Service Revenue', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
            ['code' => '4110', 'name' => 'خصومات - تجارية', 'name_en' => 'Trade Discounts', 'type' => 'revenue', 'normal_balance' => 'debit', 'account_type' => 'revenue_contra'],
            ['code' => '4120', 'name' => 'خصومات - نقدية', 'name_en' => 'Cash Discounts', 'type' => 'revenue', 'normal_balance' => 'debit', 'account_type' => 'revenue_contra'],
            ['code' => '4210', 'name' => 'إيرادات الفوائد', 'name_en' => 'Interest Income', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
            ['code' => '4220', 'name' => 'إيرادات الإيجار', 'name_en' => 'Rent Income', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
            ['code' => '4230', 'name' => 'إيرادات العمولات', 'name_en' => 'Commission Income', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
            ['code' => '4240', 'name' => 'إيرادات أرباح الأسهم', 'name_en' => 'Dividend Income', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],

            // ── المصاريف الإضافية ──
            ['code' => '5002', 'name' => 'تكلفة المواد المستهلكة', 'name_en' => 'Raw Materials Consumed', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'cogs'],
            ['code' => '5006', 'name' => 'مصاريف الشحن والنقل', 'name_en' => 'Shipping Expenses', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5007', 'name' => 'مصاريف التأمين', 'name_en' => 'Insurance Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5008', 'name' => 'مصاريف الصيانة والإصلاح', 'name_en' => 'Maintenance Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5011', 'name' => 'مصاريف الاتصالات', 'name_en' => 'Telephone Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5012', 'name' => 'مصاريف المكتب والأدوات', 'name_en' => 'Office Supplies Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5013', 'name' => 'مصاريف الإيجار', 'name_en' => 'Rent Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5014', 'name' => 'مصاريف الفائدة', 'name_en' => 'Interest Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5015', 'name' => 'مصاريف الضرائب', 'name_en' => 'Tax Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5021', 'name' => 'مصاريف البحث والتطوير', 'name_en' => 'Research & Development', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5022', 'name' => 'مصاريف التدريب والتطوير', 'name_en' => 'Training Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5031', 'name' => 'مصاريف المراجعة والاستشارات', 'name_en' => 'Audit & Consulting', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5032', 'name' => 'مصاريف قانونية', 'name_en' => 'Legal Fees', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
            ['code' => '5040', 'name' => 'خسائر العملات الأجنبية', 'name_en' => 'Foreign Exchange Loss', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'other_expense'],
            ['code' => '5050', 'name' => 'مصاريف متنوعة', 'name_en' => 'Miscellaneous Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],

            // ── حسابات خاصة ──
            ['code' => '6100', 'name' => 'الدخل غير العادي', 'name_en' => 'Extraordinary Income', 'type' => 'revenue', 'normal_balance' => 'credit', 'account_type' => 'revenue'],
            ['code' => '6200', 'name' => 'الخسائر غير العادية', 'name_en' => 'Extraordinary Loss', 'type' => 'expense', 'normal_balance' => 'debit', 'account_type' => 'expense'],
        ];

        foreach ($newAccounts as $account) {
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
