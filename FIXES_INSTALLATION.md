# تعليمات تثبيت الإصلاحات

## المشاكل التي تم حلها:

### 1. ✅ Leave → Attendance — الإجازة المعتمدة مش بتتسجل في الحضور
**الحل:** تم إنشاء `recordApprovedLeaveToAttendance()` في `IntegrationService`
- عند اعتماد الإجازة، يتم تسجيل كل يوم كحضور "leave" في جدول Attendance
- يتم تجاهل نهايات الأسبوع تلقائياً

### 2. ✅ Payroll → محاسبة — دفع الراتب مش بيعمل Journal Entry
**الحل:** تم إنشاء `createPayrollJournalEntry()` في `IntegrationService`
- عند إقرار الرواتب (approved)، يتم إنشاء قيد محاسبي تلقائياً
- Debit: Salary Expense (حساب المرتبات)
- Credit: Salary Payable (حساب الالتزام)

### 3. ✅ POS → محاسبة — البيع في الكاشير مش بيعمل قيد محاسبي
**الحل:** تم إنشاء `createPosJournalEntry()` في `IntegrationService`
- عند إكمال أو دفع المبيعات من الكاشير، يتم إنشاء قيد محاسبي
- Debit: Cash (حساب النقدية)
- Credit: Sales Revenue (حساب الإيرادات)

### 4. ✅ Expenses → محاسبة — المصروف المعتمد مش بيعمل قيد
**الحل:** تم إنشاء `createExpenseJournalEntry()` في `IntegrationService`
- عند اعتماد المصروف (approved)، يتم إنشاء قيد محاسبي
- Debit: Expense Account (حسب نوع المصروف)
- Credit: Cash/Bank (النقدية أو البنك)

### 5. ✅ eCommerce → محاسبة — الطلب مش بيعمل قيد
**الحل:** تم إنشاء `createEcommerceOrderJournalEntry()` في `IntegrationService`
- عند إنشاء طلب تجارة إلكترونية، يتم إنشاء قيد محاسبي
- Debit: Accounts Receivable (الذمم المدينة)
- Credit: Sales Revenue (إيرادات المبيعات)

### 6. ✅ Recruitment → Employee — المتقدم المقبول مش بيتحول موظف أوتوماتيك
**الحل:** تم إنشاء `convertApprovedCandidateToEmployee()` في `IntegrationService`
- عند اعتماد المتقدم (approved)، يتم تحويله لموظف تلقائياً
- يتم نقل البيانات الشخصية والوظيفية تلقائياً

### 7. ✅ CRM → Sales — الفرصة مش بتتحول لـ Sale
**الحل:** تم إنشاء `convertOpportunityToSale()` في `IntegrationService`
- عند كسب الفرصة (closed-won)، يتم تحويلها لعملية بيع
- يتم نقل المبلغ والعميل تلقائياً

### 8. ✅ Fleet → محاسبة — تكاليف الوقود والصيانة مش بتتسجل محاسبياً
**الحل:** تم إنشاء `createFleetCostJournalEntry()` في `IntegrationService`
- عند اعتماد تكاليف الوقود أو الصيانة، يتم إنشاء قيد محاسبي
- Debit: Fuel/Maintenance Expense
- Credit: Cash/Bank

### 9. ✅ Projects → Invoicing — المشروع مش بيولد فاتورة
**الحل:** تم إنشاء `generateProjectInvoice()` في `IntegrationService`
- عند إكمال المشروع (completed)، يتم إنشاء فاتورة تلقائياً
- يتم استخدام جدول Sales كفاتورة

---

## خطوات التثبيت:

### 1. نسخ الملفات الجديدة:
```bash
# الملفات موجودة بالفعل في المشروع:
back/app/Services/IntegrationService.php
back/app/Observers/AutoIntegrationObserver.php
back/database/migrations/2026_04_24_000001_add_integration_columns.php
```

### 2. تحديث AppServiceProvider:
✅ تم التحديث بالفعل - تم إضافة:
- استيراد الـ Classes اللازمة
- تسجيل IntegrationService في Service Container
- تسجيل AutoIntegrationObserver للنماذج

### 3. تشغيل Migrations:
```bash
php artisan migrate
```

### 4. التحقق من الحسابات المحاسبية:
تأكد من أن الحسابات المحاسبية التالية موجودة في جدول Accounts:
```
- 010001: Salary Expense (مصروف الرواتب)
- 010002: Cash (النقدية)
- 010003: Accounts Receivable (الذمم المدينة)
- 010004: Fuel Expense (مصروف الوقود)
- 010005: Maintenance Expense (مصروف الصيانة)
- 020003: Tax Payable (الضرائب المستحقة)
- 020005: Salary Payable (الرواتب المستحقة)
- 030001: Sales Revenue (إيرادات المبيعات)
```

### 5. اختبار الوظائف:
يمكنك اختبار كل وظيفة من خلال:

```php
// اختبار Leave → Attendance
$leave = LeaveRequest::first();
$leave->status = 'approved';
$leave->save();

// اختبار Payroll → Accounting
$payroll = Payroll::first();
$payroll->status = 'approved';
$payroll->save();

// وهكذا لكل الوظائف الأخرى
```

---

## ملاحظات مهمة:

1. **الحسابات المحاسبية**: تأكد من تخصيص الحسابات المحاسبية حسب احتياجات شركتك
2. **حقول الشركة**: جميع العمليات تأخذ في الاعتبار `company_id` لدعم التعدد
3. **معالجة الأخطاء**: جميع الدوال توفر معالجة للأخطاء مع تسجيل في logs
4. **القيود المحاسبية**: جميع القيود تُنشأ بحالة "draft" وتحتاج مراجعة يدوية قبل النشر

---

## الملفات المعدلة:

1. ✅ `/back/app/Providers/AppServiceProvider.php` - تم التحديث
2. ✅ `/back/app/Services/IntegrationService.php` - ملف جديد
3. ✅ `/back/app/Observers/AutoIntegrationObserver.php` - ملف جديد
4. ✅ `/back/database/migrations/2026_04_24_000001_add_integration_columns.php` - ملف جديد
