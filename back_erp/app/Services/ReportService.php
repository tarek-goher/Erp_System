<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\FixedAsset;
use App\Models\Payroll;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

/**
 * ReportService — تقارير النظام الشاملة
 * يُستخدم من ReportController فقط
 */
class ReportService
{
    /**
     * تقرير المبيعات
     */
    public function salesReport(string $from, string $to, ?int $companyId): array
    {
        $sales = Sale::where('company_id', $companyId)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->where('status', 'completed')
            ->with('customer');

        // مبيعات يومية
        $daily = Sale::where('company_id', $companyId)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->where('status', 'completed')
            ->selectRaw('DATE(created_at) as date, SUM(total) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'summary' => [
                'total_revenue'    => $sales->sum('total'),
                'total_invoices'   => $sales->count(),
                'avg_invoice'      => $sales->count() ? $sales->sum('total') / $sales->count() : 0,
                'total_tax'        => $sales->sum('tax'),
                'total_discount'   => $sales->sum('discount'),
            ],
            'daily'   => $daily,
            'by_payment_method' => Sale::where('company_id', $companyId)
                ->whereDate('created_at', '>=', $from)
                ->whereDate('created_at', '<=', $to)
                ->where('status', 'completed')
                ->selectRaw('payment_method, SUM(total) as total, COUNT(*) as count')
                ->groupBy('payment_method')
                ->get(),
        ];
    }

    /**
     * تقرير المشتريات
     */
    public function purchasesReport(string $from, string $to, ?int $companyId): array
    {
        $purchases = Purchase::where('company_id', $companyId)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to);

        $daily = Purchase::where('company_id', $companyId)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->selectRaw('DATE(created_at) as date, SUM(total) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'summary' => [
                'total_cost'    => $purchases->sum('total'),
                'total_orders'  => $purchases->count(),
                'pending'       => $purchases->where('status', 'pending')->count(),
                'received'      => $purchases->where('status', 'received')->count(),
            ],
            'daily' => $daily,
        ];
    }

    /**
     * تقرير المخزون
     */
    public function inventoryReport(?int $companyId): array
    {
        // Fix: كان بيجيب كل المنتجات في الذاكرة ويحسب في PHP
        // ده memory explosion مع 1000 شركة عندها آلاف منتجات
        // الحل: خلّي الـ DB يعمل الحسابات بـ SQL aggregation

        $base = Product::where('company_id', $companyId)->where('is_active', true);

        // إحصائيات أساسية — query واحدة بدل load كل البيانات
        $stats = (clone $base)
            ->selectRaw('
                COUNT(*)                          as total_products,
                SUM(qty * cost)                   as total_value,
                SUM(CASE WHEN qty <= min_qty THEN 1 ELSE 0 END) as low_stock_count,
                SUM(qty)                          as total_qty
            ')
            ->first();

        // المنتجات المنخفضة — بـ pagination مش كلها دفعة واحدة
        $lowStockItems = (clone $base)
            ->whereColumn('qty', '<=', 'min_qty')
            ->with('category:id,name', 'warehouse:id,name')
            ->select('id', 'name', 'sku', 'qty', 'min_qty', 'category_id', 'warehouse_id')
            ->orderBy('qty')
            ->limit(50) // أول 50 بس — مش كلهم
            ->get();

        // توزيع حسب الفئة — DB GROUP BY مش PHP groupBy
        $byCategory = (clone $base)
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->selectRaw('categories.name as category, COUNT(*) as count, SUM(products.qty * products.cost) as value')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('value')
            ->get();

        return [
            'total_products'   => (int)   ($stats->total_products ?? 0),
            'total_value'      => round((float) ($stats->total_value    ?? 0), 2),
            'total_qty'        => round((float) ($stats->total_qty      ?? 0), 3),
            'low_stock_count'  => (int)   ($stats->low_stock_count ?? 0),
            'low_stock_items'  => $lowStockItems,
            'by_category'      => $byCategory,
        ];
    }

    /**
     * تقرير الموارد البشرية
     */
    public function hrReport(int $month, int $year, ?int $companyId): array
    {
        $payrolls = Payroll::where('company_id', $companyId)
            ->where('month', $month)
            ->where('year', $year)
            ->with('employee');

        $employees = Employee::where('company_id', $companyId);

        return [
            'employees' => [
                'total'    => $employees->count(),
                'active'   => $employees->where('status', 'active')->count(),
                'on_leave' => $employees->where('status', 'on_leave')->count(),
            ],
            'payroll' => [
                'total_net'    => $payrolls->sum('net_salary'),
                'total_basic'  => $payrolls->sum('basic_salary'),
                'total_deductions' => $payrolls->sum('deductions'),
                'paid_count'   => $payrolls->where('status', 'paid')->count(),
                'pending_count' => $payrolls->where('status', 'pending')->count(),
            ],
        ];
    }

    /**
     * تقرير المحاسبة
     */
    public function accountingReport(?int $companyId): array
    {
        $entries = JournalEntry::where('company_id', $companyId);

        return [
            'total_debits'  => $entries->sum('debit'),
            'total_credits' => $entries->sum('credit'),
            'by_type' => JournalEntry::where('company_id', $companyId)
                ->selectRaw('type, SUM(debit) as debit, SUM(credit) as credit, COUNT(*) as count')
                ->groupBy('type')
                ->get(),
        ];
    }

    /**
     * أفضل العملاء
     */
    public function topCustomers(?int $companyId): array
    {
        return Sale::where('company_id', $companyId)
            ->where('status', 'completed')
            ->selectRaw('customer_id, SUM(total) as total_revenue, COUNT(*) as invoices_count')
            ->groupBy('customer_id')
            ->orderByDesc('total_revenue')
            ->limit(20)
            ->with('customer:id,name,email,phone')
            ->get()
            ->toArray();
    }

    /**
     * أفضل المنتجات مبيعاً
     */
    public function topProducts(?int $companyId): array
    {
        return SaleItem::whereHas('sale', fn($q) => $q->where('company_id', $companyId)->where('status', 'completed'))
            ->selectRaw('product_id, SUM(quantity) as qty_sold, SUM(total) as revenue')
            ->groupBy('product_id')
            ->orderByDesc('qty_sold')
            ->limit(20)
            ->with('product:id,name,sku,unit')
            ->get()
            ->toArray();
    }

    /**
     * ملخص الـ dashboard
     */
    public function dashboardSummary(?int $companyId): array
    {
        // Fix: كان بيعمل 6 queries في كل رفرش بدون cache
        // لو 500 user فاتحين dashboard = 3000 query/ثانية
        // الحل: cache لمدة 5 دقايق per company

        $cacheKey = "dashboard:summary:{$companyId}";
        $cacheTtl = 300; // 5 دقايق

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, $cacheTtl, function () use ($companyId) {
            $today     = now()->toDateString();
            $thisMonth = now()->startOfMonth()->toDateString();

            // نجمّع كل الـ sales stats في query واحدة بدل 3
            $salesStats = \Illuminate\Support\Facades\DB::table('sales')
                ->where('company_id', $companyId)
                ->whereNull('deleted_at')
                ->selectRaw("
                    SUM(CASE WHEN DATE(created_at) = ? AND status = 'completed' THEN total ELSE 0 END) as today_revenue,
                    SUM(CASE WHEN DATE(created_at) >= ? AND status = 'completed' THEN total ELSE 0 END) as month_revenue,
                    COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END)                                   as today_orders
                ", [$today, $thisMonth, $today])
                ->first();

       return [
    'sales_today'      => round((float) ($salesStats->today_revenue  ?? 0), 2),
    'sales_month'      => round((float) ($salesStats->month_revenue  ?? 0), 2),
    'purchases_month'  => \App\Models\Purchase::where('company_id', $companyId)
                            ->whereDate('created_at', '>=', now()->startOfMonth())
                            ->sum('total'),
    'active_employees' => \App\Models\Employee::where('company_id', $companyId)->where('status', 'active')->count(),
    'low_stock_count'  => \App\Models\Product::where('company_id', $companyId)->whereColumn('qty', '<=', 'min_qty')->count(),
    'pending_invoices' => \App\Models\Payroll::where('company_id', $companyId)
                            ->where('status', 'pending')
                            ->where('year',  now()->year)
                            ->where('month', now()->month)
                            ->count(),
];
        });
    }

    /**
     * إلغاء الـ cache لما تتغير بيانات الـ dashboard
     * استدعيه بعد أي عملية بيع أو إضافة موظف
     */
    public function clearDashboardCache(int $companyId): void
    {
        \Illuminate\Support\Facades\Cache::forget("dashboard:summary:{$companyId}");
    }

    /**
     * قائمة الدخل (Income Statement / P&L)
     * الإيرادات - المصروفات = صافي الربح
     */
    public function incomeStatement(string $from, string $to, int $companyId): array
    {
        $revenue = Account::where('company_id', $companyId)
            ->where('type', 'revenue')
            ->where('is_active', true)
            ->get();

        $expenses = Account::where('company_id', $companyId)
            ->where('type', 'expense')
            ->where('is_active', true)
            ->get();

        // احسب حركة الفترة من journal_entry_lines
        $lineMovements = DB::table('journal_entry_lines as jel')
            ->join('journal_entries as je', 'jel.journal_entry_id', '=', 'je.id')
            ->where('je.company_id', $companyId)
            ->where('je.status', 'posted')
            ->whereBetween('je.date', [$from, $to])
            ->selectRaw('jel.account_id, SUM(jel.credit) as total_credit, SUM(jel.debit) as total_debit')
            ->groupBy('jel.account_id')
            ->get()
            ->keyBy('account_id');

        $buildRows = function ($accounts) use ($lineMovements) {
            return $accounts->map(function ($acc) use ($lineMovements) {
                $movement = $lineMovements->get($acc->id);
                $net = $movement
                    ? ($acc->normal_balance === 'credit'
                        ? ($movement->total_credit - $movement->total_debit)
                        : ($movement->total_debit  - $movement->total_credit))
                    : 0;
                return ['id' => $acc->id, 'code' => $acc->code, 'name' => $acc->name, 'amount' => round($net, 2)];
            })->values()->toArray();
        };

        $revenueRows  = $buildRows($revenue);
        $expenseRows  = $buildRows($expenses);
        $totalRevenue = collect($revenueRows)->sum('amount');
        $totalExpense = collect($expenseRows)->sum('amount');

        return [
            'period'        => ['from' => $from, 'to' => $to],
            'revenue'       => ['items' => $revenueRows,  'total' => round($totalRevenue, 2)],
            'expenses'      => ['items' => $expenseRows,  'total' => round($totalExpense, 2)],
            'net_profit'    => round($totalRevenue - $totalExpense, 2),
            'profit_margin' => $totalRevenue > 0 ? round(($totalRevenue - $totalExpense) / $totalRevenue * 100, 2) : 0,
        ];
    }

    /**
     * الميزانية العمومية (Balance Sheet)
     * الأصول = الخصوم + حقوق الملكية
     */
    public function balanceSheet(string $asOf, int $companyId): array
    {
        $accounts = Account::where('company_id', $companyId)
            ->where('is_active', true)
            ->whereIn('type', ['asset', 'liability', 'equity'])
            ->get();

        $grouped = $accounts->groupBy('type');

        $buildSection = function ($accounts) {
            $items = $accounts->map(fn($a) => [
                'id' => $a->id, 'code' => $a->code, 'name' => $a->name, 'balance' => round($a->balance, 2),
            ])->values()->toArray();
            return ['items' => $items, 'total' => round(collect($items)->sum('balance'), 2)];
        };

        $assets      = $buildSection($grouped->get('asset',     collect()));
        $liabilities = $buildSection($grouped->get('liability', collect()));
        $equity      = $buildSection($grouped->get('equity',    collect()));

        return [
            'as_of'       => $asOf,
            'assets'      => $assets,
            'liabilities' => $liabilities,
            'equity'      => $equity,
            'total_liabilities_equity' => round($liabilities['total'] + $equity['total'], 2),
            'is_balanced' => round($assets['total'], 2) === round($liabilities['total'] + $equity['total'], 2),
        ];
    }

    /**
     * التدفق النقدي (Cash Flow Statement)
     */
    public function cashFlow(string $from, string $to, int $companyId): array
    {
        // عمليات التشغيل: المبيعات - المشتريات
        $salesCash     = Sale::where('company_id', $companyId)
            ->where('status', 'completed')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->sum('total');

        $purchasesCash = Purchase::where('company_id', $companyId)
            ->where('status', 'received')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->sum('total');

        $payrollCash = Payroll::where('company_id', $companyId)
            ->where('status', 'paid')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->sum('net_salary');

        $operatingCashIn  = $salesCash;
        $operatingCashOut = $purchasesCash + $payrollCash;
        $netOperating     = $operatingCashIn - $operatingCashOut;

        // تدفقات الاستثمار: الأصول الثابتة
        $assetPurchases = DB::table('fixed_assets')
            ->where('company_id', $companyId)
            ->whereBetween(DB::raw('DATE(purchase_date)'), [$from, $to])
            ->sum('purchase_cost');

        $netInvesting = -$assetPurchases;

        return [
            'period'    => ['from' => $from, 'to' => $to],
            'operating' => [
                'cash_in'  => round($operatingCashIn, 2),
                'cash_out' => round($operatingCashOut, 2),
                'details'  => [
                    ['label' => 'إيرادات المبيعات',  'amount' =>  round($salesCash, 2)],
                    ['label' => 'مدفوعات المشتريات', 'amount' => -round($purchasesCash, 2)],
                    ['label' => 'مدفوعات الرواتب',   'amount' => -round($payrollCash, 2)],
                ],
                'net' => round($netOperating, 2),
            ],
            'investing' => [
                'details' => [
                    ['label' => 'شراء أصول ثابتة', 'amount' => -round($assetPurchases, 2)],
                ],
                'net' => round($netInvesting, 2),
            ],
            'financing' => ['details' => [], 'net' => 0],
            'net_change' => round($netOperating + $netInvesting, 2),
        ];
    }

    /**
     * قائمة قيود اليومية (Journal Entries Report)
     */
    public function journalEntriesReport(string $from, string $to, int $companyId): array
    {
        // Fix: أضفنا pagination إجباري — كان ممكن يجيب 50,000 قيد في request واحد
        $perPage = min((int) request('per_page', 100), 500);

        $entries = JournalEntry::where('company_id', $companyId)
            ->whereBetween('date', [$from, $to])
            ->with('lines.account:id,code,name', 'user:id,name')
            ->orderBy('date')
            ->paginate($perPage);

        // الإجماليات بـ query منفصلة وسريعة
        $totals = \Illuminate\Support\Facades\DB::table('journal_entry_lines as jel')
            ->join('journal_entries as je', 'jel.journal_entry_id', '=', 'je.id')
            ->where('je.company_id', $companyId)
            ->whereBetween('je.date', [$from, $to])
            ->selectRaw('COUNT(DISTINCT je.id) as entries_count, SUM(jel.debit) as total_debit, SUM(jel.credit) as total_credit')
            ->first();

        return [
            'period'  => ['from' => $from, 'to' => $to],
            'entries' => $entries->through(fn($e) => [
                'id'          => $e->id,
                'ref'         => $e->ref,
                'date'        => $e->date->toDateString(),
                'description' => $e->description,
                'type'        => $e->type,
                'status'      => $e->status,
                'user'        => $e->user?->name,
                'lines'       => $e->lines->map(fn($l) => [
                    'account_code' => $l->account?->code,
                    'account_name' => $l->account?->name,
                    'debit'        => round($l->debit,  2),
                    'credit'       => round($l->credit, 2),
                    'description'  => $l->description,
                ]),
                'total_debit'  => round($e->lines->sum('debit'),  2),
                'total_credit' => round($e->lines->sum('credit'), 2),
            ]),
            'totals' => [
                'entries_count' => (int)   ($totals->entries_count ?? 0),
                'total_debit'   => round((float) ($totals->total_debit   ?? 0), 2),
                'total_credit'  => round((float) ($totals->total_credit  ?? 0), 2),
            ],
        ];
    }

    /**
     * ملخص المبيعات (Sales Summary Report)
     */
    public function salesSummary(string $from, string $to, int $companyId): array
    {
        $sales = Sale::where('company_id', $companyId)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->selectRaw('status, COUNT(*) as count, SUM(total) as total, SUM(tax) as tax, SUM(discount) as discount')
            ->groupBy('status')
            ->get();

        $byDay = Sale::where('company_id', $companyId)
            ->where('status', 'completed')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count, SUM(total) as total')
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return [
            'period'    => ['from' => $from, 'to' => $to],
            'by_status' => $sales,
            'by_day'    => $byDay,
            'totals'    => [
                'invoices'  => $sales->sum('count'),
                'revenue'   => round($sales->where('status', 'completed')->sum('total'), 2),
                'tax'       => round($sales->sum('tax'), 2),
                'discount'  => round($sales->sum('discount'), 2),
            ],
        ];
    }

}