# ERP SaaS — Laravel Backend

## المتطلبات
- PHP >= 8.2
- MySQL >= 8.0
- Composer

## التثبيت

```bash
# 1. نسخ المتغيرات
cp .env.example .env

# 2. تعديل .env (DB_DATABASE, DB_USERNAME, DB_PASSWORD, FRONTEND_URL)

# 3. تثبيت الحزم
composer install

# 4. مفتاح التطبيق
php artisan key:generate

# 5. قاعدة البيانات
php artisan migrate

# 6. البيانات الأساسية (أدوار + شركة تجريبية + COA + Stages)
php artisan db:seed

# 7. تشغيل الـ Storage
php artisan storage:link

# 8. تشغيل السيرفر
php artisan serve
```

## بيانات الدخول التجريبية

| الدور | الإيميل | الباسورد |
|-------|---------|---------|
| Super Admin | superadmin@codesphere.io | password123 |
| مدير الشركة | admin@codesphere.io | password123 |
| محاسب | fatma@codesphere.io | password123 |
| مدير مخازن | mohamad@codesphere.io | password123 |
| كاشير | sara@codesphere.io | password123 |
| مندوب مبيعات | khaled@codesphere.io | password123 |

## الـ API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/register`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Users (داخل الشركة)
- `GET    /api/users`
- `POST   /api/users`
- `GET    /api/users/{id}`
- `PATCH  /api/users/{id}`
- `DELETE /api/users/{id}`
- `PATCH  /api/users/{id}/password`
- `GET    /api/users/roles`

### Company Settings
- `GET   /api/company/settings`
- `PATCH /api/company/settings`
- `POST  /api/company/logo`

### Products & Categories
- `GET/POST/PATCH/DELETE /api/products`
- `POST /api/products/{id}/adjust-stock`
- `POST /api/products/import`
- `GET/POST/PATCH/DELETE /api/categories`

### Warehouses
- `GET/POST/PATCH/DELETE /api/warehouses`
- `POST /api/warehouses/transfer`

### Sales & Quotations
- `GET/POST/PATCH/DELETE /api/sales`
- `PATCH /api/sales/{id}/status`
- `GET   /api/sales/{id}/pdf`
- `GET/POST /api/quotations`
- `GET   /api/quotations/{id}`
- `POST  /api/quotations/{id}/confirm` → تحويل لفاتورة
- `DELETE /api/quotations/{id}`

### Purchases
- `GET/POST/PATCH/DELETE /api/purchases`
- `POST /api/purchases/{id}/receive`

### Accounting
- `GET/POST/PATCH/DELETE /api/accounts`
- `GET/POST/PATCH/DELETE /api/journal-entries`
- `POST /api/journal-entries/{id}/post`
- `GET/POST/DELETE /api/bank-statements`
- `PATCH /api/bank-statements/{id}/reconcile`
- `GET/POST/PATCH/DELETE /api/fixed-assets`
- `POST /api/fixed-assets/{id}/depreciate`
- `GET/POST /api/budgets`
- `POST /api/budgets/sync-actuals`

### Reports
- `GET /api/reports/income-statement?from_date=&to_date=`
- `GET /api/reports/balance-sheet`
- `GET /api/reports/trial-balance`
- `GET /api/reports/inventory`
- `GET /api/reports/sales`
- `GET /api/reports/purchases`
- `GET /api/reports/{type}/export`

### HR
- `GET/POST/PATCH/DELETE /api/employees`
- `GET/POST/PATCH/DELETE /api/attendance`
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET/POST/PATCH/DELETE /api/payroll`
- `POST /api/payroll/generate`
- `POST /api/payroll/{id}/approve`
- `GET/POST/DELETE /api/leave-requests`
- `PATCH /api/leave-requests/{id}/approve`
- `PATCH /api/leave-requests/{id}/reject`
- `GET/POST /api/recruitment/positions`
- `PATCH /api/recruitment/positions/{id}`
- `GET/POST /api/recruitment/positions/{id}/candidates`
- `PATCH /api/recruitment/candidates/{id}`

### POS
- `GET  /api/pos/shifts`
- `GET  /api/pos/shifts/active`
- `POST /api/pos/shifts/open`
- `POST /api/pos/shifts/{id}/close`
- `GET  /api/pos/shifts/{id}`
- `POST /api/pos/sale`

### CRM
- `GET/POST/PATCH/DELETE /api/crm/stages`
- `GET/POST/PATCH/DELETE /api/crm/leads`
- `PATCH /api/crm/leads/{id}/move`
- `POST  /api/crm/leads/{id}/convert`
- `POST  /api/crm/leads/{id}/activities`
- `PATCH /api/crm/activities/{id}`

### Projects
- `GET/POST/PATCH/DELETE /api/projects`
- `GET/POST /api/projects/{id}/tasks`
- `PATCH /api/project-tasks/{id}`
- `GET/POST /api/projects/{id}/timesheets`
- `POST /api/timesheets`

### Helpdesk
- `GET/POST /api/helpdesk/tickets`
- `GET /api/helpdesk/tickets/{id}`
- `POST /api/helpdesk/tickets/{id}/messages`
- `PATCH /api/helpdesk/tickets/{id}/close`
- `GET /api/helpdesk/articles`
- `GET /api/helpdesk/articles/{id}`

### Notifications
- `GET    /api/notifications`
- `PATCH  /api/notifications/{id}/read`
- `POST   /api/notifications/read-all`
- `DELETE /api/notifications/{id}`

### Super Admin
- `GET  /api/super-admin/stats`
- `GET/POST/PATCH/DELETE /api/super-admin/companies`
- `GET/POST/PATCH /api/super-admin/subscriptions`
- `GET/POST/PATCH /api/super-admin/tickets`
- `GET/POST /api/super-admin/users`
