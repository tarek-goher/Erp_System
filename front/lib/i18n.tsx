'use client'

// ══════════════════════════════════════════════════════════
// lib/i18n.tsx — نظام الترجمة العربي/الإنجليزي
// ══════════════════════════════════════════════════════════
// كيف تستخدمه:
//   const { t, lang, toggleLang, dir } = useI18n()
//   <p>{t('dashboard')}</p>   → 'لوحة التحكم' أو 'Dashboard'
//   <div dir={dir}>...</div>  → يحدد اتجاه النص
// ══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ─── نوع اللغة ──────────────────────────────────────────
export type Lang = 'ar' | 'en'

// ─── نوع الـ Context ──────────────────────────────────────
type I18nContextType = {
  lang: Lang                          // اللغة الحالية
  dir: 'rtl' | 'ltr'                 // اتجاه النص
  t: (key: string) => string         // دالة الترجمة
  toggleLang: () => void             // تبديل اللغة
}

// ══════════════════════════════════════════════════════════
// قاموس الترجمات — أضف هنا أي كلمة جديدة
// ══════════════════════════════════════════════════════════
const translations: Record<string, Record<Lang, string>> = {
  // ─── قائمة التنقل ────────────────────────────────────
  dashboard:          { ar: 'لوحة التحكم',        en: 'Dashboard' },
  sales:              { ar: 'المبيعات',            en: 'Sales' },
  returns:            { ar: 'المرتجعات',            en: 'Returns' },
  purchases:          { ar: 'المشتريات',           en: 'Purchases' },
  inventory:          { ar: 'المخزون',             en: 'Inventory' },
  accounting:         { ar: 'المحاسبة',            en: 'Accounting' },
  general_ledger:     { ar: 'دفتر الأستاذ',       en: 'General Ledger' },
  hr:                 { ar: 'الموارد البشرية',     en: 'HR' },
  branches:           { ar: 'الفروع',               en: 'Branches' },
  crm:                { ar: 'إدارة العملاء',       en: 'CRM' },
  projects:           { ar: 'المشاريع',            en: 'Projects' },
  helpdesk:           { ar: 'الدعم الفني',         en: 'Helpdesk' },
  manufacturing:      { ar: 'التصنيع',             en: 'Manufacturing' },
  fleet:              { ar: 'إدارة الأسطول',       en: 'Fleet' },
  marketing:          { ar: 'التسويق',             en: 'Marketing' },
  pos:                { ar: 'نقطة البيع',          en: 'Point of Sale' },
  reports:            { ar: 'التقارير',            en: 'Reports' },
  settings:           { ar: 'الإعدادات',           en: 'Settings' },
  users:              { ar: 'المستخدمون',          en: 'Users' },
  contacts:           { ar: 'جهات الاتصال',        en: 'Contacts' },
  notifications:      { ar: 'الإشعارات',           en: 'Notifications' },

  // ─── صفحات جديدة ────────────────────────────────────
  recruitment:        { ar: 'التوظيف',             en: 'Recruitment' },
  fixed_assets:       { ar: 'الأصول الثابتة',      en: 'Fixed Assets' },
  appraisals:         { ar: 'تقييم الأداء',         en: 'Appraisals' },
  taxes:              { ar: 'الضرائب',               en: 'Taxes' },
  loyalty:            { ar: 'برنامج الولاء',         en: 'Loyalty' },
  email_inbox:        { ar: 'صندوق الوارد',        en: 'Email Inbox' },
  budgets:            { ar: 'الميزانيات',           en: 'Budgets' },
  audit_log:          { ar: 'سجل المراجعة',        en: 'Audit Log' },
  ai_assistant:       { ar: 'المساعد الذكي',        en: 'AI Assistant' },
  // ── New pages added in latest update ──────────────────
  quotations:         { ar: 'عروض الأسعار',         en: 'Quotations' },
  suppliers:          { ar: 'الموردون',              en: 'Suppliers' },
  warehouses:         { ar: 'المخازن',               en: 'Warehouses' },
  payroll:            { ar: 'الرواتب',               en: 'Payroll' },
  security:           { ar: 'الأمان',                en: 'Security' },
  live_chat:          { ar: 'الدردشة المباشرة',      en: 'Live Chat' },
  knowledge_base:     { ar: 'قاعدة المعرفة',         en: 'Knowledge Base' },
  csat:               { ar: 'رضا العملاء',           en: 'CSAT' },
  bi_analytics:       { ar: 'تحليلات الأعمال',       en: 'BI Analytics' },
  customer_portal:    { ar: 'بوابة العملاء',         en: 'Customer Portal' },
  social_media:       { ar: 'التواصل الاجتماعي',     en: 'Social Media' },
  general_ledger:     { ar: 'دفتر الأستاذ',          en: 'General Ledger' },
  journal_entries:    { ar: 'قيود اليومية',          en: 'Journal Entries' },
  bank_reconciliation:{ ar: 'تسوية بنكية',          en: 'Bank Reconciliation' },
  currencies:         { ar: 'العملات',              en: 'Currencies' },
  attendance:         { ar: 'الحضور والانصراف',      en: 'Attendance' },
  leave_requests:     { ar: 'طلبات الإجازة',         en: 'Leave Requests' },
  org_chart:          { ar: 'الهيكل التنظيمي',       en: 'Org Chart' },
  holidays:           { ar: 'العطلات الرسمية',        en: 'Holidays' },
  notifications_pref: { ar: 'تفضيلات الإشعارات',      en: 'Notification Preferences' },
  backup:             { ar: 'النسخ الاحتياطي',         en: 'Backup' },
  timesheets:         { ar: 'كشف الوقت',               en: 'Timesheets' },
  stock_movements:    { ar: 'حركات المخزون',            en: 'Stock Movements' },
  purchases_invoices: { ar: 'فواتير المشتريات',         en: 'Purchase Invoices' },
  service_desk:       { ar: 'مكتب الخدمة',              en: 'Service Desk' },
  helpdesk_analytics: { ar: 'تحليلات الدعم',            en: 'Helpdesk Analytics' },
  escalation_rules:   { ar: 'قواعد التصعيد',            en: 'Escalation Rules' },
  sla_policies:       { ar: 'سياسات SLA',               en: 'SLA Policies' },
  workflows:          { ar: 'سير العمل',                en: 'Workflows' },
  tags:               { ar: 'الوسوم',                   en: 'Tags' },
  service_catalog:    { ar: 'كتالوج الخدمات',           en: 'Service Catalog' },
  contacts:           { ar: 'جهات الاتصال',             en: 'Contacts' },
  mail_config:        { ar: 'إعداد البريد',             en: 'Mail Config' },
  auto_assignment:    { ar: 'التعيين التلقائي',         en: 'Auto Assignment' },
  check_in:           { ar: 'تسجيل حضور',              en: 'Check In' },
  check_out:          { ar: 'تسجيل انصراف',            en: 'Check Out' },
  clock_in:           { ar: 'وقت الحضور',               en: 'Clock In' },
  clock_out:          { ar: 'وقت الانصراف',             en: 'Clock Out' },
  total_hours:        { ar: 'إجمالي الساعات',           en: 'Total Hours' },
  public_holiday:     { ar: 'عطلة رسمية',               en: 'Public Holiday' },
  leave_type:         { ar: 'نوع الإجازة',              en: 'Leave Type' },
  approve:            { ar: 'موافقة',                   en: 'Approve' },
  reject:             { ar: 'رفض',                     en: 'Reject' },
  approved:           { ar: 'موافق عليه',               en: 'Approved' },
  rejected:           { ar: 'مرفوض',                   en: 'Rejected' },
  pending:            { ar: 'معلق',                    en: 'Pending' },
  // ── eCommerce, PLM, Sign, Expenses, Lunch, Subscriptions ──
  ecommerce:          { ar: 'التجارة الإلكترونية',    en: 'eCommerce' },
  plm:                { ar: 'إدارة دورة المنتج',      en: 'PLM' },
  sign:               { ar: 'التوقيع الإلكتروني',     en: 'Sign' },
  expenses:           { ar: 'مصروفات الموظفين',       en: 'Expenses' },
  lunch:              { ar: 'وجبات الغداء',            en: 'Lunch' },
  subscriptions:      { ar: 'الاشتراكات',             en: 'Subscriptions' },
  // ── Manufacturing sub-pages ──
  bom:                { ar: 'قوائم المواد',            en: 'Bill of Materials' },
  work_centers:       { ar: 'مراكز العمل',             en: 'Work Centers' },
  routing:            { ar: 'مسارات التصنيع',          en: 'Routing' },
  // ── Field Service ──
  field_service:      { ar: 'الخدمة الميدانية',       en: 'Field Service' },
  field_service_requests: { ar: 'طلبات الخدمة الميدانية', en: 'Field Service Requests' },

  // ─── أفعال عامة ─────────────────────────────────────
  add:                { ar: 'إضافة',               en: 'Add' },
  edit:               { ar: 'تعديل',               en: 'Edit' },
  delete:             { ar: 'حذف',                 en: 'Delete' },
  save:               { ar: 'حفظ',                 en: 'Save' },
  cancel:             { ar: 'إلغاء',               en: 'Cancel' },
  search:             { ar: 'بحث',                 en: 'Search' },
  filter:             { ar: 'تصفية',               en: 'Filter' },
  export:             { ar: 'تصدير',               en: 'Export' },
  import:             { ar: 'استيراد',             en: 'Import' },
  print:              { ar: 'طباعة',               en: 'Print' },
  confirm:            { ar: 'تأكيد',               en: 'Confirm' },
  close:              { ar: 'إغلاق',               en: 'Close' },
  back:               { ar: 'رجوع',                en: 'Back' },
  next:               { ar: 'التالي',              en: 'Next' },
  loading:            { ar: 'جاري التحميل...',     en: 'Loading...' },
  logout:             { ar: 'تسجيل الخروج',        en: 'Logout' },
  login:              { ar: 'تسجيل الدخول',        en: 'Login' },
  view:               { ar: 'عرض',                 en: 'View' },
  details:            { ar: 'التفاصيل',            en: 'Details' },
  actions:            { ar: 'الإجراءات',           en: 'Actions' },
  refresh:            { ar: 'تحديث',               en: 'Refresh' },
  send:               { ar: 'إرسال',               en: 'Send' },
  analyze:            { ar: 'تحليل',               en: 'Analyze' },
  compare:            { ar: 'مقارنة',               en: 'Compare' },
  reset:              { ar: 'إعادة تعيين',         en: 'Reset' },

  // ─── حالات ──────────────────────────────────────────
  status:             { ar: 'الحالة',              en: 'Status' },
  active:             { ar: 'نشط',                 en: 'Active' },
  inactive:           { ar: 'غير نشط',             en: 'Inactive' },
  pending:            { ar: 'معلق',                en: 'Pending' },
  rejected:           { ar: 'مرفوض',               en: 'Rejected' },
  draft:              { ar: 'مسودة',               en: 'Draft' },
  paid:               { ar: 'مدفوع',               en: 'Paid' },
  unpaid:             { ar: 'غير مدفوع',           en: 'Unpaid' },
  open:               { ar: 'مفتوح',               en: 'Open' },
  closed:             { ar: 'مغلق',                en: 'Closed' },
  on_hold:            { ar: 'معلق',                en: 'On Hold' },
  disposed:           { ar: 'مُستبعَد',            en: 'Disposed' },

  // ─── حقول مشتركة ────────────────────────────────────
  name:               { ar: 'الاسم',               en: 'Name' },
  email:              { ar: 'البريد الإلكتروني',   en: 'Email' },
  phone:              { ar: 'الهاتف',              en: 'Phone' },
  address:            { ar: 'العنوان',             en: 'Address' },
  date:               { ar: 'التاريخ',             en: 'Date' },
  total:              { ar: 'الإجمالي',            en: 'Total' },
  amount:             { ar: 'المبلغ',              en: 'Amount' },
  quantity:           { ar: 'الكمية',              en: 'Quantity' },
  price:              { ar: 'السعر',               en: 'Price' },
  description:        { ar: 'الوصف',               en: 'Description' },
  notes:              { ar: 'ملاحظات',             en: 'Notes' },
  type:               { ar: 'النوع',               en: 'Type' },
  category:           { ar: 'الفئة',               en: 'Category' },
  code:               { ar: 'الكود',               en: 'Code' },
  number:             { ar: 'الرقم',               en: 'Number' },
  customer:           { ar: 'العميل',              en: 'Customer' },
  supplier:           { ar: 'المورد',              en: 'Supplier' },
  employee:           { ar: 'الموظف',              en: 'Employee' },
  product:            { ar: 'المنتج',              en: 'Product' },
  warehouse:          { ar: 'المخزن',              en: 'Warehouse' },
  department:         { ar: 'القسم',               en: 'Department' },
  period:             { ar: 'الفترة',              en: 'Period' },
  account:            { ar: 'الحساب',              en: 'Account' },

  // ─── رسائل ──────────────────────────────────────────
  no_data:            { ar: 'لا توجد بيانات',      en: 'No data found' },
  error_occurred:     { ar: 'حدث خطأ',             en: 'An error occurred' },
  saved_success:      { ar: 'تم الحفظ بنجاح',      en: 'Saved successfully' },
  deleted_success:    { ar: 'تم الحذف بنجاح',      en: 'Deleted successfully' },
  confirm_delete:     { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
  required_field:     { ar: 'هذا الحقل مطلوب',     en: 'This field is required' },

  // ─── لوحة التحكم ────────────────────────────────────
  total_sales:        { ar: 'إجمالي المبيعات',     en: 'Total Sales' },
  total_purchases:    { ar: 'إجمالي المشتريات',    en: 'Total Purchases' },
  total_customers:    { ar: 'إجمالي العملاء',      en: 'Total Customers' },
  total_products:     { ar: 'إجمالي المنتجات',     en: 'Total Products' },
  recent_sales:       { ar: 'أحدث المبيعات',       en: 'Recent Sales' },
  welcome:            { ar: 'مرحباً',              en: 'Welcome' },
}

// ─── إنشاء الـ Context ───────────────────────────────────
const I18nContext = createContext<I18nContextType | null>(null)

// ══════════════════════════════════════════════════════════
// I18nProvider — ضعه في app/layout.tsx
// ══════════════════════════════════════════════════════════
export function I18nProvider({ children }: { children: ReactNode }) {
  // اللغة الافتراضية من localStorage (أو العربية)
  const [lang, setLang] = useState<Lang>('ar')

  // اقرأ اللغة المحفوظة عند فتح التطبيق
  useEffect(() => {
    const saved = localStorage.getItem('erp_lang') as Lang | null
    if (saved === 'ar' || saved === 'en') setLang(saved)
  }, [])

  // حدّث اتجاه الصفحة عند تغيير اللغة
  useEffect(() => {
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  // دالة تبديل اللغة
  const toggleLang = () => {
    const newLang: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(newLang)
    localStorage.setItem('erp_lang', newLang)
  }

  // دالة الترجمة — لو مش موجودة ارجع الـ key نفسه
  const t = (key: string): string => {
    return translations[key]?.[lang] ?? key
  }

  return (
    <I18nContext.Provider value={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  )
}

// ══════════════════════════════════════════════════════════
// useI18n — الـ hook اللي بتستخدمه في أي component
// ══════════════════════════════════════════════════════════
export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n يجب أن يُستخدم داخل I18nProvider')
  return ctx
}
