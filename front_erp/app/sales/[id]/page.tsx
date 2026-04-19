'use client'

// ══════════════════════════════════════════════════════════
// app/sales/[id]/page.tsx — صفحة تفاصيل الفاتورة (محسّنة)
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET    /api/sales/{id}                  → تفاصيل الفاتورة
//   PUT    /api/sales/{id}                  → تعديل الحالة / الملاحظات
//   GET    /api/sales/{id}/pdf              → تحميل PDF
//   GET    /api/sales/{id}/payments         → الدفعات
//   POST   /api/sales/{id}/payments         → إضافة دفعة
//   DELETE /api/sales/{id}/payments/{pid}   → حذف دفعة
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui'
import { useI18n } from '../../../lib/i18n'

// ─── أنواع البيانات ────────────────────────────────────
type SaleItem = {
  id:            number
  product_id?:   number
  product?:      { id: number; name: string; sku?: string; unit?: string }
  product_name?: string
  qty:           number
  price:         number
  discount?:     number
  total:         number
  tax_amount?:   number
  warehouse?:    { name: string }  // ← ضيفه هنا
}

type Payment = {
  id:             number
  amount:         number
  payment_method: string
  reference?:     string
  notes?:         string
  created_at:     string
}

type Sale = {
  id:              number
  invoice_number:  string
  reference?:      string
  customer?:       { id: number; name: string; email?: string; phone?: string }
  customer_name?:  string
  status:          string
  payment_method?: string
  subtotal?:       number
  tax?:            number
  discount?:       number
  total:           number
  notes?:          string
  due_date?:       string
  created_at:      string
  items?:          SaleItem[]
  tax_rate?:       { name: string; rate: number }
}

type PaymentsData = {
  payments:         Payment[]
  total_paid:       number
  remaining_amount: number
  is_fully_paid:    boolean
}

// ─── ثوابت ────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; color: string; ar: string; en: string }> = {
  draft:     { bg: '#f3f4f6', color: '#6b7280', ar: 'مسودة',         en: 'Draft' },
  pending:   { bg: '#fef3c7', color: '#d97706', ar: 'قيد المعالجة',  en: 'Pending' },
  confirmed: { bg: '#d1fae5', color: '#059669', ar: 'مؤكد',          en: 'Confirmed' },
  completed: { bg: '#dbeafe', color: '#2563eb', ar: 'مكتمل',         en: 'Completed' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', ar: 'ملغي',          en: 'Cancelled' },
  refunded:  { bg: '#ede9fe', color: '#7c3aed', ar: 'مسترد',         en: 'Refunded' },
}

const PAYMENT_LABELS: Record<string, { ar: string; en: string }> = {
  cash:          { ar: 'نقدي',        en: 'Cash' },
  card:          { ar: 'بطاقة بنكية', en: 'Card' },
  bank_transfer: { ar: 'تحويل بنكي',  en: 'Bank Transfer' },
  transfer:      { ar: 'تحويل بنكي',  en: 'Bank Transfer' },
  credit:        { ar: 'آجل',         en: 'Credit' },
}

export default function SaleDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { lang } = useI18n()
  const { show, toasts, remove } = useToast()

  // ─── البيانات ──────────────────────────────────────────
  const [sale,         setSale]         = useState<Sale | null>(null)
  const [paymentsData, setPaymentsData] = useState<PaymentsData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  // ─── حالة الأزرار ──────────────────────────────────────
  const [confirmLoading,  setConfirmLoading]  = useState(false)
  const [cancelLoading,   setCancelLoading]   = useState(false)
  const [refundLoading,   setRefundLoading]   = useState(false)
  const [pdfLoading,      setPdfLoading]      = useState(false)

  // ─── modal إضافة دفعة ──────────────────────────────────
  const [paymentModal,  setPaymentModal]  = useState(false)
  const [paymentForm,   setPaymentForm]   = useState({ amount: '', payment_method: 'cash', reference: '', notes: '' })
  const [paymentError,  setPaymentError]  = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  // ─── modal تأكيد حذف دفعة ─────────────────────────────
  const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null)

  // ══════════════════════════════════════════════════════
  // جلب البيانات
  // ══════════════════════════════════════════════════════
  const fetchSale = async () => {
    if (!id) return
    setLoading(true)
    const res = await api.get<Sale>(`/sales/${id}`)
    console.log('SALE DATA:', JSON.stringify(res.data, null, 2))
    if (res.error) { setError(res.error); setLoading(false); return }
    setSale(res.data as Sale)
    setLoading(false)
  }

  const fetchPayments = async () => {
    if (!id) return
    const res = await api.get<PaymentsData>(`/sales/${id}/payments`)
    if (res.data) setPaymentsData((res.data as any)?.data ?? res.data)
  }

  useEffect(() => {
    fetchSale()
    fetchPayments()
  }, [id])

  // ══════════════════════════════════════════════════════
  // تحميل PDF
  // ══════════════════════════════════════════════════════
  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      const token = localStorage.getItem('erp_token') || ''
      const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` , Accept: 'application/json',}
      })
      if (!res.ok) throw new Error('PDF failed')
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `invoice-${sale?.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      show(lang === 'ar' ? 'فشل تحميل PDF' : 'PDF download failed', 'error')
    }
    setPdfLoading(false)
  }

  // ══════════════════════════════════════════════════════
  // تغيير الحالة (Confirm / Cancel)
  // ══════════════════════════════════════════════════════
  const updateStatus = async (newStatus: string) => {
    const isConfirm = newStatus === 'confirmed'
    const isCancel  = newStatus === 'cancelled'
    const isRefund  = newStatus === 'refunded'

    if (isConfirm)  setConfirmLoading(true)
    if (isCancel)   setCancelLoading(true)
    if (isRefund)   setRefundLoading(true)

    const res = await api.put(`/sales/${id}`, { status: newStatus })

    setConfirmLoading(false)
    setCancelLoading(false)
    setRefundLoading(false)

    if (res.error) { show(res.error, 'error'); return }

    setSale(prev => prev ? { ...prev, status: newStatus } : prev)
    show(
      isConfirm ? (lang === 'ar' ? 'تم تأكيد الفاتورة ✅' : 'Invoice confirmed ✅') :
      isCancel  ? (lang === 'ar' ? 'تم إلغاء الفاتورة'   : 'Invoice cancelled') :
                  (lang === 'ar' ? 'تم استرداد الفاتورة' : 'Invoice refunded'),
      isCancel || isRefund ? 'error' : 'success'
    )
  }

  // ══════════════════════════════════════════════════════
  // إضافة دفعة
  // ══════════════════════════════════════════════════════
  const handleAddPayment = async () => {
    setPaymentError('')
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setPaymentError(lang === 'ar' ? 'أدخل مبلغ صحيح' : 'Enter a valid amount')
      return
    }
    setPaymentLoading(true)
    const res = await api.post(`/sales/${id}/payments`, {
      amount:         Number(paymentForm.amount),
      payment_method: paymentForm.payment_method,
      reference:      paymentForm.reference || undefined,
      notes:          paymentForm.notes     || undefined,
    })
    setPaymentLoading(false)
    if (res.error) { setPaymentError(res.error); return }

    show(lang === 'ar' ? 'تم تسجيل الدفعة ✅' : 'Payment recorded ✅')
    setPaymentModal(false)
    setPaymentForm({ amount: '', payment_method: 'cash', reference: '', notes: '' })
    fetchPayments()
    fetchSale() // لأن الحالة ممكن تتغير تلقائياً
  }

  // ══════════════════════════════════════════════════════
  // حذف دفعة
  // ══════════════════════════════════════════════════════
  const handleDeletePayment = async () => {
    if (!deletePaymentId) return
    const res = await api.delete(`/sales/${id}/payments/${deletePaymentId}`)
    setDeletePaymentId(null)
    if (res.error) { show(res.error, 'error'); return }
    show(lang === 'ar' ? 'تم حذف الدفعة' : 'Payment deleted')
    fetchPayments()
    fetchSale()
  }

  // ─── Helpers ─────────────────────────────────────────
  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n || 0)

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  const fmtDateShort = (d?: string) =>
    d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  const payLabel = (m?: string) => {
    if (!m) return '—'
    return PAYMENT_LABELS[m]?.[lang === 'ar' ? 'ar' : 'en'] || m
  }

  const INP: React.CSSProperties = {
    padding: '0.6rem 0.9rem',
    background: 'var(--bg-hover)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
  }

  // ══════════════════════════════════════════════════════
  // Loading / Error states
  // ══════════════════════════════════════════════════════
  if (loading) return (
    <ERPLayout pageTitle={lang === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
      </div>
    </ERPLayout>
  )

  if (error || !sale) return (
    <ERPLayout pageTitle={lang === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ color: 'var(--color-danger)', marginBottom: 8 }}>
          {error || (lang === 'ar' ? 'الفاتورة غير موجودة' : 'Invoice not found')}
        </h3>
        <button className="btn btn-secondary" onClick={() => router.push('/sales')} style={{ marginTop: '1rem' }}>
          ← {lang === 'ar' ? 'العودة للمبيعات' : 'Back to Sales'}
        </button>
      </div>
    </ERPLayout>
  )

  const st       = STATUS_COLORS[sale.status] ?? STATUS_COLORS['draft']
  const subtotal = sale.subtotal ?? (sale.items?.reduce((s, it) => s + it.total, 0) ?? sale.total)
  const taxAmt   = sale.tax     ?? 0
  const discount = sale.discount ?? 0
  const total    = sale.total   ?? subtotal - discount + taxAmt

  const isDraft     = sale.status === 'draft'
  const isPending   = sale.status === 'pending'
  const isCompleted = sale.status === 'completed'
  const isCancelled = sale.status === 'cancelled'
  const isRefunded  = sale.status === 'refunded'
  const canEdit     = isDraft || isPending
  const canConfirm  = isDraft || isPending
  const canRefund   = isCompleted
  const canCancel   = isDraft || isPending

  const totalPaid      = paymentsData?.total_paid      ?? 0
  const remainingAmt   = paymentsData?.remaining_amount ?? total
  const isFullyPaid    = paymentsData?.is_fully_paid   ?? false
  const payments       = paymentsData?.payments        ?? []

  // payment status
  const paymentStatus =
    totalPaid <= 0          ? { label_ar: 'غير مدفوع',      label_en: 'Unpaid',        color: 'var(--color-danger)' }  :
    isFullyPaid             ? { label_ar: 'مدفوع بالكامل',  label_en: 'Fully Paid',    color: 'var(--color-success)' } :
                              { label_ar: 'مدفوع جزئياً',   label_en: 'Partial',       color: 'var(--color-warning)' }

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* ── شريط العودة + الأزرار ──────────────────────── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/sales')}>
            {lang === 'ar' ? '← رجوع' : '← Back'}
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              🧾 {lang === 'ar' ? 'فاتورة' : 'Invoice'} #{sale.invoice_number || sale.id}
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>{fmtDate(sale.created_at)}</p>
          </div>
        </div>

        {/* ── أزرار الأكشن ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Badge الحالة */}
          <span style={{
            background: st.bg, color: st.color,
            padding: '6px 16px', borderRadius: 'var(--radius-full)',
            fontWeight: 700, fontSize: '0.85rem',
          }}>
            {lang === 'ar' ? st.ar : st.en}
          </span>

          {/* Confirm */}
          {canConfirm && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => updateStatus('completed')}
              disabled={confirmLoading}
            >
              {confirmLoading ? '⏳...' : `✅ ${lang === 'ar' ? 'تأكيد الفاتورة' : 'Confirm'}`}
            </button>
          )}

          {/* Cancel */}
          {canCancel && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { if (confirm(lang === 'ar' ? 'تأكيد الإلغاء؟' : 'Confirm cancel?')) updateStatus('cancelled') }}
              disabled={cancelLoading}
            >
              {cancelLoading ? '⏳...' : `🚫 ${lang === 'ar' ? 'إلغاء' : 'Cancel'}`}
            </button>
          )}

          {/* Refund */}
          {canRefund && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => { if (confirm(lang === 'ar' ? 'تأكيد الاسترداد؟' : 'Confirm refund?')) updateStatus('refunded') }}
              disabled={refundLoading}
            >
              {refundLoading ? '⏳...' : `↩️ ${lang === 'ar' ? 'استرداد' : 'Refund'}`}
            </button>
          )}

          {/* Print */}
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            🖨️ {lang === 'ar' ? 'طباعة' : 'Print'}
          </button>

          {/* PDF */}
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
            {pdfLoading ? '⏳...' : `📄 ${lang === 'ar' ? 'تحميل PDF' : 'Download PDF'}`}
          </button>
        </div>
      </div>

      {/* ── بطاقات العميل + الفاتورة ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* بيانات العميل */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            👤 {lang === 'ar' ? 'بيانات العميل' : 'Customer Info'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={INP}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'الاسم' : 'Name'}</div>
              <div style={{ fontWeight: 700 }}>{sale.customer?.name || sale.customer_name || '—'}</div>
            </div>
            {sale.customer?.email && (
              <div style={INP}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'البريد' : 'Email'}</div>
                <div style={{ direction: 'ltr' }}>{sale.customer.email}</div>
              </div>
            )}
            {sale.customer?.phone && (
              <div style={INP}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'الهاتف' : 'Phone'}</div>
                <div style={{ direction: 'ltr' }}>{sale.customer.phone}</div>
              </div>
            )}
          </div>
        </div>

        {/* بيانات الفاتورة */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            📋 {lang === 'ar' ? 'بيانات الفاتورة' : 'Invoice Info'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={INP}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</div>
              <div style={{ fontWeight: 700 }}>{sale.invoice_number || `#${sale.id}`}</div>
            </div>
            <div style={INP}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'تاريخ الإنشاء' : 'Date'}</div>
              <div>{fmtDate(sale.created_at)}</div>
            </div>
            {sale.due_date && (
              <div style={INP}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</div>
                <div style={{ color: new Date(sale.due_date) < new Date() && !isCompleted ? 'var(--color-danger)' : undefined }}>
                  {fmtDate(sale.due_date)}
                </div>
              </div>
            )}
            <div style={INP}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</div>
              <div>{payLabel(sale.payment_method)}</div>
            </div>
            {/* Payment Status */}
            <div style={{ ...INP, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'حالة الدفع' : 'Payment Status'}</div>
                <div style={{ fontWeight: 700, color: paymentStatus.color }}>
                  {lang === 'ar' ? paymentStatus.label_ar : paymentStatus.label_en}
                </div>
              </div>
              {!isFullyPaid && !isCancelled && !isRefunded && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setPaymentModal(true)}
                  style={{ fontSize: '0.75rem' }}
                >
                  + {lang === 'ar' ? 'دفعة' : 'Payment'}
                </button>
              )}
            </div>
            {sale.notes && (
              <div style={INP}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'ملاحظات' : 'Notes'}</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{sale.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── جدول المنتجات ──────────────────────────────── */}
      <div className="card" style={{ padding: 0, marginBottom: '1.25rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
            📦 {lang === 'ar' ? 'المنتجات / الخدمات' : 'Products / Services'}
          </h3>
        </div>
        {!sale.items || sale.items.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-text">{lang === 'ar' ? 'لا توجد منتجات مضافة' : 'No items in this invoice'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th>{lang === 'ar' ? 'المستودع' : 'Warehouse'}</th>
                  <th style={{ textAlign: 'center' }}>{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                  <th style={{ textAlign: 'end' }}>{lang === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                  {sale.items.some(it => (it.discount ?? 0) > 0) && (
                    <th style={{ textAlign: 'end' }}>{lang === 'ar' ? 'خصم %' : 'Disc %'}</th>
                  )}
                  {sale.items.some(it => it.tax_amount) && (
                    <th style={{ textAlign: 'end' }}>{lang === 'ar' ? 'ضريبة' : 'Tax'}</th>
                  )}
                  <th style={{ textAlign: 'end' }}>{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.product?.name || item.product_name || '—'}</div>
                      {item.product?.sku && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SKU: {item.product.sku}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.warehouse?.name || '—'}
                    </td>
                   <td style={{ textAlign: 'center' }}>{item.qty}</td>
<td style={{ textAlign: 'end', direction: 'ltr' }}>{fmt(item.price)}</td>
                    {sale.items!.some(it => (it.discount ?? 0) > 0) && (
                      <td style={{ textAlign: 'end', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                        {item.discount ? `${item.discount}%` : '—'}
                      </td>
                    )}
                    {sale.items!.some(it => it.tax_amount) && (
                      <td style={{ textAlign: 'end', color: 'var(--text-muted)', fontSize: '0.85rem', direction: 'ltr' }}>
                        {item.tax_amount ? fmt(item.tax_amount) : '—'}
                      </td>
                    )}
                    <td style={{ textAlign: 'end', fontWeight: 700, direction: 'ltr' }}>{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ملخص + الدفعات ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'start' }}>

        {/* الدفعات */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
              💳 {lang === 'ar' ? 'الدفعات' : 'Payments'}
            </h3>
            {!isFullyPaid && !isCancelled && !isRefunded && (
              <button className="btn btn-primary btn-sm" onClick={() => setPaymentModal(true)}>
                + {lang === 'ar' ? 'إضافة دفعة' : 'Add Payment'}
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {lang === 'ar' ? 'لا توجد دفعات مسجلة' : 'No payments recorded'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {payments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.9rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{fmt(p.amount)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {payLabel(p.payment_method)} • {fmtDateShort(p.created_at)}
                      {p.reference && ` • ${p.reference}`}
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}
                    onClick={() => setDeletePaymentId(p.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ملخص المبالغ */}
        <div className="card" style={{ minWidth: 300 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span style={{ direction: 'ltr' }}>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'الخصم' : 'Discount'}</span>
                <span style={{ color: 'var(--color-danger)', direction: 'ltr' }}>- {fmt(discount)}</span>
              </div>
            )}
            {taxAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {sale.tax_rate ? `${lang === 'ar' ? 'ضريبة' : 'Tax'} (${sale.tax_rate.rate}%)` : (lang === 'ar' ? 'الضريبة' : 'Tax')}
                </span>
                <span style={{ color: 'var(--color-warning)', direction: 'ltr' }}>+ {fmt(taxAmt)}</span>
              </div>
            )}
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800 }}>
              <span>{lang === 'ar' ? 'الإجمالي النهائي' : 'Grand Total'}</span>
              <span style={{ color: 'var(--color-primary)', direction: 'ltr' }}>{fmt(total)}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-success)' }}>{lang === 'ar' ? 'المدفوع' : 'Paid'}</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 700, direction: 'ltr' }}>{fmt(totalPaid)}</span>
            </div>
            {remainingAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-danger)' }}>{lang === 'ar' ? 'المتبقي' : 'Remaining'}</span>
                <span style={{ color: 'var(--color-danger)', fontWeight: 700, direction: 'ltr' }}>{fmt(remainingAmt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Modal: إضافة دفعة
      ══════════════════════════════════════════════════ */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">💳 {lang === 'ar' ? 'إضافة دفعة' : 'Add Payment'}</h3>
              <button className="btn-icon" onClick={() => setPaymentModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* المتبقي */}
                <div style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? 'المتبقي للدفع' : 'Remaining'}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-danger)' }}>{fmt(remainingAmt)}</div>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">{lang === 'ar' ? 'المبلغ *' : 'Amount *'}</label>
                  <input
                    className="input" type="number" min="0.01" step="0.01"
                    placeholder={lang === 'ar' ? 'أدخل المبلغ' : 'Enter amount'}
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                    autoFocus
                  />
                  {remainingAmt > 0 && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.78rem', cursor: 'pointer', padding: '2px 0', textAlign: 'start' }}
                      onClick={() => setPaymentForm(f => ({ ...f, amount: String(remainingAmt) }))}
                    >
                      {lang === 'ar' ? '← دفع المبلغ كاملاً' : '← Pay full amount'}
                    </button>
                  )}
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <select className="input" value={paymentForm.payment_method} onChange={e => setPaymentForm(f => ({ ...f, payment_method: e.target.value }))}>
                    <option value="cash">{lang === 'ar' ? 'نقدي' : 'Cash'}</option>
                    <option value="card">{lang === 'ar' ? 'بطاقة بنكية' : 'Card'}</option>
                    <option value="bank_transfer">{lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                    <option value="credit">{lang === 'ar' ? 'آجل' : 'Credit'}</option>
                  </select>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">{lang === 'ar' ? 'رقم المرجع (اختياري)' : 'Reference (optional)'}</label>
                  <input className="input" placeholder={lang === 'ar' ? 'رقم الإيصال / التحويل' : 'Receipt / transfer number'} value={paymentForm.reference} onChange={e => setPaymentForm(f => ({ ...f, reference: e.target.value }))} />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">{lang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</label>
                  <input className="input" value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                {paymentError && (
                  <div className="login-error"><span>⚠️</span> {paymentError}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPaymentModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={handleAddPayment} disabled={paymentLoading}>
                {paymentLoading ? '⏳...' : (lang === 'ar' ? '✓ تسجيل الدفعة' : '✓ Record Payment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Modal: تأكيد حذف دفعة
      ══════════════════════════════════════════════════ */}
      {deletePaymentId && (
        <div className="modal-overlay" onClick={() => setDeletePaymentId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{lang === 'ar' ? 'حذف الدفعة؟' : 'Delete Payment?'}</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                {lang === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletePaymentId(null)}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-danger" onClick={handleDeletePayment}>
                {lang === 'ar' ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print CSS ────────────────────────────────────── */}
      <style>{`
        @media print {
          .sidebar, .navbar, .page-header .btn, .modal-overlay { display: none !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
          body { background: white !important; }
        }
      `}</style>

    </ERPLayout>
  )
}