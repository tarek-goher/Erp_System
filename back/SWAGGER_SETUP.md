# 📖 API Documentation Setup (Swagger)

## خطوات التشغيل

### 1. تثبيت الـ package
```bash
composer require darkaonline/l5-swagger
```

### 2. نشر الـ config
```bash
php artisan vendor:publish --provider "L5Swagger\L5SwaggerServiceProvider"
```

### 3. توليد الـ documentation
```bash
php artisan l5-swagger:generate
```

### 4. فتح الـ Swagger UI
```
http://localhost:8000/api/documentation
```

---

## الـ Endpoints الموثّقة

| Module | Endpoints |
|--------|-----------|
| 🔐 Auth | Login, Register, Logout, Me, Forgot Password |
| 🛒 Sales | CRUD + Status Update + PDF Export |
| 📦 Products | CRUD + Stock Adjustment + Import |
| 👥 Customers | CRUD |
| 👷 HR/Employees | CRUD |
| 📊 Reports | Income Statement, Balance Sheet, Top Products, Stock Valuation |

---

## إضافة Swagger لـ Controller جديد

```php
/**
 * @OA\Get(
 *     path="/api/your-endpoint",
 *     tags={"YourTag"},
 *     summary="وصف قصير",
 *     security={{"bearerAuth":{}}},
 *     @OA\Response(response=200, description="نجح"),
 *     @OA\Response(response=401, description="غير مصرح")
 * )
 */
public function index(): JsonResponse { ... }
```

---

## الـ Tags الموجودة
- Auth, Sales, Products, Customers, Suppliers, Purchases
- HR, Accounting, Reports, CRM, Projects, Helpdesk
- Notifications, Settings, Super Admin
