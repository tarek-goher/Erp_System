<?php

namespace App\Jobs;

use App\Models\BI\BICustomReport;
use App\Models\BI\BIReportExecution;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 300;

    public function __construct(public BIReportExecution $execution) {}

    public function handle(): void
    {
        $report = $this->execution->report;

        try {
            $this->execution->update(['status' => 'running', 'started_at' => now()]);

            $data     = $this->fetchReportData($report);
            $filePath = $this->exportToCSV("reports/{$report->company_id}/report_{$report->id}_" . now()->format('Ymd_His'), $data);
            $rowCount = count($data);

            $this->execution->update([
                'status'       => 'completed',
                'completed_at' => now(),
                'result_path'  => $filePath,
                'row_count'    => $rowCount,
                'duration_ms'  => now()->diffInMilliseconds($this->execution->started_at),
            ]);

        } catch (\Exception $e) {
            Log::error('GenerateReportJob failed', ['execution_id' => $this->execution->id, 'error' => $e->getMessage()]);
            $this->execution->update(['status' => 'failed', 'error_message' => $e->getMessage(), 'completed_at' => now()]);
            throw $e;
        }
    }

    private function fetchReportData(BICustomReport $report): array
    {
        $c = $report->company_id;
        $f = $report->filters ?? [];

        return match ($report->report_type) {
            'sales'     => $this->salesData($c, $f),
            'inventory' => $this->inventoryData($c, $f),
            'financial' => $this->financialData($c, $f),
            'hr'        => $this->hrData($c, $f),
            default     => $this->salesData($c, $f),
        };
    }

    private function salesData(int $c, array $f): array
    {
        $q = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('sales.company_id', $c)
            ->select('sales.id', 'sales.sale_number', 'customers.name as customer_name',
                     'sales.total_amount', 'sales.status', 'sales.sale_date',
                     DB::raw('COALESCE(sales.paid_amount,0) as paid_amount'),
                     DB::raw('(sales.total_amount - COALESCE(sales.paid_amount,0)) as balance'));
        if (!empty($f['date_from'])) $q->where('sales.sale_date', '>=', $f['date_from']);
        if (!empty($f['date_to']))   $q->where('sales.sale_date', '<=', $f['date_to']);
        if (!empty($f['status']))    $q->where('sales.status', $f['status']);
        return $q->orderByDesc('sales.sale_date')->get()->map(fn($r)=>(array)$r)->toArray();
    }

    private function inventoryData(int $c, array $f): array
    {
        $q = DB::table('products')
            ->where('products.company_id', $c)
            ->select('products.id','products.name','products.sku','products.stock_quantity','products.reorder_level');
        if (!empty($f['low_stock'])) $q->whereRaw('products.stock_quantity <= products.reorder_level');
        return $q->get()->map(fn($r)=>(array)$r)->toArray();
    }

    private function financialData(int $c, array $f): array
    {
        $q = DB::table('journal_entries')
            ->join('journal_entry_lines','journal_entries.id','=','journal_entry_lines.journal_entry_id')
            ->join('accounts','journal_entry_lines.account_id','=','accounts.id')
            ->where('journal_entries.company_id', $c)
            ->select('journal_entries.entry_number','journal_entries.entry_date','journal_entries.description',
                     'accounts.name as account_name','accounts.account_type',
                     'journal_entry_lines.debit','journal_entry_lines.credit');
        if (!empty($f['date_from'])) $q->where('journal_entries.entry_date', '>=', $f['date_from']);
        if (!empty($f['date_to']))   $q->where('journal_entries.entry_date', '<=', $f['date_to']);
        return $q->orderByDesc('journal_entries.entry_date')->get()->map(fn($r)=>(array)$r)->toArray();
    }

    private function hrData(int $c, array $f): array
    {
        return DB::table('employees')
            ->leftJoin('payrolls', fn($j) => $j->on('employees.id','=','payrolls.employee_id')->where('payrolls.company_id','=',$c))
            ->where('employees.company_id', $c)
            ->select('employees.id','employees.name','employees.position','employees.department',
                     'employees.hire_date','employees.status',
                     DB::raw('COALESCE(SUM(payrolls.net_salary),0) as total_paid'),
                     DB::raw('COUNT(payrolls.id) as payroll_count'))
            ->groupBy('employees.id','employees.name','employees.position','employees.department','employees.hire_date','employees.status')
            ->get()->map(fn($r)=>(array)$r)->toArray();
    }

    private function exportToCSV(string $path, array $data): string
    {
        $full = $path . '.csv';
        if (empty($data)) { Storage::put($full, 'No data'); return $full; }
        $headers = array_keys($data[0]);
        $csv = implode(',', $headers) . "\n";
        foreach ($data as $row) {
            $csv .= implode(',', array_map(fn($v)=>'"'.str_replace('"','""',$v??'').'"', $row)) . "\n";
        }
        Storage::put($full, $csv);
        return $full;
    }
}
