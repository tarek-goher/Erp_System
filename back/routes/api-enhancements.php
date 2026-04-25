<?php

use App\Http\Controllers\API\ManufacturingEnhancedController;
use App\Http\Controllers\API\BankReconciliationController;
use App\Http\Controllers\API\FieldServiceController;

// إضافة هذه الـ Routes في api.php

// ===== Manufacturing (MRP) Routes =====
Route::middleware(['auth:sanctum', 'company'])->group(function () {
    
    // Work Centers
    Route::get('/work-centers', [ManufacturingEnhancedController::class, 'getWorkCenters']);
    Route::post('/work-centers', [ManufacturingEnhancedController::class, 'storeWorkCenter']);
    Route::put('/work-centers/{id}', [ManufacturingEnhancedController::class, 'updateWorkCenter']);
    Route::delete('/work-centers/{id}', [ManufacturingEnhancedController::class, 'deleteWorkCenter']);

    // BOM Routes
    Route::get('/bom/product/{productId}', [ManufacturingEnhancedController::class, 'getBOMStructure']);
    Route::post('/bom-items', [ManufacturingEnhancedController::class, 'storeBOMItem']);
    Route::put('/bom-items/{id}', [ManufacturingEnhancedController::class, 'updateBOMHierarchy']);
    Route::delete('/bom-items/{id}', [ManufacturingEnhancedController::class, 'deleteBOMItem']);
    Route::get('/bom-items/{id}/tree', [ManufacturingEnhancedController::class, 'getBOMTree']);
    Route::get('/bom-items/{id}/children', [ManufacturingEnhancedController::class, 'getBOMChildren']);
    Route::post('/bom-items/{id}/validate-stock', [ManufacturingEnhancedController::class, 'validateBOMStock']);

    // Routing Routes
    Route::get('/routing/product/{productId}', [ManufacturingEnhancedController::class, 'getRoutingForProduct']);
    Route::post('/routing', [ManufacturingEnhancedController::class, 'storeRouting']);
    Route::put('/routing/{id}', [ManufacturingEnhancedController::class, 'updateRouting']);
    Route::delete('/routing/{id}', [ManufacturingEnhancedController::class, 'deleteRouting']);
    Route::get('/routing/{id}/cost-estimate', [ManufacturingEnhancedController::class, 'getRoutingCostEstimate']);
});

// ===== Accounting (Bank Reconciliation) Routes =====
Route::middleware(['auth:sanctum', 'company'])->group(function () {
    
    // Bank Accounts
    Route::get('/bank-accounts', [BankReconciliationController::class, 'getBankAccounts']);
    Route::post('/bank-accounts', [BankReconciliationController::class, 'createBankAccount']);
    Route::put('/bank-accounts/{id}', [BankReconciliationController::class, 'updateBankAccount']);
    Route::delete('/bank-accounts/{id}', [BankReconciliationController::class, 'deleteBankAccount']);
    Route::get('/bank-accounts/{id}', [BankReconciliationController::class, 'getBankAccountDetail']);

    // Bank Statements
    Route::post('/bank-statements/upload', [BankReconciliationController::class, 'uploadBankStatement']);
    Route::get('/bank-statements/{bankAccountId}', [BankReconciliationController::class, 'getBankStatements']);
    Route::get('/bank-statements/{id}/details', [BankReconciliationController::class, 'getStatementDetails']);
    Route::put('/bank-statements/{id}', [BankReconciliationController::class, 'updateBankStatement']);

    // Matching Transactions
    Route::post('/bank-statements/{detailId}/match', [BankReconciliationController::class, 'matchTransaction']);
    Route::post('/bank-statements/{detailId}/unmatch', [BankReconciliationController::class, 'unmatchTransaction']);
    Route::get('/bank-statements/{statementId}/unmatched', [BankReconciliationController::class, 'getUnmatchedTransactions']);
    Route::post('/bank-statements/{statementId}/auto-match', [BankReconciliationController::class, 'autoMatchTransactions']);

    // Reconciliation
    Route::post('/reconciliations/start/{statementId}', [BankReconciliationController::class, 'startReconciliation']);
    Route::post('/reconciliations/complete/{statementId}', [BankReconciliationController::class, 'completeReconciliation']);
    Route::post('/reconciliations/{id}/post', [BankReconciliationController::class, 'postReconciliation']);
    Route::get('/reconciliations/{bankAccountId}', [BankReconciliationController::class, 'getReconciliations']);
    Route::get('/reconciliations/{id}', [BankReconciliationController::class, 'getReconciliationDetail']);
});

// ===== Field Service Routes =====
Route::middleware(['auth:sanctum', 'company'])->group(function () {
    
    // Service Requests
    Route::get('/field-service-requests', [FieldServiceController::class, 'getServiceRequests']);
    Route::post('/field-service-requests', [FieldServiceController::class, 'createServiceRequest']);
    Route::get('/field-service-requests/{id}', [FieldServiceController::class, 'getServiceRequestDetail']);
    Route::put('/field-service-requests/{id}', [FieldServiceController::class, 'updateServiceRequest']);
    Route::delete('/field-service-requests/{id}', [FieldServiceController::class, 'cancelServiceRequest']);

    // Technician Assignment
    Route::post('/field-service-requests/{id}/assign-technician', [FieldServiceController::class, 'assignTechnician']);
    Route::post('/field-service-requests/{id}/reassign-technician', [FieldServiceController::class, 'reassignTechnician']);
    Route::get('/field-service-requests/{id}/available-technicians', [FieldServiceController::class, 'getAvailableTechnicians']);

    // Service Execution
    Route::post('/field-service-requests/{id}/start', [FieldServiceController::class, 'startService']);
    Route::post('/field-service-requests/{id}/complete', [FieldServiceController::class, 'completeService']);
    Route::post('/field-service-requests/{id}/reschedule', [FieldServiceController::class, 'rescheduleService']);

    // Technicians Management
    Route::get('/field-technicians', [FieldServiceController::class, 'getFieldTechnicians']);
    Route::post('/field-technicians', [FieldServiceController::class, 'createFieldTechnician']);
    Route::get('/field-technicians/{id}', [FieldServiceController::class, 'getTechnicianDetail']);
    Route::put('/field-technicians/{id}', [FieldServiceController::class, 'updateFieldTechnician']);
    Route::get('/field-technicians/{id}/location', [FieldServiceController::class, 'getTechnicianLocation']);
    Route::post('/field-technicians/{id}/location', [FieldServiceController::class, 'updateTechnicianLocation']);
    Route::get('/field-technicians/{id/schedule', [FieldServiceController::class, 'getTechnicianSchedule']);
    Route::get('/field-technicians/{id}/ratings', [FieldServiceController::class, 'getTechnicianRatings']);

    // Reports & Ratings
    Route::post('/field-service-requests/{id}/rate', [FieldServiceController::class, 'rateTechnician']);
    Route::get('/field-service-reports/{requestId}', [FieldServiceController::class, 'getServiceReport']);
    Route::get('/field-technicians/{id}/performance', [FieldServiceController::class, 'getTechnicianPerformance']);
});
