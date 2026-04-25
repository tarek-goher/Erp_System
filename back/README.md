# CodeSphere ERP — Backend (Laravel 12)

## متطلبات التشغيل
- PHP 8.2+
- MySQL 8.0+
- Composer
- Node.js (للـ Vite)

---

## خطوات التشغيل

### 1. تثبيت الـ Dependencies
```bash
composer install
```

### 2. إعداد ملف البيئة
```bash
cp .env.example .env
php artisan key:generate
```

### 3. ضبط قاعدة البيانات في `.env`
```
DB_DATABASE=codesphere_erp
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 4. إنشاء قاعدة البيانات وتشغيل الـ Migrations
```bash
php artisan migrate --seed
```

### 5. إنشاء رابط الـ Storage
```bash
php artisan storage:link
```

### 6. تشغيل السيرفر
```bash
php artisan serve
```

---

## للـ Production

### تشغيل Queue Worker (ضروري)
```bash
# بشكل دائم مع Supervisor
php artisan queue:work --tries=3 --timeout=60
```

### تشغيل Scheduler في Crontab
```
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

### Packages إضافية مطلوبة للـ Production
كل الـ packages دي موجودة في composer.json وبتتثبت تلقائياً مع `composer install`:
- `barryvdh/laravel-dompdf` — تصدير PDF
- `phpoffice/phpspreadsheet` — تصدير Excel
- `pragmarx/google2fa-laravel` — مصادقة ثنائية TOTP
- `simplesoftwareio/simple-qrcode` — QR Code محلي
- `spatie/laravel-backup` — نسخ احتياطي

### إعدادات مهمة في `.env` للـ Production
```
APP_ENV=production
APP_DEBUG=false
FRONTEND_URL=https://your-domain.com
QUEUE_CONNECTION=redis
CACHE_STORE=redis
```

---

## بنية المشروع
```
app/
  Http/Controllers/API/    # 64 controller
  Models/                  # 50+ model
  Services/                # Business logic
  Middleware/              # Auth + Security
database/
  migrations/              # 58 migration
  seeders/                 # البيانات الأولية
routes/
  api.php                  # 222 route
```
