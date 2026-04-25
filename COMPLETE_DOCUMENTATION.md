# 📚 التوثيق الكامل - تحسينات ERP Advanced 2026

## 📋 جدول المحتويات
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Models & Relations](#models--relations)
4. [API Endpoints](#api-endpoints)
5. [Controllers](#controllers)
6. [Usage Examples](#usage-examples)
7. [Installation Guide](#installation-guide)

---

## 🎯 Overview

تم إضافة ثلاثة موديولات رئيسية محسّنة بجودة عالية:

### 1. **Manufacturing (MRP) - Advanced**
- Multi-level Bill of Materials
- Work Centers و Routing
- Cost Calculation
- Stock Validation
- Lead Time Calculation

### 2. **Accounting - Bank Reconciliation**
- Multiple Bank Accounts
- Bank Statement Upload
- Transaction Matching
- Automatic Reconciliation
- Multi-Currency Support

### 3. **Field Service Management**
- Technician Management
- Service Request Scheduling
- Real-time GPS Tracking
- Service Report with Digital Signature
- Customer Rating System

---

## 📊 Database Schema

### Manufacturing Tables

```sql
-- Work Centers
CREATE TABLE work_centers (
    id BIGINT PRIMARY KEY,
    company_id BIGINT,
    name VARCHAR(255) UNIQUE,
    code VARCHAR(255) UNIQUE,
    capacity DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    status ENUM('active', 'inactive', 'maintenance'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Work Center Routing
CREATE TABLE work_center_routings (
    id BIGINT PRIMARY KEY,
    company_id BIGINT,
    product_id BIGINT,
    work_center_id BIGINT,
    sequence INT,
    setup_time DECIMAL(10,2),
    operation_time DECIMAL(10,2),
    unit_time DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- BOM Items (Enhanced)
ALTER TABLE bom_items ADD COLUMN parent_bom_id BIGINT;
ALTER TABLE bom_items ADD COLUMN level INT DEFAULT 1;
ALTER TABLE bom_items ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE bom_items ADD COLUMN notes TEXT;
```

### Accounting Tables

```sql
-- Bank Accounts
CREATE TABLE bank_accounts (
    id BIGINT PRIMARY KEY,
    company_id BIGINT,
    name VARCHAR(255),
    bank_name VARCHAR(255),
    account_number VARCHAR(255) UNIQUE,
    branch_code VARCHAR(255),
    account_id BIGINT,
    currency VARCHAR(3),
    opening_balance DECIMAL(15,2),
    status ENUM('active', 'inactive', 'closed'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Bank Statements
CREATE TABLE bank_statements (
    id BIGINT PRIMARY KEY,
    company_id BIGINT,
    bank_account_id BIGINT,
    statement_date DATE,
    opening_balance DECIMAL(15,2),
    closing_balance DECIMAL(15,2),
    transaction_count INT,
    status ENUM('draft', 'in_progress', 'reconciled', 'verified'),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Bank Statement Details
CREATE TABLE bank_statement_details (
    id BIGINT PRIMARY KEY,
    bank_statement_id BIGINT,
    transaction_date DATE,
    reference VARCHAR(255),
    description TEXT,
    debit DECIMAL(15,2),
    credit DECIMAL(15,2),
    balance DECIMAL(15,2),
    matched_transaction_id BIGINT,
    status ENUM('unmatched', 'matched', 'pending'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Bank Reconciliations
CREATE TABLE bank_reconciliations (
    id BIGINT PRIMARY KEY,
    company_id BIGINT,
    bank_account_id BIGINT,
    bank_statement_id BIGINT,
    reconciliation_date DATE,
    statement_balance DECIMAL(15,2),
    calculated_balance DECIMAL(15,2),
    difference DECIMAL(15,2),
    matched_count INT,
    unmatched_count INT,
    status ENUM('draft', 'completed', 'posted'),
    reconciled_by BIGINT,
    reconciled_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Field Service Tables

```sql
-- Field Technicians
CREATE TABLE field_technicians (
    id BIGINT PRIMARY KEY,
    company_id BIGINT,
    employee_id BIGINT,
    license_number VARCHAR(255),
    license_expiry DATE,
    skills JSON,
    hourly_rate DECIMAL(10,2),
    status ENUM('active', 'inactive', 'on_leave'),
    phone VARCHAR(20),
    address TEXT,
    location POINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Field Service Requests
CREATE TABLE field_service_requests (
    id BIGINT PRIMARY KEY,
    company_id BIGINT,
    customer_id BIGINT,
    assigned_technician_id BIGINT,
    reference VARCHAR(255) UNIQUE,
    description TEXT,
    location POINT,
    scheduled_date DATETIME,
    actual_start DATETIME,
    actual_end DATETIME,
    estimated_duration DECIMAL(8,2),
    actual_duration DECIMAL(8,2),
    priority ENUM('low', 'medium', 'high', 'urgent'),
    status ENUM('new', 'assigned', 'in_progress', 'completed', 'cancelled'),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Field Service Details
CREATE TABLE field_service_details (
    id BIGINT PRIMARY KEY,
    field_service_request_id BIGINT,
    item_type VARCHAR(255),
    item_id BIGINT,
    quantity INT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Field Service Reports
CREATE TABLE field_service_reports (
    id BIGINT PRIMARY KEY,
    field_service_request_id BIGINT UNIQUE,
    technician_id BIGINT,
    summary TEXT,
    work_done TEXT,
    issues_found TEXT,
    recommendations TEXT,
    images JSON,
    total_amount DECIMAL(10,2),
    customer_signature_status ENUM('pending', 'signed', 'rejected'),
    customer_signature TEXT,
    signed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Field Technician Tracking
CREATE TABLE field_technician_tracking (
    id BIGINT PRIMARY KEY,
    field_technician_id BIGINT,
    location POINT,
    timestamp DATETIME,
    accuracy FLOAT,
    source VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Field Technician Ratings
CREATE TABLE field_technician_ratings (
    id BIGINT PRIMARY KEY,
    field_service_request_id BIGINT,
    technician_id BIGINT,
    customer_id BIGINT,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🔗 Models & Relations

### BomItem Model
```php
namespace App\Models;

class BomItem extends Model {
    // Relations
    public function workOrder() { }
    public function product() { }
    public function parentBom() { }
    public function childItems() { }
    
    // Methods
    public function getAllChildren() { }
    public function getTotalCostWithChildren() { }
    public function isAvailableInStock() { }
    public function calculateLeadTime() { }
}
```

### WorkCenter Model
```php
class WorkCenter extends Model {
    public function company() { }
    public function routings() { }
    public function isOperational() { }
    public function calculateProductionCost() { }
}
```

### BankAccount Model
```php
class BankAccount extends Model {
    public function company() { }
    public function account() { }
    public function statements() { }
    public function reconciliations() { }
    public function getCurrentBalance() { }
    public function getLastReconciliation() { }
}
```

### FieldServiceRequest Model
```php
class FieldServiceRequest extends Model {
    public function company() { }
    public function customer() { }
    public function assignedTechnician() { }
    public function details() { }
    public function report() { }
}
```

---

## 🔌 API Endpoints

### Manufacturing APIs

#### Work Centers
```
GET    /api/work-centers
POST   /api/work-centers
PUT    /api/work-centers/{id}
DELETE /api/work-centers/{id}
```

#### BOM Management
```
GET    /api/bom/product/{productId}
POST   /api/bom-items
PUT    /api/bom-items/{id}
DELETE /api/bom-items/{id}
GET    /api/bom-items/{id}/tree
GET    /api/bom-items/{id}/children
POST   /api/bom-items/{id}/validate-stock
```

#### Routing
```
GET    /api/routing/product/{productId}
POST   /api/routing
PUT    /api/routing/{id}
DELETE /api/routing/{id}
GET    /api/routing/{id}/cost-estimate
```

### Accounting APIs

#### Bank Accounts
```
GET    /api/bank-accounts
POST   /api/bank-accounts
PUT    /api/bank-accounts/{id}
DELETE /api/bank-accounts/{id}
GET    /api/bank-accounts/{id}
```

#### Bank Statements
```
POST   /api/bank-statements/upload
GET    /api/bank-statements/{bankAccountId}
GET    /api/bank-statements/{id}/details
PUT    /api/bank-statements/{id}
```

#### Transaction Matching
```
POST   /api/bank-statements/{detailId}/match
POST   /api/bank-statements/{detailId}/unmatch
GET    /api/bank-statements/{statementId}/unmatched
POST   /api/bank-statements/{statementId}/auto-match
```

#### Reconciliation
```
POST   /api/reconciliations/start/{statementId}
POST   /api/reconciliations/complete/{statementId}
POST   /api/reconciliations/{id}/post
GET    /api/reconciliations/{bankAccountId}
GET    /api/reconciliations/{id}
```

### Field Service APIs

#### Service Requests
```
GET    /api/field-service-requests
POST   /api/field-service-requests
GET    /api/field-service-requests/{id}
PUT    /api/field-service-requests/{id}
DELETE /api/field-service-requests/{id}
```

#### Technician Management
```
POST   /api/field-service-requests/{id}/assign-technician
POST   /api/field-service-requests/{id}/reassign-technician
GET    /api/field-service-requests/{id}/available-technicians
GET    /api/field-technicians
POST   /api/field-technicians
GET    /api/field-technicians/{id}
PUT    /api/field-technicians/{id}
GET    /api/field-technicians/{id}/location
```

#### Service Execution
```
POST   /api/field-service-requests/{id}/start
POST   /api/field-service-requests/{id}/complete
POST   /api/field-service-requests/{id}/reschedule
POST   /api/field-service-requests/{id}/rate
```

---

## 💻 Usage Examples

### Example 1: Create BOM with Multiple Levels
```php
// Create parent BOM
$parentBom = BomItem::create([
    'product_id' => 1,
    'qty' => 1,
    'unit_cost' => 100,
    'level' => 1,
    'is_active' => true,
]);

// Add child items
BomItem::create([
    'product_id' => 2,
    'parent_bom_id' => $parentBom->id,
    'qty' => 5,
    'unit_cost' => 10,
    'level' => 2,
]);

// Get total cost
$totalCost = $parentBom->getTotalCostWithChildren(); // 150

// Check stock availability
if ($parentBom->isAvailableInStock()) {
    // Start production
}
```

### Example 2: Bank Reconciliation
```php
// Create bank statement
$statement = BankStatement::create([
    'bank_account_id' => 1,
    'statement_date' => now(),
    'opening_balance' => 5000,
    'closing_balance' => 8500,
]);

// Add transactions
$statement->details()->create([
    'transaction_date' => now(),
    'description' => 'Invoice IVC-001',
    'credit' => 3500,
    'balance' => 8500,
]);

// Auto-match transactions
foreach ($statement->details as $detail) {
    $payment = PaymentTransaction::findBySimilar($detail);
    if ($payment) {
        $detail->matchWithTransaction($payment->id, $detail->getAmount());
    }
}

// Create reconciliation
$reconciliation = BankReconciliation::create([
    'bank_statement_id' => $statement->id,
    'reconciliation_date' => now(),
    'statement_balance' => 8500,
    'calculated_balance' => $statement->getCalculatedBalance(),
]);

// Post reconciliation
if ($reconciliation->canBePosted()) {
    $reconciliation->post(auth()->user());
}
```

### Example 3: Field Service Request
```php
// Create service request
$request = FieldServiceRequest::create([
    'customer_id' => 1,
    'reference' => 'FS-20260423-1234',
    'description' => 'AC repair needed',
    'location' => Point(30.0444, 31.2357), // Cairo
    'scheduled_date' => now()->addDays(2),
    'estimated_duration' => 120,
    'priority' => 'high',
    'status' => 'new',
]);

// Add service items
$request->details()->create([
    'item_type' => 'service',
    'item_id' => 5,
    'quantity' => 1,
    'unit_price' => 200,
    'total_price' => 200,
]);

// Assign technician
$request->update([
    'assigned_technician_id' => 3,
    'status' => 'assigned',
]);

// Start service
$request->update(['actual_start' => now()]);

// Complete service
$report = FieldServiceReport::create([
    'field_service_request_id' => $request->id,
    'technician_id' => 3,
    'summary' => 'AC compressor replaced',
    'work_done' => 'Removed old compressor and installed new one',
    'customer_signature' => base64_signature,
    'total_amount' => 500,
    'signed_at' => now(),
]);

// Rate technician
FieldTechnicianRating::create([
    'field_service_request_id' => $request->id,
    'technician_id' => 3,
    'customer_id' => 1,
    'rating' => 5,
    'comment' => 'Excellent work!',
]);
```

---

## 🚀 Installation Guide

### Step 1: Copy Files
```bash
# Copy migrations
cp database/migrations/2026_04_23_*.php /your-erp/database/migrations/

# Copy models
cp app/Models/BomItem.php /your-erp/app/Models/
cp app/Models/WorkCenter.php /your-erp/app/Models/
cp app/Models/WorkCenterRouting.php /your-erp/app/Models/
cp app/Models/BankAccount.php /your-erp/app/Models/
cp app/Models/BankReconciliation.php /your-erp/app/Models/

# Copy controllers
cp app/Http/Controllers/API/EnhancedModulesController.php /your-erp/app/Http/Controllers/API/

# Copy routes
cat routes/api-enhancements.php >> /your-erp/routes/api.php
```

### Step 2: Run Migrations
```bash
php artisan migrate
```

### Step 3: Register in Service Provider
```php
// Add to AppServiceProvider.php
public function boot()
{
    WorkCenter::observe(ActivityObserver::class);
    BankStatement::observe(ActivityObserver::class);
    FieldServiceRequest::observe(ActivityObserver::class);
}
```

### Step 4: Create Frontend Pages (React)
Frontend pages should be created for:
- `/manufacturing/bom`
- `/manufacturing/work-centers`
- `/accounting/bank-reconciliation`
- `/field-service/requests`
- `/field-service/technicians`

---

## ✅ Validation & Error Handling

All controllers include comprehensive validation:

```php
$data = $request->validate([
    'field' => 'required|type|constraints',
    // ...
]);
```

Error responses follow standard format:
```json
{
    "success": false,
    "message": "Error message",
    "errors": { /* validation errors */ }
}
```

---

## 📈 Performance Considerations

✅ All queries use Eager Loading
✅ Database indexes on foreign keys
✅ Caching for frequently accessed data
✅ Pagination for large datasets
✅ Query optimization with select()

---

## 🔒 Security

✅ All endpoints protected with `auth:sanctum`
✅ Company scope middleware ensures data isolation
✅ Permission checks on sensitive operations
✅ Audit logging for critical actions
✅ Input validation on all endpoints

---

**Version:** 1.0.0
**Last Updated:** 2026-04-23
**Status:** Production Ready
