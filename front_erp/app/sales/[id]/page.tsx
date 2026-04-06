'use client'

// ══════════════════════════════════════════════════════════
// app/sales/[id]/page.tsx — صفحة تفاصيل الفاتورة
// API: GET /api/sales/{id}
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type SaleItem = {
  id: number
  product?: { name: string; sku?: string }
  product_name?: string
  quantity: number
  unit_price: number
  total: number
  tax_amount?: number
}

type Sale = {
  id: number
  reference?: string
  customer?: { id: number; name: string; email?: string; phone?: string }
  customer_name?: string
  status: string
  payment_method?: string
  subtotal?: number
  tax_amount?: number
  total: number
  notes?: string
  created_at: string
  items?: SaleItem[]
  tax_rate?: { name: string; rate: number }
}

const STATUS_COLORS: Record<string, { bg: string; color: string; ar: string }> = {
  draft:      { bg: '#f3f4f6', color: '#6b7280', ar: 'مسودة' },
  pending:    { bg: '#fef3c7', color: '#d97706', ar: 'قيد المعالجة' },
  confirmed:  { bg: '#d1fae5', color: '#059669', ar: 'مؤكد' },
  completed:  { bg: '#dbeafe', color: '#2563eb', ar: 'مكتمل' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', ar: 'ملغي' },
  refunded:   { bg: '#ede9fe', color: '#7c3aed', ar: 'مسترد' },
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقدي', card: 'بطاقة بنكية', transfer: 'تحويل بنكي', credit: 'آجل',
}

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useI18n()

  const [sale,    setSale]    = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!id) return
    api.get<Sale>(`/sales/${id}`).then(res => {
      if (res.error) { setError(res.error); setLoading(false); return }
      setSale(res.data)
      setLoading(false)
    })
  }, [id])

  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n || 0)

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  const INP: React.CSSProperties = {
    padding: '0.6rem 0.9rem',
    background: 'var(--bg-hover)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
  }

  if (loading) return (
    <ERPLayout pageTitle={lang === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 48 }} />
        ))}
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

  const st = STATUS_COLORS[sale.status] ?? STATUS_COLORS['draft']
  const subtotal = sale.subtotal ?? (sale.items?.reduce((sum, it) => sum + it.total, 0) ?? sale.total)
  const taxAmt   = sale.tax_amount ?? 0
  const total    = sale.total ?? subtotal + taxAmt

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}>

      {/* ── شريط العودة + الأزرار ──────────────────────────── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/sales')}>
            {lang === 'ar' ? '← رجوع' : '← Back'}
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              🧾 {lang === 'ar' ? 'فاتورة' : 'Invoice'} #{sale.reference || sale.id}
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              {fmtDate(sale.created_at)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            background: st.bg, color: st.color,
            padding: '6px 16px', borderRadius: 'var(--radius-full)',
            fontWeight: 700, fontSize: '0.85rem',
          }}>
            {lang === 'ar' ? st.ar : sale.status}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            🖨️ {lang === 'ar' ? 'طباعة' : 'Print'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* ── بيانات العميل ───────────────────────────────── */}
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

        {/* ── بيانات الفاتورة ─────────────────────────────── */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            📋 {lang === 'ar' ? 'بيانات الفاتورة' : 'Invoice Info'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={INP}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</div>
              <div style={{ fontWeight: 700 }}>{sale.reference || `#${sale.id}`}</div>
            </div>
            <div style={INP}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'التاريخ' : 'Date'}</div>
              <div>{fmtDate(sale.created_at)}</div>
            </div>
            <div style={INP}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lang === 'ar' ? 'طريقة الدفع' : 'Payment'}</div>
              <div>{sale.payment_method ? (PAYMENT_LABELS[sale.payment_method] || sale.payment_method) : '—'}</div>
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

      {/* ── جدول المنتجات ──────────────────────────────────── */}
      <div className="card" style={{ padding: 0, marginBottom: '1.25rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
            📦 {lang === 'ar' ? 'المنتجات / الخدمات' : 'Products / Services'}
          </h3>
        </div>
        {!sale.items || sale.items.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-text">{lang === 'ar' ? 'لا توجد منتجات مضافة لهذه الفاتورة' : 'No items in this invoice'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th style={{ textAlign: 'center' }}>{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                  <th style={{ textAlign: 'end' }}>{lang === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
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
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'end', direction: 'ltr' }}>{fmt(item.unit_price)}</td>
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

      {/* ── ملخص المبالغ ───────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div className="card" style={{ minWidth: 300, maxWidth: 400, width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span style={{ direction: 'ltr' }}>{fmt(subtotal)}</span>
            </div>
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
          </div>
        </div>
      </div>

    </ERPLayout>
  )
}
