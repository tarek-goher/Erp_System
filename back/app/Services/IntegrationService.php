<?php

namespace App\Services;

use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Payroll;
use App\Models\Expense;
use App\Models\PosOrder;
use App\Models\LeaveRequest;
use App\Models\Attendance;
use App\Models\CrmOpportunity;
use App\Models\Project;
use App\Models\FleetMaintenance;
use App\Models\FuelLog;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class IntegrationService
{
    protected $journalEntryService;

    public function __construct(JournalEntryService $journalEntryService)
    {
        $this->journalEntryService = $journalEntryService;
    }

    /**
     * مشكلة 1: Leave → Attendance
     * تسجيل الإجازة المعتمدة في الحضور
     */
    public function recordApprovedLeaveToAttendance(LeaveRequest $leave)
    {
        if ($leave->status !== 'approved') {
            return false;
        }

        try {
            $startDate = $leave->start_date;
            $endDate = $leave->end_date;

            $currentDate = $startDate;
            while ($currentDate <= $endDate) {
                // تجاهل نهايات الأسبوع إذا كانت متطلبات الشركة تدعم ذلك
                if (!in_array($currentDate->dayOfWeek, [0, 6])) {
                    Attendance::updateOrCreate(
                        [
                            'employee_id' => $leave->employee_id,
                            'date' => $currentDate->toDateString(),
                            'company_id' => $leave->company_id ?? auth()->user()->company_id
                        ],
                        [
                            'status' => 'leave',
                            'leave_type' => $leave->leave_type,
                            'leave_request_id' => $leave->id
                        ]
                    );
                }
                $currentDate->addDay();
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Error recording leave to attendance: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * مشكلة 2: Payroll → محاسبة
     * إنشاء قيود محاسبية للرواتب
     */
    public function createPayrollJournalEntry(Payroll $payroll)
    {
        try {
            // حساب الراتب الشهري
            $salaryAmount = $payroll->total_salary ?? 0;
            $deductionsAmount = $payroll->total_deductions ?? 0;
            $netAmount = $salaryAmount - $deductionsAmount;

            // الحسابات المحاسبية (يجب تخصيصها حسب الشركة)
            $expenseAccountId = Account::where('code', '=010001')->value('id'); // Salary Expense
            $liabilityAccountId = Account::where('code', '=020005')->value('id'); // Salary Payable

            if (!$expenseAccountId || !$liabilityAccountId) {
                return false;
            }

            $journalEntry = JournalEntry::create([
                'company_id' => $payroll->company_id,
                'date' => Carbon::now(),
                'reference' => 'PAYROLL-' . $payroll->id,
                'description' => 'Salary Payment for ' . $payroll->period,
                'total_debit' => $salaryAmount,
                'total_credit' => $salaryAmount,
                'status' => 'draft'
            ]);

            // Debit: Salary Expense
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $expenseAccountId,
                'debit' => $salaryAmount,
                'credit' => 0,
                'description' => 'Salary Expense'
            ]);

            // Credit: Salary Payable
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $liabilityAccountId,
                'debit' => 0,
                'credit' => $salaryAmount,
                'description' => 'Salary Payable'
            ]);

            // تحديث حالة الرواتب
            $payroll->update(['journal_entry_id' => $journalEntry->id, 'accounting_status' => 'journalized']);

            return true;
        } catch (\Exception $e) {
            \Log::error('Error creating payroll journal entry: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * مشكلة 3: POS → محاسبة
     * إنشاء قيود محاسبية للمبيعات من الكاشير
     */
    public function createPosJournalEntry(PosOrder $posOrder)
    {
        try {
            $totalAmount = $posOrder->total_amount ?? 0;
            $taxAmount = $posOrder->tax_amount ?? 0;
            $netAmount = $totalAmount - $taxAmount;

            // الحسابات المحاسبية
            $cashAccountId = Account::where('code', '=010002')->value('id'); // Cash
            $revenueAccountId = Account::where('code', '=030001')->value('id'); // Sales Revenue
            $taxPayableAccountId = Account::where('code', '=020003')->value('id'); // Tax Payable

            if (!$cashAccountId || !$revenueAccountId) {
                return false;
            }

            $journalEntry = JournalEntry::create([
                'company_id' => $posOrder->company_id,
                'date' => Carbon::now(),
                'reference' => 'POS-' . $posOrder->id,
                'description' => 'POS Sale - Order #' . $posOrder->id,
                'total_debit' => $totalAmount,
                'total_credit' => $totalAmount,
                'status' => 'draft'
            ]);

            // Debit: Cash
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $cashAccountId,
                'debit' => $totalAmount,
                'credit' => 0,
                'description' => 'Cash Received - POS'
            ]);

            // Credit: Sales Revenue
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $revenueAccountId,
                'debit' => 0,
                'credit' => $netAmount,
                'description' => 'Sales Revenue'
            ]);

            // Credit: Tax Payable (إذا كان هناك ضرائب)
            if ($taxAmount > 0) {
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $taxPayableAccountId,
                    'debit' => 0,
                    'credit' => $taxAmount,
                    'description' => 'Sales Tax Payable'
                ]);
            }

            $posOrder->update(['journal_entry_id' => $journalEntry->id]);

            return true;
        } catch (\Exception $e) {
            \Log::error('Error creating POS journal entry: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * مشكلة 4: Expenses → محاسبة
     * إنشاء قيود محاسبية للمصروفات المعتمدة
     */
    public function createExpenseJournalEntry(Expense $expense)
    {
        try {
            if ($expense->status !== 'approved') {
                return false;
            }

            $amount = $expense->amount ?? 0;

            // الحسابات المحاسبية
            $expenseAccountId = Account::where('category', $expense->category)->value('id');
            $cashAccountId = Account::where('code', '=010002')->value('id'); // Cash/Bank

            if (!$expenseAccountId || !$cashAccountId) {
                return false;
            }

            $journalEntry = JournalEntry::create([
                'company_id' => $expense->company_id,
                'date' => Carbon::now(),
                'reference' => 'EXP-' . $expense->id,
                'description' => $expense->description,
                'total_debit' => $amount,
                'total_credit' => $amount,
                'status' => 'draft'
            ]);

            // Debit: Expense Account
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $expenseAccountId,
                'debit' => $amount,
                'credit' => 0,
                'description' => 'Expense: ' . $expense->category
            ]);

            // Credit: Cash/Bank
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $cashAccountId,
                'debit' => 0,
                'credit' => $amount,
                'description' => 'Cash Paid'
            ]);

            $expense->update(['journal_entry_id' => $journalEntry->id, 'accounting_status' => 'journalized']);

            return true;
        } catch (\Exception $e) {
            \Log::error('Error creating expense journal entry: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * مشكلة 5: eCommerce → محاسبة
     * إنشاء قيود محاسبية لطلبات التجارة الإلكترونية
     */
    public function createEcommerceOrderJournalEntry($ecommerceOrder)
    {
        try {
            $totalAmount = $ecommerceOrder->total_amount ?? 0;
            $taxAmount = $ecommerceOrder->tax_amount ?? 0;
            $netAmount = $totalAmount - $taxAmount;

            // الحسابات
            $arAccountId = Account::where('code', '=010003')->value('id'); // Accounts Receivable
            $revenueAccountId = Account::where('code', '=030001')->value('id'); // Sales Revenue

            if (!$arAccountId || !$revenueAccountId) {
                return false;
            }

            $journalEntry = JournalEntry::create([
                'company_id' => $ecommerceOrder->company_id,
                'date' => Carbon::now(),
                'reference' => 'ECOM-' . $ecommerceOrder->id,
                'description' => 'E-Commerce Order #' . $ecommerceOrder->id,
                'total_debit' => $totalAmount,
                'total_credit' => $totalAmount,
                'status' => 'draft'
            ]);

            // Debit: Accounts Receivable
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $arAccountId,
                'debit' => $totalAmount,
                'credit' => 0,
                'description' => 'E-Commerce Sales'
            ]);

            // Credit: Sales Revenue
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $revenueAccountId,
                'debit' => 0,
                'credit' => $netAmount,
                'description' => 'Sales Revenue'
            ]);

            return true;
        } catch (\Exception $e) {
            \Log::error('Error creating ecommerce journal entry: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * مشكلة 6: Recruitment → Employee
     * تحويل المتقدم المقبول إلى موظف تلقائياً
     */
    public function convertApprovedCandidateToEmployee($candidate)
    {
        try {
            if ($candidate->status !== 'approved' || isset($candidate->employee_id)) {
                return false;
            }

            $employee = \App\Models\Employee::create([
                'company_id' => $candidate->company_id,
                'candidate_id' => $candidate->id,
                'first_name' => $candidate->first_name,
                'last_name' => $candidate->last_name,
                'email' => $candidate->email,
                'phone' => $candidate->phone,
                'job_position_id' => $candidate->job_position_id,
                'department' => $candidate->department,
                'employment_date' => Carbon::now(),
                'status' => 'active'
            ]);

            $candidate->update(['employee_id' => $employee->id]);

            return $employee;
        } catch (\Exception $e) {
            \Log::error('Error converting candidate to employee: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * مشكلة 7: CRM → Sales
     * تحويل الفرصة إلى عملية بيع تلقائياً
     */
    public function convertOpportunityToSale(CrmOpportunity $opportunity)
    {
        try {
            if ($opportunity->stage !== 'closed-won' || isset($opportunity->sale_id)) {
                return false;
            }

            $sale = Sale::create([
                'company_id' => $opportunity->company_id,
                'opportunity_id' => $opportunity->id,
                'customer_id' => $opportunity->lead_id,
                'amount' => $opportunity->value,
                'expected_revenue' => $opportunity->value,
                'status' => 'draft',
                'date' => Carbon::now()
            ]);

            $opportunity->update(['sale_id' => $sale->id, 'stage' => 'closed-won']);

            return $sale;
        } catch (\Exception $e) {
            \Log::error('Error converting opportunity to sale: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * مشكلة 8: Fleet → محاسبة
     * تسجيل تكاليف الوقود والصيانة محاسبياً
     */
    public function createFleetCostJournalEntry($type, $fleetCost)
    {
        try {
            $amount = $fleetCost->amount ?? 0;
            $description = '';

            if ($type === 'fuel') {
                $accountCode = '010004'; // Fuel Expense
                $description = 'Fuel Cost - Vehicle #' . $fleetCost->vehicle_id;
            } elseif ($type === 'maintenance') {
                $accountCode = '010005'; // Maintenance Expense
                $description = 'Maintenance Cost - Vehicle #' . $fleetCost->vehicle_id;
            } else {
                return false;
            }

            $expenseAccountId = Account::where('code', $accountCode)->value('id');
            $cashAccountId = Account::where('code', '=010002')->value('id');

            if (!$expenseAccountId || !$cashAccountId) {
                return false;
            }

            $journalEntry = JournalEntry::create([
                'company_id' => $fleetCost->company_id,
                'date' => Carbon::now(),
                'reference' => strtoupper($type) . '-' . $fleetCost->id,
                'description' => $description,
                'total_debit' => $amount,
                'total_credit' => $amount,
                'status' => 'draft'
            ]);

            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $expenseAccountId,
                'debit' => $amount,
                'credit' => 0,
                'description' => $description
            ]);

            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $cashAccountId,
                'debit' => 0,
                'credit' => $amount,
                'description' => 'Cash/Bank Paid'
            ]);

            $fleetCost->update(['journal_entry_id' => $journalEntry->id]);

            return true;
        } catch (\Exception $e) {
            \Log::error('Error creating fleet cost journal entry: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * مشكلة 9: Projects → Invoicing
     * توليد فاتورة من المشروع تلقائياً
     */
    public function generateProjectInvoice(Project $project)
    {
        try {
            if ($project->status !== 'completed' || isset($project->invoice_id)) {
                return false;
            }

            // استخدم Sale كفاتورة
            $invoice = Sale::create([
                'company_id' => $project->company_id,
                'project_id' => $project->id,
                'customer_id' => $project->customer_id,
                'amount' => $project->budget,
                'status' => 'draft',
                'date' => Carbon::now(),
                'description' => 'Invoice for Project: ' . $project->name
            ]);

            $project->update(['invoice_id' => $invoice->id, 'invoiced' => true]);

            return $invoice;
        } catch (\Exception $e) {
            \Log::error('Error generating project invoice: ' . $e->getMessage());
            return false;
        }
    }
}
