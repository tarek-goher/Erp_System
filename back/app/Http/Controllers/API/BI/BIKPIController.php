<?php

namespace App\Http\Controllers\API\BI;

use App\Http\Controllers\API\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class BIKPIController extends BaseController
{
    /**
     * Get all KPI metrics with live values
     */
    public function index(): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;

            $kpis = $this->buildKPIs($companyId);

            return $this->sendResponse($kpis, 'KPI metrics retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Get detailed data for a single KPI with trend
     */
    public function getData(Request $request, string $metric): JsonResponse
    {
        try {
            $companyId = auth('sanctum')->user()->company_id;
            $period    = $request->query('period', '30d');

            $data = match ($metric) {
                'revenue'         => $this->revenueData($companyId, $period),
                'orders'          => $this->ordersData($companyId, $period),
                'tickets'         => $this->ticketsData($companyId, $period),
                'customers'       => $this->customersData($companyId, $period),
                'inventory_value' => $this->inventoryValueData($companyId),
                'payroll'         => $this->payrollData($companyId, $period),
                'chat_volume'     => $this->chatVolumeData($companyId, $period),
                default           => [],
            };

            return $this->sendResponse($data, "KPI data for {$metric}");
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    // ─── KPI builders ────────────────────────────────────────────────────────

    private function buildKPIs(int $companyId): array
    {
        $cacheKey = "kpis.{$companyId}";

        return Cache::remember($cacheKey, 300, function () use ($companyId) {
            $now      = now();
            $thisMonth = $now->format('Y-m');
            $lastMonth = $now->subMonth()->format('Y-m');

            // Revenue this vs last month
            $revThis  = DB::table('sales')->where('company_id', $companyId)
                          ->whereRaw("DATE_FORMAT(sale_date,'%Y-%m') = ?", [$thisMonth])
                          ->where('status', '!=', 'cancelled')
                          ->sum('total_amount') ?? 0;
            $revLast  = DB::table('sales')->where('company_id', $companyId)
                          ->whereRaw("DATE_FORMAT(sale_date,'%Y-%m') = ?", [$lastMonth])
                          ->where('status', '!=', 'cancelled')
                          ->sum('total_amount') ?? 0;

            // Open tickets
            $openTickets = DB::table('tickets')->where('company_id', $companyId)
                             ->whereIn('status', ['open', 'in_progress'])->count();

            // New customers this month
            $newCustomers = DB::table('customers')->where('company_id', $companyId)
                              ->whereRaw("DATE_FORMAT(created_at,'%Y-%m') = ?", [$thisMonth])
                              ->count();

            // Active chat sessions
            $activeChats = DB::table('live_chat_sessions')
                             ->where('company_id', $companyId)
                             ->where('status', 'active')->count();

            // Inventory value
            $inventoryValue = DB::table('products')
                                ->where('company_id', $companyId)
                                ->selectRaw('SUM(stock_quantity * COALESCE(cost_price, 0)) as value')
                                ->value('value') ?? 0;

            // Pending orders
            $pendingOrders = DB::table('sales')->where('company_id', $companyId)
                               ->where('status', 'pending')->count();

            return [
                [
                    'key'         => 'revenue',
                    'label'       => 'Monthly Revenue',
                    'value'       => round($revThis, 2),
                    'previous'    => round($revLast, 2),
                    'change_pct'  => $revLast > 0 ? round((($revThis - $revLast) / $revLast) * 100, 1) : null,
                    'trend'       => $revThis >= $revLast ? 'up' : 'down',
                    'format'      => 'currency',
                ],
                [
                    'key'        => 'tickets',
                    'label'      => 'Open Tickets',
                    'value'      => $openTickets,
                    'trend'      => $openTickets > 10 ? 'warning' : 'good',
                    'format'     => 'number',
                ],
                [
                    'key'        => 'new_customers',
                    'label'      => 'New Customers (Month)',
                    'value'      => $newCustomers,
                    'trend'      => 'up',
                    'format'     => 'number',
                ],
                [
                    'key'        => 'active_chats',
                    'label'      => 'Active Chats',
                    'value'      => $activeChats,
                    'trend'      => 'neutral',
                    'format'     => 'number',
                ],
                [
                    'key'        => 'inventory_value',
                    'label'      => 'Inventory Value',
                    'value'      => round($inventoryValue, 2),
                    'trend'      => 'neutral',
                    'format'     => 'currency',
                ],
                [
                    'key'        => 'pending_orders',
                    'label'      => 'Pending Orders',
                    'value'      => $pendingOrders,
                    'trend'      => $pendingOrders > 20 ? 'warning' : 'good',
                    'format'     => 'number',
                ],
            ];
        });
    }

    private function revenueData(int $companyId, string $period): array
    {
        $days = $this->periodToDays($period);

        $daily = DB::table('sales')
            ->where('company_id', $companyId)
            ->where('status', '!=', 'cancelled')
            ->where('sale_date', '>=', now()->subDays($days))
            ->selectRaw("DATE(sale_date) as date, SUM(total_amount) as revenue, COUNT(*) as orders")
            ->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy('date')
            ->get();

        $topProducts = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->join('products as p', 'si.product_id', '=', 'p.id')
            ->where('s.company_id', $companyId)
            ->where('s.sale_date', '>=', now()->subDays($days))
            ->selectRaw("p.name, SUM(si.quantity) as qty_sold, SUM(si.total) as revenue")
            ->groupBy('si.product_id', 'p.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return ['daily' => $daily, 'top_products' => $topProducts];
    }

    private function ticketsData(int $companyId, string $period): array
    {
        $days = $this->periodToDays($period);

        $byStatus = DB::table('tickets')
            ->where('company_id', $companyId)
            ->selectRaw("status, COUNT(*) as count")
            ->groupBy('status')
            ->get();

        $daily = DB::table('tickets')
            ->where('company_id', $companyId)
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw("DATE(created_at) as date, COUNT(*) as total, SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as resolved")
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return ['by_status' => $byStatus, 'daily' => $daily];
    }

    private function customersData(int $companyId, string $period): array
    {
        $days = $this->periodToDays($period);

        return DB::table('customers')
            ->where('company_id', $companyId)
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw("DATE(created_at) as date, COUNT(*) as new_customers")
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    private function ordersData(int $companyId, string $period): array
    {
        $days = $this->periodToDays($period);

        return DB::table('sales')
            ->where('company_id', $companyId)
            ->where('sale_date', '>=', now()->subDays($days))
            ->selectRaw("DATE(sale_date) as date, COUNT(*) as orders, SUM(total_amount) as value, status")
            ->groupBy(DB::raw('DATE(sale_date)'), 'status')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    private function inventoryValueData(int $companyId): array
    {
        return DB::table('products')
            ->where('company_id', $companyId)
            ->selectRaw("
                SUM(stock_quantity * COALESCE(cost_price, 0)) as total_value,
                SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
                COUNT(*) as total_products
            ")
            ->first() ? (array)DB::table('products')->where('company_id', $companyId)
                ->selectRaw("SUM(stock_quantity * COALESCE(cost_price,0)) as total_value, SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock_count, SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count, COUNT(*) as total_products")
                ->first() : [];
    }

    private function payrollData(int $companyId, string $period): array
    {
        $months = $this->periodToDays($period) > 60 ? 6 : 3;

        return DB::table('payrolls')
            ->where('company_id', $companyId)
            ->where('created_at', '>=', now()->subMonths($months))
            ->selectRaw("DATE_FORMAT(created_at,'%Y-%m') as month, SUM(net_salary) as total, COUNT(*) as employees")
            ->groupBy(DB::raw("DATE_FORMAT(created_at,'%Y-%m')"))
            ->orderBy('month')
            ->get()
            ->toArray();
    }

    private function chatVolumeData(int $companyId, string $period): array
    {
        $days = $this->periodToDays($period);

        return DB::table('live_chat_sessions')
            ->where('company_id', $companyId)
            ->where('started_at', '>=', now()->subDays($days))
            ->selectRaw("DATE(started_at) as date, COUNT(*) as sessions, AVG(chat_duration_seconds) as avg_duration, AVG(wait_time_seconds) as avg_wait")
            ->groupBy(DB::raw('DATE(started_at)'))
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    private function periodToDays(string $period): int
    {
        return match ($period) {
            '7d'   => 7,
            '30d'  => 30,
            '90d'  => 90,
            '365d' => 365,
            default => 30,
        };
    }
}
