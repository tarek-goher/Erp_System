<?php

use App\Http\Controllers\API\AccountController;
use App\Http\Controllers\API\GeneralLedgerController;
use App\Http\Controllers\API\AIController;
use App\Http\Controllers\API\AppraisalController;
use App\Http\Controllers\API\AttendanceController;
use App\Http\Controllers\API\AuditLogController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BackupController;
use App\Http\Controllers\API\BankStatementController;
use App\Http\Controllers\API\BranchController;
use App\Http\Controllers\API\BudgetController;
use App\Http\Controllers\API\CannedResponseController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\CompanySettingsController;
use App\Http\Controllers\API\CrmController;
use App\Http\Controllers\API\CurrencyController;
use App\Http\Controllers\API\CustomerController;
use App\Http\Controllers\API\EcommerceProductController;
use App\Http\Controllers\API\EcommerceOrderController;
use App\Http\Controllers\API\EmployeeController;
use App\Http\Controllers\API\ExpenseController;
use App\Http\Controllers\API\FixedAssetController;
use App\Http\Controllers\API\FleetController;
use App\Http\Controllers\API\FuelController;
use App\Http\Controllers\API\HelpdeskController;
use App\Http\Controllers\API\CompanyHolidayController;
use App\Http\Controllers\API\CompanySettingController;
use App\Http\Controllers\API\EscalationRuleController;
use App\Http\Controllers\API\NotificationPreferenceController;
use App\Http\Controllers\API\ServiceCatalogController;
use App\Http\Controllers\API\TagController;
use App\Http\Controllers\API\TicketAttachmentController;
use App\Http\Controllers\API\TicketLogController;
use App\Http\Controllers\API\JournalEntryController;
use App\Http\Controllers\API\LeaveRequestController;
use App\Http\Controllers\API\MaintenanceController;
use App\Http\Controllers\API\ManufacturingController;
use App\Http\Controllers\API\MarketingContactController;
use App\Http\Controllers\API\MarketingController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\PayrollController;
use App\Http\Controllers\API\PosController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\ProjectController;
use App\Http\Controllers\API\PurchaseController;
use App\Http\Controllers\API\PurchaseInvoiceController;
use App\Http\Controllers\API\QuotationController;
use App\Http\Controllers\API\RecruitmentController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\ReturnController;
use App\Http\Controllers\API\RoleController;
use App\Http\Controllers\API\SaleController;
use App\Http\Controllers\API\SalePaymentController;
use App\Http\Controllers\API\SecurityController;
use App\Http\Controllers\API\StockMovementController;
use App\Http\Controllers\API\SubscriptionController;
use App\Http\Controllers\API\SupplierController;
use App\Http\Controllers\API\TaxController;
use App\Http\Controllers\API\TimesheetController;
use App\Http\Controllers\API\TwoFactorController;
use App\Http\Controllers\API\ETA\ETAController;
use App\Http\Controllers\API\LoyaltyController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\WarehouseController;
use App\Http\Controllers\API\SuperAdmin\CompanyController as SuperAdminCompanyController;
use App\Http\Controllers\API\SuperAdmin\SuperAdminUserController;
use App\Http\Controllers\API\SuperAdmin\TicketController as SuperAdminTicketController;
use App\Http\Controllers\API\SuperAdmin\SubscriptionController as SuperAdminSubscriptionController;
use App\Http\Controllers\API\ApplicantController;
use App\Http\Controllers\API\HelpdeskAnalyticsController;
use App\Http\Controllers\API\WorkflowController;
use App\Http\Controllers\API\KnowledgeBaseController;
use App\Http\Controllers\API\CsatController;
use App\Http\Controllers\API\SlaController;
use App\Http\Controllers\API\OrgChartController;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| ERP System — API Routes
|--------------------------------------------------------------------------
*/

// ─────────────────────────────────────────────────────────────
// 0. Public Routes (no auth)
// ─────────────────────────────────────────────────────────────
// CSAT: العميل يقيّم التذكرة عبر رابط خاص بدون تسجيل دخول
Route::post('csat/{token}', [CsatController::class, 'submit'])->middleware('throttle:5,1');

// ─────────────────────────────────────────────────────────────
// 1. Authentication
// ─────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login',    [AuthController::class, 'login']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout',          [AuthController::class, 'logout']);
        Route::get('me',               [AuthController::class, 'me']);
        Route::put('me',               [AuthController::class, 'updateProfile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });
});

// ─────────────────────────────────────────────────────────────
// 2. Protected Routes (company-scoped, auth required)
// ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'company.active', 'throttle:120,1'])->group(function () {

    // ── Dashboard & Reports ──────────────────────────────────
    Route::prefix('reports')->controller(ReportController::class)->group(function () {
        Route::get('dashboard',         'dashboard');
        Route::get('sales',             'sales');
        Route::get('purchases',         'purchases');
        Route::get('inventory',         'inventory');
        Route::get('hr',                'hr');
        Route::get('accounting',        'accounting');
        Route::get('customers',         'customers');
        Route::get('products',          'products');
        Route::get('income-statement',  'incomeStatement');
        Route::get('balance-sheet',     'balanceSheet');
        Route::get('cash-flow',         'cashFlow');
        Route::get('journal-entries',   'journalEntries');
        Route::get('sales-summary',     'salesSummary');
        Route::get('export/sales',      'exportSales');
        Route::get('export/purchases',  'exportPurchases');
        Route::get('export/profits',    'exportProfits');
    });

    // ── Sales ────────────────────────────────────────────────
    Route::prefix('sales')->controller(SaleController::class)->group(function () {
        Route::get('stats',      'stats');
        Route::get('/',          'index');
        Route::post('/',         'store');
        Route::get('{sale}',     'show');
        Route::put('{sale}',     'update');
        Route::delete('{sale}',  'destroy');
        Route::get('{sale}/pdf', 'downloadPdf');
    });

    // ── Partial Payments ─────────────────────────────────────
    Route::prefix('sales/{sale}/payments')->controller(SalePaymentController::class)->group(function () {
        Route::get('/',            'index');
        Route::post('/',           'store');
        Route::delete('{payment}', 'destroy');
    });

    // ── Sales Returns ────────────────────────────────────────
    Route::prefix('returns')->controller(ReturnController::class)->group(function () {
        Route::patch('{return}/accept', 'acceptReturn');
        Route::patch('{return}/reject', 'rejectReturn');
    });

    // ── Quotations ───────────────────────────────────────────
// ── Quotations ───────────────────────────────────────────
Route::prefix('quotations')->controller(QuotationController::class)->group(function () {
    Route::get('/',           'index');
    Route::post('/',          'store');
    Route::get('{sale}',      'show');
    Route::put('{sale}',      'update');
    Route::delete('{sale}',   'destroy');
});
Route::post('quotations/{sale}/convert', [QuotationController::class, 'convertToSale']);

    // ── Purchases ────────────────────────────────────────────
    Route::prefix('purchases')->controller(PurchaseController::class)->group(function () {
        Route::get('stats',   'stats');
        Route::get('/',       'index');
        Route::post('/',      'store');
        Route::get('{id}',    'show');
        Route::put('{id}',    'update');
        Route::delete('{id}', 'destroy');
        Route::patch('{id}/receive', 'receive');
    });
    Route::apiResource('purchase-invoices', PurchaseInvoiceController::class);

    // ── Taxes ────────────────────────────────────────────────
    Route::get('tax-rates', [TaxController::class, 'active']);
    Route::prefix('taxes')->controller(TaxController::class)->group(function () {
        Route::get('/',          'index');
        Route::get('active',     'active');
        Route::get('periods',    'periods');
        Route::get('vat-report', 'vatReport');
        Route::post('/',         'store');
        Route::put('{tax}',      'update');
        Route::delete('{tax}',   'destroy');
    });

    // ── Products ─────────────────────────────────────────────
    Route::prefix('products')->controller(ProductController::class)->group(function () {
        Route::get('/',                        'index');
        Route::post('/',                       'store');
        Route::get('{product}',               'show');
        Route::put('{product}',               'update');
        Route::delete('{product}',            'destroy');
        Route::post('{product}/adjust-stock', 'adjustStock'); // ✅ تعديل المخزون
    });

    // ── Customers ────────────────────────────────────────────
    Route::apiResource('customers',  CustomerController::class);
    Route::apiResource('categories', CategoryController::class);

    // ── Suppliers ────────────────────────────────────────────
    Route::apiResource('suppliers', SupplierController::class);
    Route::post('suppliers/{supplier}/attachments', [SupplierController::class, 'storeAttachments']);
    Route::post('suppliers/{supplier}/ledger',      [SupplierController::class, 'storeLedger']); // ← أضف ده


    // ── Inventory & Warehouses ───────────────────────────────
    Route::post('stock-movements/transfer', [StockMovementController::class, 'transfer']);
    Route::get('stock-transfers', [StockMovementController::class, 'transfers']);
Route::apiResource('stock-movements', StockMovementController::class);
    //   Route::post('warehouses/transfer',    [WarehouseController::class, 'transfer']);
    Route::apiResource('warehouses',      WarehouseController::class);
  

    // ── HR ───────────────────────────────────────────────────
    Route::apiResource('employees',     EmployeeController::class);
    Route::apiResource('leave-requests', LeaveRequestController::class);
    Route::post('leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve']);
    Route::post('leave-requests/{leaveRequest}/reject',  [LeaveRequestController::class, 'reject']);

    // ── Appraisals ───────────────────────────────────────────
    Route::prefix('appraisals')->controller(AppraisalController::class)->group(function () {
        Route::get('stats',    'stats');
        Route::get('periods',  'periods');
        Route::get('/',        'index');
        Route::post('/',       'store');
        Route::get('{appraisal}',          'show');
        Route::put('{appraisal}',          'update');
        Route::delete('{appraisal}',       'destroy');
        Route::post('{appraisal}/submit',  'submit');
        Route::post('{appraisal}/approve', 'approve');
        Route::post('{appraisal}/reject',  'reject');
    });

    // ── Payroll ──────────────────────────────────────────────
    Route::prefix('payroll')->controller(PayrollController::class)->group(function () {
        Route::get('/',              'index');
        Route::post('generate',      'generate');
        Route::get('{payroll}',      'show');
        Route::put('{payroll}',      'update');
        Route::post('{payroll}/pay', 'pay');
    });

    // ── Timesheets ───────────────────────────────────────────
    Route::apiResource('timesheets', TimesheetController::class);

    // ── Attendance ───────────────────────────────────────────
    Route::apiResource('attendance', AttendanceController::class);

// ── Recruitment ────────────────────────────────────────── 
Route::prefix('recruitment')->group(function () {
    // Dashboard Summary - Must be before apiResource to avoid conflicts
    Route::get('dashboard-summary', [RecruitmentController::class, 'dashboardSummary']);
    
    // Filter by status
    Route::get('by-status', [RecruitmentController::class, 'byStatus']);
    
    // CRUD Operations - Handle {recruitment} parameter properly
    Route::get('/{recruitment}', [RecruitmentController::class, 'show']);
    Route::post('/', [RecruitmentController::class, 'store']);
    Route::get('/', [RecruitmentController::class, 'index']);
    Route::put('/{recruitment}', [RecruitmentController::class, 'update']);
    Route::delete('/{recruitment}', [RecruitmentController::class, 'destroy']);
    
    // Custom POST actions for existing resources
    Route::post('/{recruitment}/archive', [RecruitmentController::class, 'archive']);
    Route::post('/{recruitment}/unarchive', [RecruitmentController::class, 'unarchive']);
    Route::post('/{recruitment}/duplicate', [RecruitmentController::class, 'duplicate']);
    
    // Related resources
    Route::get('/{jobId}/applicants', [RecruitmentController::class, 'getApplicants']);
    Route::get('/{jobId}/pipeline-stats', [RecruitmentController::class, 'getPipelineStats']);
});
    // ── Applicants ──────────────────────────────
    Route::apiResource('applicants', ApplicantController::class);
    Route::patch('applicants/{id}/stage', [ApplicantController::class, 'changePipelineStage']);
    Route::post('applicants/{id}/upload-cv', [ApplicantController::class, 'uploadCV']);
    Route::get('applicants-stats/pipeline', [ApplicantController::class, 'pipelineStats']);
    Route::get('applicants-stats/high-rated', [ApplicantController::class, 'highRated']);
    Route::get('applicants-stats/by-job/{jobId}', [ApplicantController::class, 'byJob']);

    // ── POS ──────────────────────────────────────────────────
    Route::prefix('pos')->controller(PosController::class)->group(function () {
        Route::get('stats',                'stats');
        Route::get('products',             'products');
        Route::get('current-shift',        'currentShift');
        Route::get('shifts',               'shifts');
        Route::get('orders',               'orders');
        Route::get('barcode/{code}',       'barcodeLookup');
        Route::get('loyalty/{customer}',   'loyaltyBalance');
        Route::post('open-shift',          'openShift');
        Route::post('close-shift/{shift}', 'closeShift');
        Route::post('sale',                'sale');
    });

    // ── CRM ──────────────────────────────────────────────────
    Route::prefix('crm')->controller(CrmController::class)->group(function () {
        Route::get('stats',    'stats');
        Route::get('pipeline', 'pipeline');
        Route::get('kanban',   'kanban');
        Route::get('leads',              'leads');
        Route::post('leads',             'storeLead');
        Route::get('leads/{lead}',       'showLead');
        Route::put('leads/{lead}',       'updateLead');
        Route::delete('leads/{lead}',    'destroyLead');
        Route::put('leads/{lead}/stage', 'moveStage');
        Route::get('activities',         'activities');
        Route::post('activities',        'storeActivity');
        Route::get('opportunities',                      'opportunities');
        Route::post('opportunities',                     'storeOpportunity');
        Route::put('opportunities/{opportunity}',        'updateOpportunity');
    });

    // ── Subscription (company-level) ─────────────────────────
    Route::prefix('subscription')->controller(SubscriptionController::class)->group(function () {
        Route::get('/',       'current');
        Route::get('history', 'history');
    });

    // ── Projects ─────────────────────────────────────────────
    Route::apiResource('projects', ProjectController::class);

    // ── Manufacturing ────────────────────────────────────────
    Route::apiResource('manufacturing', ManufacturingController::class);
    Route::get('manufacturing/work-orders',              [ManufacturingController::class, 'workOrders']);
    Route::post('manufacturing/work-orders',             [ManufacturingController::class, 'storeWorkOrder']);
    Route::put('manufacturing/work-orders/{workOrder}',  [ManufacturingController::class, 'updateWorkOrder']);
    Route::post('manufacturing/work-orders/{workOrder}/complete', [ManufacturingController::class, 'completeWorkOrder']);
    Route::post('manufacturing/work-orders/{workOrder}/start',    [ManufacturingController::class, 'startWorkOrder']);

    // ── Fleet ────────────────────────────────────────────────
    Route::apiResource('fleet',       FleetController::class);
    Route::apiResource('fuel',        FuelController::class);
    Route::apiResource('maintenance', MaintenanceController::class);

    // ── Fixed Assets ─────────────────────────────────────────
    Route::apiResource('fixed-assets', FixedAssetController::class);

    // ── Accounting ───────────────────────────────────────────
    Route::prefix('accounting')->group(function () {
        Route::apiResource('journal-entries', JournalEntryController::class);
        Route::post('journal-entries/{journalEntry}/post', [JournalEntryController::class, 'post']);
        Route::put('journal-entries/{journalEntry}', [JournalEntryController::class, 'update']);
        // ✅ الـ trial balance تحت accounting مباشرة (للفرونت)
        Route::get('trial-balance', [AccountController::class, 'trialBalance']);
        Route::get('accounts/trial-balance', [AccountController::class, 'trialBalance']);
        Route::apiResource('accounts',        AccountController::class);
        // ── General Ledger ───────────────────────────────────────
        Route::get('general-ledger',             [GeneralLedgerController::class, 'index']);
        Route::get('general-ledger/{accountId}', [GeneralLedgerController::class, 'show']);
    });
    // Legacy aliases (backward compat for other pages using routes without prefix)
    Route::apiResource('journal-entries', JournalEntryController::class);
    Route::post('journal-entries/{journalEntry}/post', [JournalEntryController::class, 'post']);
    Route::put('journal-entries/{journalEntry}', [JournalEntryController::class, 'update']);
    Route::get('accounts/trial-balance', [AccountController::class, 'trialBalance']);
    Route::apiResource('accounts',        AccountController::class);
    Route::get('general-ledger',             [GeneralLedgerController::class, 'index']);
    Route::get('general-ledger/{accountId}', [GeneralLedgerController::class, 'show']);

    Route::get('budgets/{budget}/vs', [BudgetController::class, 'vs']);
    Route::apiResource('budgets',         BudgetController::class);
    Route::apiResource('bank-statements', BankStatementController::class);

    // ── Marketing ────────────────────────────────────────────
    Route::apiResource('marketing',          MarketingController::class);
    Route::apiResource('marketing-contacts', MarketingContactController::class);

    // ── Helpdesk + Service Desk (MERGED) ────────────────────────
    Route::prefix('helpdesk')->controller(HelpdeskController::class)->group(function () {
        Route::get('/',                           'index');
        Route::post('/',                          'store');
        Route::get('stats',                       'stats');
        Route::get('{ticket}',                    'show');
        Route::put('{ticket}',                    'update');
        Route::delete('{ticket}',                 'destroy');
        Route::post('{ticket}/reply',             'reply');
        Route::post('{ticket}/close',             'close');
        Route::patch('{ticket}/status',           'changeStatus');
        Route::post('{ticket}/assign',            'assign');
        Route::post('{ticket}/resolve',           'resolve');
        Route::post('{ticket}/tags/{tagId}',      'addTag');
        Route::delete('{ticket}/tags/{tagId}',    'removeTag');
    });

    Route::prefix('helpdesk/{ticket}/attachments')->controller(TicketAttachmentController::class)->group(function () {
        Route::get('/',       'index');
        Route::post('/',      'store');
        Route::delete('{id}', 'destroy');
    });

    Route::get('helpdesk/{ticket}/logs', [TicketLogController::class, 'index']);

    // ── Helpdesk Analytics ───────────────────────────────────────
    Route::prefix('helpdesk/analytics')->controller(HelpdeskAnalyticsController::class)->group(function () {
        Route::get('overview',  'overview');
        Route::get('team',      'teamPerformance');
        Route::get('volume',    'volume');
        Route::get('sla',       'slaReport');
    });

    // ── Helpdesk Workflows ───────────────────────────────────────
    Route::prefix('helpdesk/workflows')->controller(WorkflowController::class)->group(function () {
        Route::get('/',          'index');
        Route::post('/',         'store');
        Route::get('{id}',       'show');
        Route::put('{id}',       'update');
        Route::delete('{id}',    'destroy');
        Route::patch('{id}/toggle', 'toggle');
        Route::post('{id}/run',  'run');
    });

    // ── Knowledge Base ───────────────────────────────────────────
    Route::prefix('knowledge')->controller(KnowledgeBaseController::class)->group(function () {
        Route::get('/',                  'index');
        Route::post('/',                 'store');
        Route::get('search',             'search');
        Route::get('categories',         'categories');
        Route::get('{id}',               'show');
        Route::put('{id}',               'update');
        Route::delete('{id}',            'destroy');
        Route::patch('{id}/publish',     'togglePublish');
    });

    // ── CSAT — إرسال طلب التقييم ─────────────────────────────────
    Route::post('helpdesk/{ticket}/csat/send', [CsatController::class, 'send']);
    Route::get('helpdesk/csat/summary',        [CsatController::class, 'summary']);
    Route::get('helpdesk/csat/responses',      [CsatController::class, 'responses']);
    Route::apiResource('service-catalog', ServiceCatalogController::class);
    Route::apiResource('tags', TagController::class);
    Route::apiResource('escalation-rules', EscalationRuleController::class);
    Route::apiResource('sla-policies', SlaController::class);
    Route::get('org-chart', [OrgChartController::class, 'index']);
    Route::post('bank-statements/reconcile', [BankStatementController::class, 'reconcile']);
    Route::post('currencies/{currency}/set-default', [CurrencyController::class, 'setDefault']);
    Route::get('notification-preferences',  [NotificationPreferenceController::class, 'show']);
    Route::put('notification-preferences',  [NotificationPreferenceController::class, 'update']);
    Route::get('company-settings/{companyId}',  [CompanySettingController::class, 'show']);
    Route::post('company-settings/{companyId}', [CompanySettingController::class, 'update']);
    Route::get('companies/{companyId}/holidays',                       [CompanyHolidayController::class, 'index']);
    Route::post('companies/{companyId}/holidays',                      [CompanyHolidayController::class, 'store']);
    Route::put('companies/{companyId}/holidays/{holidayId}',           [CompanyHolidayController::class, 'update']);
    Route::delete('companies/{companyId}/holidays/{holidayId}',        [CompanyHolidayController::class, 'destroy']);
    Route::post('companies/{companyId}/holidays/bulk-import',          [CompanyHolidayController::class, 'bulkImport']);

    // ── Notifications ────────────────────────────────────────
    Route::prefix('notifications')->controller(NotificationController::class)->group(function () {
        Route::get('unread-count',         'unreadCount');
        Route::get('/',                    'index');
        Route::post('{notification}/read', 'markRead');
        Route::post('read-all',            'markAllRead');
        Route::delete('{notification}',    'destroy');
        Route::post('broadcast',           'broadcast');
    });

    // ── Users & Roles ────────────────────────────────────────
    Route::apiResource('users', UserController::class);
    Route::prefix('roles')->controller(RoleController::class)->group(function () {
        Route::get('permissions', 'permissions');
        Route::get('/',           'index');
        Route::post('/',          'store');
        Route::get('{role}',      'show');
        Route::put('{role}',      'update');
        Route::delete('{role}',   'destroy');
    });

    // ── Company Settings ─────────────────────────────────────
    Route::prefix('company')->controller(CompanySettingsController::class)->group(function () {
        Route::get('/',     'show');
        Route::put('/',     'update');
        Route::post('logo', 'uploadLogo');
    });

    Route::apiResource('branches',   BranchController::class);
    Route::apiResource('currencies', CurrencyController::class);
    Route::get('audit-logs',         [AuditLogController::class, 'index']);

    // ── 2FA ──────────────────────────────────────────────────
    Route::prefix('2fa')->controller(TwoFactorController::class)->group(function () {
        Route::get('setup',    'setup');
        Route::post('enable',  'enable');
        Route::post('disable', 'disable');
        Route::post('verify',  'verify');
    });

    // ── Security ─────────────────────────────────────────────
    Route::get('security/sessions',          [SecurityController::class, 'sessions']);
    Route::delete('security/sessions/{id}',  [SecurityController::class, 'revokeSession']);

    // ── AI ───────────────────────────────────────────────────
    Route::prefix('ai')->controller(AIController::class)->group(function () {
        Route::post('chat',    'chat');
        Route::post('analyze', 'analyze');
        Route::get('insights', 'insights');
    });

    // ── Backup ───────────────────────────────────────────────
    Route::prefix('backup')->controller(BackupController::class)->group(function () {
        Route::post('/',          'create');
        Route::get('/',           'index');
        Route::get('{backup}',    'download');
        Route::delete('{backup}', 'destroy');
    });

    Route::apiResource('canned-responses', CannedResponseController::class);

    // ── ETA E-Invoicing ──────────────────────────────────────
    Route::prefix('eta')->controller(ETAController::class)->group(function () {
        Route::post('submit/{sale}', 'submit');
        Route::get('status/{sale}',  'status');
        Route::get('documents',      'documents');
    });

    // ── Loyalty ──────────────────────────────────────────────
    Route::prefix('loyalty')->controller(LoyaltyController::class)->group(function () {
        Route::get('customers',        'customers');
        Route::post('award',           'award');
        Route::post('redeem',          'redeem');
        Route::get('vouchers',         'vouchers');
        Route::post('vouchers',        'storeVoucher');
        Route::put('vouchers/{id}',    'updateVoucher');
        Route::delete('vouchers/{id}', 'destroyVoucher');
    });
});

// ─────────────────────────────────────────────────────────────
// 3. Super Admin Routes — /api/super-admin/*
// ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'super.admin', 'throttle:60,1'])
    ->prefix('super-admin')
    ->group(function () {

    Route::get('stats',      [SuperAdminCompanyController::class, 'stats']);
    Route::get('monitoring', [SuperAdminCompanyController::class, 'monitoring']);
    Route::post('broadcast', [SuperAdminCompanyController::class, 'broadcast']);

    Route::prefix('companies')->controller(SuperAdminCompanyController::class)->group(function () {
        Route::get('/',                   'index');
        Route::post('/',                  'store');
        Route::get('{company}',           'show');
        Route::put('{company}',           'update');
        Route::delete('{company}',        'destroy');
        Route::post('{company}/activate', 'activate');
        Route::post('{company}/suspend',  'suspend');
    });

    Route::prefix('users')->controller(SuperAdminUserController::class)->group(function () {
        Route::get('/',                       'index');
        Route::patch('{user}',                'update');
        Route::delete('{user}',               'destroy');
        Route::post('{user}/toggle-active',   'toggleActive');
        Route::post('{user}/reset-password',  'resetPassword');
    });

    Route::prefix('subscriptions')->controller(SuperAdminSubscriptionController::class)->group(function () {
        Route::get('stats',                  'stats');
        Route::get('/',                      'index');
        Route::post('/',                     'store');
        Route::put('{subscription}',         'update');
        Route::post('{subscription}/renew',  'renew');
        Route::post('{subscription}/cancel', 'cancel');
    });

    Route::prefix('tickets')->controller(SuperAdminTicketController::class)->group(function () {
        Route::get('/',                 'index');
        Route::get('{ticket}',          'show');
        Route::put('{ticket}',          'update');
        Route::patch('{ticket}/status', 'updateStatus');
        Route::post('{ticket}/reply',   'reply');
        Route::delete('{ticket}',       'destroy');
    });
});
// ============ LIVE CHAT ROUTES ============
Route::middleware('auth:sanctum')->prefix('live-chat')->group(function () {
    Route::post('/sessions/start', [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'startSession']);
    Route::post('/messages/send', [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'sendMessage']);
    Route::get('/sessions/{session}/messages', [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'getMessages']);
    Route::get('/agents/available', [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'getAvailableAgents']);
    Route::post('/sessions/{session}/assign', [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'assignAgent']);
    Route::post('/sessions/{session}/close', [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'closeSession']);
    Route::get('/analytics', [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'getAnalytics']);
});

// ============ MULTI-CHANNEL ROUTES ============
Route::middleware('auth:sanctum')->prefix('channels')->group(function () {
    Route::get('/', [\App\Http\Controllers\API\MultiChannel\ChannelIntegrationController::class, 'index']);
    Route::post('/whatsapp/setup', [\App\Http\Controllers\API\MultiChannel\ChannelIntegrationController::class, 'setupWhatsApp']);
    Route::post('/facebook/setup', [\App\Http\Controllers\API\MultiChannel\ChannelIntegrationController::class, 'setupFacebook']);
    Route::post('/instagram/setup', [\App\Http\Controllers\API\MultiChannel\ChannelIntegrationController::class, 'setupInstagram']);
    Route::get('/inbox', [\App\Http\Controllers\API\MultiChannel\ChannelIntegrationController::class, 'getUnifiedInbox']);
    Route::post('/messages/send', [\App\Http\Controllers\API\MultiChannel\ChannelIntegrationController::class, 'sendChannelMessage']);
    Route::get('/statistics', [\App\Http\Controllers\API\MultiChannel\ChannelIntegrationController::class, 'getChannelStats']);
});

// ============ CUSTOMER PORTAL ROUTES (No auth required for registration) ============
Route::prefix('portal')->group(function () {
    Route::post('/auth/register', [\App\Http\Controllers\API\Portal\PortalAuthController::class, 'register']);
    Route::post('/auth/login', [\App\Http\Controllers\API\Portal\PortalAuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [\App\Http\Controllers\API\Portal\PortalAuthController::class, 'logout']);
        Route::get('/auth/me', [\App\Http\Controllers\API\Portal\PortalAuthController::class, 'getCurrentUser']);
        Route::put('/auth/profile', [\App\Http\Controllers\API\Portal\PortalAuthController::class, 'updateProfile']);
        
        // Orders
        Route::get('/orders', [\App\Http\Controllers\API\Portal\PortalOrderController::class, 'index']);
        Route::post('/orders', [\App\Http\Controllers\API\Portal\PortalOrderController::class, 'store']);
        Route::get('/orders/{order}', [\App\Http\Controllers\API\Portal\PortalOrderController::class, 'show']);
        Route::get('/orders/{order}/track', [\App\Http\Controllers\API\Portal\PortalOrderController::class, 'track']);
        
        // Tickets
        Route::get('/tickets', [\App\Http\Controllers\API\Portal\PortalTicketController::class, 'index']);
        Route::post('/tickets', [\App\Http\Controllers\API\Portal\PortalTicketController::class, 'store']);
        Route::get('/tickets/{ticket}', [\App\Http\Controllers\API\Portal\PortalTicketController::class, 'show']);
        
        // Invoices & Payments
        Route::get('/invoices', [\App\Http\Controllers\API\Portal\PortalInvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}/download', [\App\Http\Controllers\API\Portal\PortalInvoiceController::class, 'download']);
        Route::post('/payments', [\App\Http\Controllers\API\Portal\PortalPaymentController::class, 'store']);
    });
});

// ============ BI & ANALYTICS ROUTES ============
Route::middleware('auth:sanctum')->prefix('bi')->group(function () {
    // Dashboards
    Route::get('/dashboards', [\App\Http\Controllers\API\BI\BIDashboardController::class, 'index']);
    Route::post('/dashboards', [\App\Http\Controllers\API\BI\BIDashboardController::class, 'store']);
    Route::get('/dashboards/{dashboard}', [\App\Http\Controllers\API\BI\BIDashboardController::class, 'show']);
    Route::put('/dashboards/{dashboard}', [\App\Http\Controllers\API\BI\BIDashboardController::class, 'update']);
    Route::delete('/dashboards/{dashboard}', [\App\Http\Controllers\API\BI\BIDashboardController::class, 'destroy']);
    Route::post('/dashboards/{dashboard}/set-default', [\App\Http\Controllers\API\BI\BIDashboardController::class, 'setAsDefault']);
    
    // Widgets
    Route::post('/dashboards/{dashboard}/widgets', [\App\Http\Controllers\API\BI\BIDashboardController::class, 'addWidget']);
    Route::delete('/dashboards/{dashboard}/widgets/{widget}', [\App\Http\Controllers\API\BI\BIDashboardController::class, 'removeWidget']);
    
    // Reports
    Route::get('/reports', [\App\Http\Controllers\API\BI\BIReportController::class, 'index']);
    Route::post('/reports', [\App\Http\Controllers\API\BI\BIReportController::class, 'store']);
    Route::post('/reports/{report}/execute', [\App\Http\Controllers\API\BI\BIReportController::class, 'execute']);
    Route::get('/reports/{report}/executions/{execution}', [\App\Http\Controllers\API\BI\BIReportController::class, 'getExecution']);
    Route::post('/reports/{report}/schedule', [\App\Http\Controllers\API\BI\BIReportController::class, 'scheduleReport']);
    
    // KPI Metrics
    Route::get('/kpi-metrics', [\App\Http\Controllers\API\BI\BIKPIController::class, 'index']);
    Route::get('/kpi-metrics/{metric}/data', [\App\Http\Controllers\API\BI\BIKPIController::class, 'getData']);
});

// ============ WEBHOOKS (No auth) ============
Route::prefix('webhooks')->group(function () {
    Route::post('/whatsapp', [\App\Http\Controllers\API\MultiChannel\WebhookController::class, 'handleWhatsApp']);
    Route::post('/facebook', [\App\Http\Controllers\API\MultiChannel\WebhookController::class, 'handleFacebook']);
    Route::post('/instagram', [\App\Http\Controllers\API\MultiChannel\WebhookController::class, 'handleInstagram']);
});


// ============ WEBHOOK VERIFICATION (GET) ============
Route::get('/webhooks/whatsapp',  [\App\Http\Controllers\API\MultiChannel\WebhookController::class, 'verifyWhatsApp']);
Route::get('/webhooks/facebook',  [\App\Http\Controllers\API\MultiChannel\WebhookController::class, 'verifyFacebook']);
Route::get('/webhooks/instagram', [\App\Http\Controllers\API\MultiChannel\WebhookController::class, 'verifyInstagram']);

// ============ LIVE CHAT - EXTRA ROUTES ============
Route::middleware('auth:sanctum')->prefix('live-chat')->group(function () {
    Route::post('/typing',             [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'typing']);
    Route::get('/sessions/pending',    [\App\Http\Controllers\API\LiveChat\LiveChatController::class, 'getPendingSessions']);
});

// ============ BI - DOWNLOAD ROUTE ============
Route::middleware('auth:sanctum')->prefix('bi')->group(function () {
    Route::get('/reports/executions/{execution}/download', [\App\Http\Controllers\API\BI\BIReportController::class, 'download'])
         ->name('bi.report.download');
    Route::get('/kpi-metrics/{metric}/data', [\App\Http\Controllers\API\BI\BIKPIController::class, 'getData']);
    Route::get('/kpi-metrics',               [\App\Http\Controllers\API\BI\BIKPIController::class, 'index']);
});

// ============ PORTAL - MISSING ROUTES ============
Route::prefix('portal')->middleware('auth:sanctum')->group(function () {
    Route::get('/tickets',           [\App\Http\Controllers\API\Portal\PortalTicketController::class, 'index']);
    Route::post('/tickets',          [\App\Http\Controllers\API\Portal\PortalTicketController::class, 'store']);
    Route::get('/tickets/{ticket}',  [\App\Http\Controllers\API\Portal\PortalTicketController::class, 'show']);
    Route::get('/invoices',          [\App\Http\Controllers\API\Portal\PortalInvoiceController::class, 'index']);
    Route::get('/invoices/{invoice}/download', [\App\Http\Controllers\API\Portal\PortalInvoiceController::class, 'download']);
    Route::post('/payments',         [\App\Http\Controllers\API\Portal\PortalPaymentController::class, 'store']);
});

// ============ ECOMMERCE ROUTES ============
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('ecommerce/products', EcommerceProductController::class);
    Route::apiResource('ecommerce/orders', EcommerceOrderController::class);
    Route::put('ecommerce/orders/{order}/status', [EcommerceOrderController::class, 'updateStatus']);
    Route::get('ecommerce/orders/stats', [EcommerceOrderController::class, 'stats']);
});

// ============ EXPENSES ROUTES ============
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('hr/expenses', ExpenseController::class);
    Route::put('hr/expenses/{expense}/approve', [ExpenseController::class, 'approve']);
    Route::put('hr/expenses/{expense}/reject', [ExpenseController::class, 'reject']);
    Route::get('hr/expenses/stats', [ExpenseController::class, 'stats']);
});