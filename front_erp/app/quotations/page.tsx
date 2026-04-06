'use client'

// ══════════════════════════════════════════════════════════
// app/quotations/page.tsx — صفحة عروض الأسعار
// API:
//   GET    /api/quotations               → قائمة العروض
//   POST   /api/quotations               → إنشاء عرض
//   PUT    /api/quotations/{id}          → تعديل
//   DELETE /api/quotations/{id}          → حذف
//   POST   /api/quotations/{id}/convert  → تحويل لفاتورة
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type QuotItem = {
  id: number
  invoice_number: string
  customer?: { id: number; name: string }
  total: number
  status: string
  notes?: string
  created_at: string
  items?: LineItem[]
}
type Customer = { id: number; name: string }
type Product  = { id: number; name: string; price?: number; sale_price?: number }
type LineItem = { product_id: string; name: string; qty: number; price: number }

const EMPTY_FORM = { customer_id: '', notes: '', items: [] as LineItem[] }

export default function QuotationsPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [quotations,  setQuotations]  = useState<QuotItem[]>([])
  const [customers,   setCustomers]   = useState<Customer[]>([])
  const [products,    setProducts]    = useState<Product[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [converting,  setConverting]  = useState<number | null>(null)
  const [total,       setTotal]       = useState(0)
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editing,     setEditing]     = useState<QuotItem | null>(null)
  const [form,        setForm]        = useState({ ...EMPTY_FORM })
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  const flash = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), ...(search && { search }) })
    const [qRes, cRes, prRes] = await Promise.all([
      api.get(`/quotations?${p}`),
      api.get('/customers?per_page=200'),
      api.get('/products?per_page=300'),
    ])
    if (qRes.data) { setQuotations(qRes.data.data ?? qRes.data); setTotal(qRes.data.total ?? 0) }
    if (cRes.data) setCustomers(cRes.data.data ?? cRes.data)
    if (prRes.data) setProducts(prRes.data.data ?? prRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [page, search])

  // ── Line Items helpers ─────────────────────────────────
  const addLine = () =>
    setForm(p => ({ ...p, items: [...p.items, { product_id: '', name: '', qty: 1, price: 0 }] }))

  const updateLine = (i: number, key: keyof LineItem, val: any) =>
    setForm(p => {
      const items = [...p.items]
      if (key === 'product_id') {
        const prod = products.find(pr => String(pr.id) === val)
        items[i] = { ...items[i], product_id: val, name: prod?.name ?? '', price: prod?.sale_price ?? prod?.price ?? 0 }
      } else {
        items[i] = { ...items[i], [key]: key === 'qty' || key === 'price' ? Number(val) : val }
      }
      return { ...p, items }
    })

  const removeLine = (i: number) =>
    setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))

  const lineTotal = (item: LineItem) => (item.qty ?? 0) * (item.price ?? 0)
  const grandTotal = () => form.items.reduce((s, i) => s + lineTotal(i), 0)

  // ── CRUD ──────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null); setForm({ ...EMPTY_FORM, items: [] }); setErrors({}); setModalOpen(true)
  }

  const openEdit = (q: QuotItem) => {
    setEditing(q)
    setForm({
      customer_id: String(q.customer?.id ?? ''),
      notes:       q.notes ?? '',
      items:       q.items?.map(i => ({
        product_id: String((i as any).product_id ?? ''),
        name:       (i as any).product?.name ?? '',
        qty:        (i as any).qty ?? 1,
        price:      (i as any).price ?? 0,
      })) ?? [],
    })
    setErrors({}); setModalOpen(true)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.items.length) e.items = ar ? 'أضف عنصراً واحداً على الأقل' : 'Add at least one item'
    form.items.forEach((item, i) => {
      if (!item.product_id) e[`item_${i}`] = ar ? 'اختر منتج' : 'Select product'
      if (item.qty <= 0)    e[`qty_${i}`]  = ar ? 'كمية غير صحيحة' : 'Invalid qty'
    })
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const payload = {
      customer_id: form.customer_id ? Number(form.customer_id) : null,
      notes:       form.notes,
      items:       form.items.map(i => ({ product_id: Number(i.product_id), qty: i.qty, price: i.price })),
    }
    const res = editing
      ? await api.put(`/quotations/${editing.id}`, { notes: form.notes, customer_id: payload.customer_id })
      : await api.post('/quotations', payload)
    setSaving(false)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? (editing ? 'تم التحديث ✓' : 'تم إنشاء العرض ✓') : (editing ? 'Updated ✓' : 'Quotation created ✓'))
    setModalOpen(false)
    fetchAll()
  }

  const handleDelete = async (q: QuotItem) => {
    if (!confirm(ar ? `حذف عرض "${q.invoice_number}"؟` : `Delete "${q.invoice_number}"?`)) return
    const res = await api.delete(`/quotations/${q.id}`)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? 'تم الحذف' : 'Deleted')
    fetchAll()
  }

  const handleConvert = async (q: QuotItem) => {
    if (!confirm(
      ar
        ? `تحويل العرض "${q.invoice_number}" إلى فاتورة مبيعات؟`
        : `Convert "${q.invoice_number}" to a sales invoice?`
    )) return
    setConverting(q.id)
    const res = await api.post(`/quotations/${q.id}/convert`, {})
    setConverting(null)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? '✅ تم التحويل إلى فاتورة' : '✅ Converted to invoice')
    fetchAll()
  }

  const fmt = (n: number) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n ?? 0)

  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 1150, margin: '0 auto' }}>

        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: toast.ok ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '12px 22px', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontWeight: 600, fontSize: 14,
          }}>{toast.msg}</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
              {ar ? '📄 عروض الأسعار' : '📄 Quotations'}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
              {ar ? `الإجمالي: ${total} عرض` : `Total: ${total} quotations`}
            </p>
          </div>
          <button onClick={openAdd} style={{
            background: '#1a56db', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700,
          }}>
            {ar ? '+ عرض سعر جديد' : '+ New Quotation'}
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder={ar ? 'بحث برقم العرض...' : 'Search by number...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 20,
            border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14,
            boxSizing: 'border-box',
          }}
        />

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
            <div style={{ fontSize: 36 }}>⏳</div>
            <div style={{ marginTop: 10 }}>{ar ? 'جاري التحميل...' : 'Loading...'}</div>
          </div>
        ) : quotations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 48 }}>📄</div>
            <div style={{ marginTop: 10, color: '#6b7280' }}>
              {ar ? 'لا توجد عروض أسعار' : 'No quotations yet'}
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {[
                    ar ? 'رقم العرض'  : 'Number',
                    ar ? 'العميل'     : 'Customer',
                    ar ? 'الإجمالي'   : 'Total',
                    ar ? 'التاريخ'    : 'Date',
                    ar ? 'الحالة'     : 'Status',
                    ar ? 'إجراءات'   : 'Actions',
                  ].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => {
                  const isConverting = converting === q.id
                  return (
                    <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1a56db' }}>{q.invoice_number}</td>
                      <td style={{ padding: '13px 16px' }}>{q.customer?.name ?? (ar ? 'عميل نقدي' : 'Walk-in')}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 600 }}>{fmt(q.total)}</td>
                      <td style={{ padding: '13px 16px', color: '#6b7280', fontSize: 13 }}>
                        {new Date(q.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          background: q.status === 'quotation' ? '#eff6ff' : '#d1fae5',
                          color:      q.status === 'quotation' ? '#1e40af' : '#065f46',
                          padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        }}>
                          {q.status === 'quotation' ? (ar ? 'عرض سعر' : 'Quotation') : (ar ? 'محوّل' : 'Converted')}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {q.status === 'quotation' && (
                            <>
                              <button onClick={() => openEdit(q)} style={{
                                background: '#f3f4f6', border: 'none', borderRadius: 6,
                                padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                              }}>
                                {ar ? '✏️ تعديل' : '✏️ Edit'}
                              </button>
                              <button onClick={() => handleConvert(q)} disabled={isConverting} style={{
                                background: isConverting ? '#a7f3d0' : '#d1fae5', color: '#065f46',
                                border: 'none', borderRadius: 6,
                                padding: '6px 12px', cursor: isConverting ? 'not-allowed' : 'pointer',
                                fontSize: 12, fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 5,
                              }}>
                                {isConverting && <Spinner small />}
                                {ar ? '🔄 تحويل لفاتورة' : '🔄 Convert'}
                              </button>
                              <button onClick={() => handleDelete(q)} style={{
                                background: '#fef2f2', color: '#dc2626', border: 'none',
                                borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                              }}>
                                {ar ? '🗑️ حذف' : '🗑️'}
                              </button>
                            </>
                          )}
                          {q.status !== 'quotation' && (
                            <span style={{ color: '#9ca3af', fontSize: 12 }}>
                              {ar ? 'تم التحويل' : 'Converted'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #d1d5db', cursor: 'pointer', background: page === 1 ? '#f9fafb' : '#fff' }}>
              {ar ? 'السابق' : 'Prev'}
            </button>
            <span style={{ padding: '8px 14px', color: '#6b7280' }}>{page}</span>
            <button disabled={quotations.length < 15} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #d1d5db', cursor: 'pointer' }}>
              {ar ? 'التالي' : 'Next'}
            </button>
          </div>
        )}

        {/* ── Modal: Create / Edit Quotation ────────────── */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: 24, overflowY: 'auto' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 680, marginTop: 20, marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 22px', fontSize: 18, fontWeight: 700 }}>
                {editing ? (ar ? '✏️ تعديل عرض السعر' : '✏️ Edit Quotation') : (ar ? '📄 عرض سعر جديد' : '📄 New Quotation')}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Customer */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'العميل' : 'Customer'}
                  </label>
                  <select
                    value={form.customer_id}
                    onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  >
                    <option value="">{ar ? '-- عميل نقدي --' : '-- Walk-in customer --'}</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Items */}
                {!editing && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ fontWeight: 600, fontSize: 13 }}>{ar ? 'العناصر *' : 'Items *'}</label>
                      <button type="button" onClick={addLine} style={{
                        background: '#eff6ff', color: '#1a56db', border: 'none',
                        borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      }}>
                        {ar ? '+ إضافة عنصر' : '+ Add Item'}
                      </button>
                    </div>

                    {errors.items && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>{errors.items}</p>}

                    {form.items.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 36px', gap: 8, marginBottom: 8 }}>
                        <select
                          value={item.product_id}
                          onChange={e => updateLine(i, 'product_id', e.target.value)}
                          style={{ padding: '9px 10px', border: `1px solid ${errors[`item_${i}`] ? '#ef4444' : '#d1d5db'}`, borderRadius: 7, fontSize: 13 }}
                        >
                          <option value="">{ar ? 'اختر منتج' : 'Select'}</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input
                          type="number" min="0.001" step="0.001" placeholder={ar ? 'كمية' : 'Qty'}
                          value={item.qty}
                          onChange={e => updateLine(i, 'qty', e.target.value)}
                          style={{ padding: '9px 8px', border: `1px solid ${errors[`qty_${i}`] ? '#ef4444' : '#d1d5db'}`, borderRadius: 7, fontSize: 13 }}
                        />
                        <input
                          type="number" min="0" step="0.01" placeholder={ar ? 'سعر' : 'Price'}
                          value={item.price}
                          onChange={e => updateLine(i, 'price', e.target.value)}
                          style={{ padding: '9px 8px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13 }}
                        />
                        <button type="button" onClick={() => removeLine(i)} style={{
                          background: '#fef2f2', color: '#dc2626', border: 'none',
                          borderRadius: 7, cursor: 'pointer', fontSize: 16, fontWeight: 700,
                        }}>×</button>
                      </div>
                    ))}

                    {form.items.length > 0 && (
                      <div style={{ textAlign: 'left', marginTop: 10, fontSize: 15, fontWeight: 700, color: '#1a56db' }}>
                        {ar ? 'الإجمالي:' : 'Total:'} {fmt(grandTotal())}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'ملاحظات' : 'Notes'}
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }}
                    placeholder={ar ? 'ملاحظات إضافية...' : 'Additional notes...'}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{
                    flex: 1, padding: '11px', border: '1px solid #d1d5db', borderRadius: 8,
                    background: '#fff', cursor: 'pointer', fontWeight: 600,
                  }}>
                    {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={saving} style={{
                    flex: 2, padding: '11px', border: 'none', borderRadius: 8,
                    background: saving ? '#93c5fd' : '#1a56db', color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    {saving && <Spinner />}
                    {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? '💾 حفظ العرض' : '💾 Save Quotation')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}

function Spinner({ small }: { small?: boolean }) {
  const s = small ? 12 : 14
  return <span style={{ display: 'inline-block', width: s, height: s, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
}
