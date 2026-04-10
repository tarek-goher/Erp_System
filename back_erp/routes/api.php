<?php

use App\Http\Controllers\API\AccountController;
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
use App\Http\Controllers\API\EmployeeController;
use App\Http\Controllers\API\FixedAssetController;
use App\Http\Controllers\API\FleetController;
use App\Http\Controllers\API\FuelController;
use App\Http\Controllers\API\HelpdeskController;
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
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ERP System — API Routes
|--------------------------------------------------------------------------
*/

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

    // ── Quotations ───────────────────────────────────────────
    Route::apiResource('quotations', QuotationController::class);
    Route::post('quotations/{sale}/convert', [QuotationController::class, 'convertToSale']);

    // ── Purchases ────────────────────────────────────────────
    Route::prefix('purchases')->controller(PurchaseController::class)->group(function () {
        Route::get('/',       'index');
        Route::post('/',      'store');
        Route::get('{id}',    'show');
        Route::put('{id}',    'update');
        Route::delete('{id}', 'destroy');
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

    // ── Inventory & Warehouses ───────────────────────────────
    Route::post('stock-movements/transfer', [StockMovementController::class, 'transfer']);
    Route::get('stock-transfers', [StockMovementController::class, 'transfers']);
Route::apiResource('stock-movements', StockMovementController::class);
      Route::post('warehouses/transfer',    [WarehouseController::class, 'transfer']);
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
    Route::apiResource('recruitment', RecruitmentController::class);

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

    // ── Fleet ────────────────────────────────────────────────
    Route::apiResource('fleet',       FleetController::class);
    Route::apiResource('fuel',        FuelController::class);
    Route::apiResource('maintenance', MaintenanceController::class);

    // ── Fixed Assets ─────────────────────────────────────────
    Route::apiResource('fixed-assets', FixedAssetController::class);

    // ── Accounting ───────────────────────────────────────────
    Route::apiResource('journal-entries', JournalEntryController::class);
    Route::apiResource('accounts',        AccountController::class);
    Route::apiResource('budgets',         BudgetController::class);
    Route::apiResource('bank-statements', BankStatementController::class);

    // ── Marketing ────────────────────────────────────────────
    Route::apiResource('marketing',          MarketingController::class);
    Route::apiResource('marketing-contacts', MarketingContactController::class);

    // ── Helpdesk ─────────────────────────────────────────────
    Route::prefix('helpdesk')->controller(HelpdeskController::class)->group(function () {
        Route::get('/',               'index');
        Route::post('/',              'store');
        Route::get('{ticket}',        'show');
        Route::put('{ticket}',        'update');
        Route::delete('{ticket}',     'destroy');
        Route::post('{ticket}/reply', 'reply');
        Route::post('{ticket}/close', 'close');
    });

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