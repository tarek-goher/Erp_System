'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// الـ imports - شيل faFileExcel
import {
  faArrowLeft, faCheck, faPenToSquare, faTrash, faPrint,
  faBoxOpen, faCircleExclamation, faTruck, faBan,
} from '@fortawesome/free-solid-svg-icons'
//                                          ^^^^ زيادة
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type PurchaseItem = {
  id: number
  product_id: number
  product?: { id: number; name: string }
  warehouse_id?: number
  warehouse?: { id: number; name: string }
  qty: number
  cost: number
  discount: number
  total: number
}

type Purchase = {
  id: number
  po_number: string
  order_number?: string
  supplier?: { id: number; name: string; phone?: string; email?: string }
  user?: { id: number; name: string }
  subtotal: number
  discount: number
  tax: number
  total: number
  status: string
  notes?: string
  expected_at?: string
  expected_date?: string
  created_at: string
  items?: PurchaseItem[]
}

export default function PurchaseDetailPage() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [purchase,   setPurchase]   = useState<Purchase | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [receiving,  setReceiving]  = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  const fetchPurchase = async () => {
    setLoading(true); setError('')
    const res = await api.get<any>(`/purchases/${id}`)
    if (res.error) { setError(res.error); setLoading(false); return }
    const data = res.data?.data ?? res.data
    if (data?.id) setPurchase(data)
    else setError(lang === 'ar' ? 'لم يتم العثور على الطلب' : 'Order not found')
    setLoading(false)
  }

  useEffect(() => { if (id) fetchPurchase() }, [id])

  const handleReceive = async () => {
    setReceiving(true)
    const res = await api.patch(`/purchases/${id}/receive`, {})
    setReceiving(false)
    if (!res.error) fetchPurchase()
  }

  const handleCancel = async () => {
    setCancelling(true)
    const res = await api.put(`/purchases/${id}`, { status: 'cancelled' })

    setCancelling(false)
    setShowCancel(false)
    if (!res.error) fetchPurchase()
  }

  const handleDelete = async () => {
    setDeleting(true)
    await api.delete(`/purchases/${id}`)
    setDeleting(false)
    router.push('/purchases')
  }

  const handlePrint = () => window.print()

  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  const statusColor: Record<string, string> = {
    draft:     '#6b7280',
    pending:   '#b45309',
    approved:  '#1d4ed8',
    received:  '#15803d',
    cancelled: '#dc2626',
  }
  const statusBg: Record<string, string> = {
    draft:     'rgba(107,114,128,0.1)',
    pending:   'rgba(180,83,9,0.1)',
    approved:  'rgba(29,78,216,0.1)',
    received:  'rgba(21,128,61,0.1)',
    cancelled: 'rgba(220,38,38,0.1)',
  }

  const canReceive  = (s: string) => ['pending', 'approved'].includes(s)
  const canEdit     = (s: string) => !['received', 'cancelled'].includes(s)
  const canDelete   = (s: string) => s !== 'received'

  const poNumber = purchase?.po_number || purchase?.order_number || `#${id}`

  if (loading) return (
    <ERPLayout pageTitle={lang === 'ar' ? 'تفاصيل طلب الشراء' : 'Purchase Order'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900, margin: '0 auto' }}>
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: i === 0 ? 60 : 44, borderRadius: 8 }} />
        ))}
      </div>
    </ERPLayout>
  )

  if (error || !purchase) return (
    <ERPLayout pageTitle={lang === 'ar' ? 'خطأ' : 'Error'}>
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', color: '#dc2626', marginBottom: 16 }}>
          <FontAwesomeIcon icon={faCircleExclamation} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>{error || (lang === 'ar' ? 'لم يتم العثور على الطلب' : 'Order not found')}</h2>
        <button onClick={() => router.push('/purchases')} className="btn btn-primary" style={{ marginTop: 16 }}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ marginInlineEnd: 8 }} />
          {lang === 'ar' ? 'العودة للمشتريات' : 'Back to Purchases'}
        </button>
      </div>
    </ERPLayout>
  )

  return (
    <ERPLayout pageTitle={`${lang === 'ar' ? 'طلب شراء' : 'Purchase Order'} ${poNumber}`}>
      <div style={{ maxWidth: 960, margin: '0 auto' }} className="purchase-detail-page">

        {/* ══ Header ══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/purchases')}
              style={{ background: 'none', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', color: 'var(--text-muted, #6b7280)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{poNumber}</h1>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)', marginTop: 2 }}>
                {fmtDate(purchase.created_at)}
              </div>
            </div>
            <span style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 600,
              background: statusBg[purchase.status] || 'rgba(107,114,128,0.1)',
              color: statusColor[purchase.status] || '#6b7280',
            }}>
              {t(purchase.status) || purchase.status}
            </span>
          </div>

          {/* Action buttons */}
          <div className="no-print" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={handlePrint} className="btn btn-secondary btn-sm">
              <FontAwesomeIcon icon={faPrint} style={{ marginInlineEnd: 6 }} />
              {lang === 'ar' ? 'طباعة' : 'Print'}
            </button>
            {canEdit(purchase.status) && (
              <button onClick={() => router.push(`/purchases?edit=${id}`)} className="btn btn-secondary btn-sm">
                <FontAwesomeIcon icon={faPenToSquare} style={{ marginInlineEnd: 6 }} />
                {lang === 'ar' ? 'تعديل' : 'Edit'}
              </button>
            )}
            {canReceive(purchase.status) && (
              <button
                onClick={handleReceive}
                disabled={receiving}
                className="btn btn-sm"
                style={{ background: '#15803d', color: '#fff', border: 'none' }}
              >
                <FontAwesomeIcon icon={faCheck} style={{ marginInlineEnd: 6 }} />
                {receiving ? '...' : (lang === 'ar' ? 'استلام الطلب' : 'Receive Order')}
              </button>
            )}
            {canDelete(purchase.status) && (
              <button onClick={() => setShowDelete(true)} className="btn btn-danger btn-sm">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        </div>

        {/* ══ Info Cards ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* المورد */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>
              {t('supplier') || (lang === 'ar' ? 'المورد' : 'Supplier')}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{purchase.supplier?.name || '—'}</div>
            {purchase.supplier?.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)', marginTop: 4 }}>{purchase.supplier.phone}</div>}
            {purchase.supplier?.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)' }}>{purchase.supplier.email}</div>}
          </div>

          {/* بيانات الطلب */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>
              {lang === 'ar' ? 'بيانات الطلب' : 'Order Info'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #6b7280)' }}>{lang === 'ar' ? 'رقم الطلب' : 'PO Number'}</span>
                <span style={{ fontWeight: 600 }}>{poNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #6b7280)' }}>{lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</span>
                <span>{fmtDate(purchase.created_at)}</span>
              </div>
              {(purchase.expected_at || purchase.expected_date) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #6b7280)' }}>{lang === 'ar' ? 'التوريد المتوقع' : 'Expected'}</span>
                  <span>{fmtDate(purchase.expected_at || purchase.expected_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* المسؤول */}
          {purchase.user && (
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>
                {lang === 'ar' ? 'أنشأه' : 'Created By'}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{purchase.user.name}</div>
            </div>
          )}
        </div>

        {/* ══ استلام الطلب banner ══ */}
        {canReceive(purchase.status) && (
          <div className="no-print" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FontAwesomeIcon icon={faTruck} style={{ color: '#15803d', fontSize: '1.25rem' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#15803d', fontSize: '0.9rem' }}>{lang === 'ar' ? 'الطلب في انتظار الاستلام' : 'Order awaiting receipt'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)' }}>{lang === 'ar' ? 'عند الاستلام سيتم تحديث المخزون تلقائياً' : 'Stock will be updated automatically upon receipt'}</div>
              </div>
            </div>
            <button
              onClick={handleReceive}
              disabled={receiving}
              style={{ padding: '0.6rem 1.25rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              <FontAwesomeIcon icon={faCheck} style={{ marginInlineEnd: 8 }} />
              {receiving ? '...' : (lang === 'ar' ? 'تأكيد الاستلام' : 'Confirm Receipt')}
            </button>
          </div>
        )}

        {/* ══ Items Table ══ */}
        <div className="card" style={{ padding: 0, marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', fontWeight: 600, fontSize: '0.95rem' }}>
            {lang === 'ar' ? 'أصناف الطلب' : 'Order Items'}
            {purchase.items && (
              <span style={{ marginInlineStart: 8, fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted, #6b7280)' }}>
                ({purchase.items.length} {lang === 'ar' ? 'صنف' : 'items'})
              </span>
            )}
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th>{lang === 'ar' ? 'المخزن' : 'Warehouse'}</th>
                  <th style={{ textAlign: 'center' }}>{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                  <th style={{ textAlign: 'end' }}>{lang === 'ar' ? 'سعر التكلفة' : 'Unit Cost'}</th>
                  <th style={{ textAlign: 'end' }}>{lang === 'ar' ? 'خصم' : 'Discount'}</th>
                  <th style={{ textAlign: 'end' }}>{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items && purchase.items.length > 0 ? purchase.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.8rem' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{item.product?.name || `Product #${item.product_id}`}</td>
                    <td style={{ color: 'var(--text-muted, #6b7280)' }}>{item.warehouse?.name || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ textAlign: 'end' }}>{fmt(item.cost)}</td>
                    <td style={{ textAlign: 'end', color: item.discount > 0 ? '#15803d' : 'var(--text-muted, #6b7280)' }}>
                      {item.discount > 0 ? `- ${fmt(item.discount)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'end', fontWeight: 600 }}>{fmt(item.total)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #6b7280)' }}>
                      <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: '1.5rem', marginBottom: 8, display: 'block' }} />
                      {lang === 'ar' ? 'لا توجد أصناف' : 'No items'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ Summary + Notes ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: purchase.notes ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* Notes */}
          {purchase.notes && (
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>
                {t('notes') || (lang === 'ar' ? 'ملاحظات' : 'Notes')}
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-color, #111)' }}>{purchase.notes}</div>
            </div>
          )}

          {/* Totals */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 600 }}>
              {lang === 'ar' ? 'ملخص المبالغ' : 'Amount Summary'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted, #6b7280)' }}>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span>{fmt(purchase.subtotal)}</span>
              </div>
              {purchase.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#15803d' }}>
                  <span>{lang === 'ar' ? 'الخصم' : 'Discount'}</span>
                  <span>- {fmt(purchase.discount)}</span>
                </div>
              )}
              {purchase.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted, #6b7280)' }}>{lang === 'ar' ? 'الضريبة' : 'Tax'}</span>
                  <span>{fmt(purchase.tax)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, borderTop: '2px solid var(--border-color, #e5e7eb)', paddingTop: 10, marginTop: 4 }}>
                <span>{lang === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</span>
                <span style={{ color: '#1d4ed8' }}>{fmt(purchase.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ received banner ══ */}
        {purchase.status === 'received' && (
          <div style={{ padding: '1rem 1.25rem', background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FontAwesomeIcon icon={faCheck} style={{ color: '#15803d', fontSize: '1.1rem' }} />
            <div style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: 600 }}>
              {lang === 'ar' ? 'تم استلام الطلب وتحديث المخزون' : 'Order received and stock updated'}
            </div>
          </div>
        )}

        {/* ══ cancelled banner ══ */}
        {purchase.status === 'cancelled' && (
          <div style={{ padding: '1rem 1.25rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FontAwesomeIcon icon={faBan} style={{ color: '#dc2626', fontSize: '1.1rem' }} />
            <div style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: 600 }}>
              {lang === 'ar' ? 'تم إلغاء هذا الطلب' : 'This order has been cancelled'}
            </div>
          </div>
        )}
      </div>

      {/* ══ Delete Confirm Modal ══ */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setShowDelete(false)}>
          <div style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#dc2626' }}><FontAwesomeIcon icon={faTrash} /></div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
                {lang === 'ar' ? 'حذف طلب الشراء؟' : 'Delete Purchase Order?'}
              </h3>
              <p style={{ fontSize: '0.875rem', margin: 0, color: '#6b7280' }}>
                {lang === 'ar' ? 'سيتم حذف الطلب وإرجاع المخزون. لا يمكن التراجع.' : 'Order will be deleted and stock reversed. Cannot be undone.'}
              </p>
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowDelete(false)} style={{ padding: '0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500, background: '#fff', color: '#000' }}>
                {t('cancel') || (lang === 'ar' ? 'إلغاء' : 'Cancel')}
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '0.625rem 1rem', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                {deleting ? '...' : (t('delete') || (lang === 'ar' ? 'حذف' : 'Delete'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Print CSS ══ */}
      <style>{`
      @media print {
  .no-print { display: none !important; }
  nav, aside, header, footer, [class*="sidebar"], [class*="navbar"], [class*="layout"] { display: none !important; }
  .purchase-detail-page { max-width: 100% !important; margin: 0 !important; }
  .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
  body { background: white !important; }
}
      `}</style>
    </ERPLayout>
  )
}