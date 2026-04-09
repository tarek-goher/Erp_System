'use client'

// ══════════════════════════════════════════════════════════
// app/quotations/page.tsx — صفحة عروض الأسعار (كاملة)
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

// ── Types ──────────────────────────────────────────────────
type QuotItem = {
  id: number
  invoice_number: string
  customer?: { id: number; name: string }
  total: number
  status: string
  notes?: string
  valid_until?: string
  created_at: string
  items?: LineItem[]
}

type Customer = { id: number; name: string; phone?: string; email?: string }
type Product  = { id: number; name: string; sku?: string; sale_price?: number; price?: number; qty?: number }

type LineItem = {
  product_id: string
  name:       string
  qty:        number
  price:      number
  discount:   number
}

const EMPTY_LINE: LineItem = { product_id: '', name: '', qty: 1, price: 0, discount: 0 }

// ── Autocomplete Component ─────────────────────────────────
function Autocomplete({
  placeholder, value, onSelect, fetchFn, renderOption, onAddNew, addNewLabel,
}: {
  placeholder: string
  value: string
  onSelect: (item: any) => void
  fetchFn: (q: string) => Promise<any[]>
  renderOption: (item: any) => React.ReactNode
  onAddNew?: () => void
  addNewLabel?: string
}) {
  const [query,   setQuery]   = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<any>(null)

  useEffect(() => { setQuery(value) }, [value])

  const handleChange = (val: string) => {
    setQuery(val)
    clearTimeout(timer.current)
    if (!val.trim()) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetchFn(val)
      setResults(res)
      setOpen(true)
      setLoading(false)
    }, 300)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => query && results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
          borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any,
          outline: 'none',
        }}
      />
      {loading && (
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 12 }}>
          ⏳
        </div>
      )}
      {open && (results.length > 0 || onAddNew) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,.12)', maxHeight: 240, overflowY: 'auto',
        }}>
          {results.map((item, i) => (
            <div key={i} onMouseDown={() => { onSelect(item); setQuery(item.name); setOpen(false) }}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              {renderOption(item)}
            </div>
          ))}
          {onAddNew && (
            <div onMouseDown={onAddNew}
              style={{ padding: '10px 14px', cursor: 'pointer', color: '#1a56db', fontWeight: 600, fontSize: 13, borderTop: '1px solid #e5e7eb' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              + {addNewLabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function QuotationsPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [quotations, setQuotations] = useState<QuotItem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [converting, setConverting] = useState<number | null>(null)
  const [total,      setTotal]      = useState(0)
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState<QuotItem | null>(null)
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null)

  // form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerQuery,    setCustomerQuery]    = useState('')
  const [notes,            setNotes]            = useState('')
  const [validUntil,       setValidUntil]       = useState('')
  const [lines,            setLines]            = useState<LineItem[]>([{ ...EMPTY_LINE }])

  // inline add customer modal
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [newCust,         setNewCust]         = useState({ name: '', phone: '', email: '' })
  const [addingCust,      setAddingCust]      = useState(false)

  // inline add product modal
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [newProd,        setNewProd]        = useState({ name: '', sale_price: '', sku: '' })
  const [addingProd,     setAddingProd]     = useState(false)
  const [addProdLineIdx, setAddProdLineIdx] = useState<number>(0)

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch quotations ──
  const fetchQuotations = async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), per_page: '15', ...(search && { search }) })
    const res = await api.get(`/quotations?${p}`)
    if (res.data) {
      setQuotations(res.data.data ?? res.data)
      setTotal(res.data.total ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { fetchQuotations() }, [page, search])

  // ── Autocomplete fetch functions ──
  const fetchCustomers = async (q: string): Promise<Customer[]> => {
    const res = await api.get(`/customers?search=${encodeURIComponent(q)}&per_page=10`)
    return res.data?.data ?? res.data ?? []
  }

  const fetchProducts = async (q: string): Promise<Product[]> => {
    const res = await api.get(`/products?search=${encodeURIComponent(q)}&per_page=10`)
    return res.data?.data ?? res.data ?? []
  }

  // ── Line Items ──
  const addLine = () => setLines(p => [...p, { ...EMPTY_LINE }])

  const updateLine = (i: number, key: keyof LineItem, val: any) =>
    setLines(p => {
      const arr = [...p]
      arr[i] = { ...arr[i], [key]: val }
      return arr
    })

  const selectProduct = (i: number, prod: Product) => {
    setLines(p => {
      const arr = [...p]
      arr[i] = {
        ...arr[i],
        product_id: String(prod.id),
        name:       prod.name,
        price:      prod.sale_price ?? prod.price ?? 0,
      }
      return arr
    })
  }

  const removeLine = (i: number) => setLines(p => p.filter((_, idx) => idx !== i))

  const lineNet   = (l: LineItem) => l.qty * l.price - (l.discount ?? 0)
  const grandTotal = () => lines.reduce((s, l) => s + lineNet(l), 0)

  // ── Reset form ──
  const resetForm = () => {
    setSelectedCustomer(null)
    setCustomerQuery('')
    setNotes('')
    setValidUntil('')
    setLines([{ ...EMPTY_LINE }])
    setErrors({})
    setEditing(null)
  }

  const openAdd = () => { resetForm(); setModalOpen(true) }

  const openEdit = (q: QuotItem) => {
    setEditing(q)
    setSelectedCustomer(q.customer ?? null)
    setCustomerQuery(q.customer?.name ?? '')
    setNotes(q.notes ?? '')
    setValidUntil(q.valid_until ?? '')
    setLines(
      q.items && q.items.length > 0
        ? q.items.map((i: any) => ({
            product_id: String(i.product_id ?? ''),
            name:       i.product?.name ?? i.name ?? '',
            qty:        i.quantity ?? i.qty ?? 1,
            price:      Number(i.unit_price ?? i.price ?? 0),
            discount:   Number(i.discount ?? 0),
          }))
        : [{ ...EMPTY_LINE }]
    )
    setErrors({})
    setModalOpen(true)
  }

  // ── Validate ──
const validate = () => {
    const e: Record<string, string> = {}
    
    // لو تعديل، مش محتاج validate على الـ items
    if (!editing) {
      if (!lines.length || lines.every(l => !l.product_id)) {
        e.items = ar ? 'أضف عنصراً واحداً على الأقل' : 'Add at least one item'
      }
      lines.forEach((l, i) => {
        if (!l.product_id) e[`item_${i}`] = ar ? 'اختر منتج' : 'Select product'
        if (l.qty <= 0)    e[`qty_${i}`]  = ar ? 'كمية غير صحيحة' : 'Invalid qty'
      })
    }
    
    setErrors(e)
    return !Object.keys(e).length
}

  // ── Submit ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const validLines = lines.filter(l => l.product_id && l.qty > 0)

    const payload = {
      customer_id: selectedCustomer?.id ?? null,
      notes,
      valid_until: validUntil || undefined,
      items: validLines.map(l => ({
        product_id: Number(l.product_id),
        qty:        l.qty,
        price:      l.price,
        discount:   l.discount ?? 0,
      })),
    }

    const res = editing
      ? await api.put(`/quotations/${editing.id}`, { notes, customer_id: payload.customer_id, valid_until: payload.valid_until })
      : await api.post('/quotations', payload)

    setSaving(false)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? (editing ? 'تم التحديث ✓' : 'تم إنشاء العرض ✓') : (editing ? 'Updated ✓' : 'Created ✓'))
    setModalOpen(false)
    resetForm()
    fetchQuotations()
  }

  // ── Delete ──
  const handleDelete = async (q: QuotItem) => {
    if (!confirm(ar ? `حذف عرض "${q.invoice_number}"؟` : `Delete "${q.invoice_number}"?`)) return
    const res = await api.delete(`/quotations/${q.id}`)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? 'تم الحذف' : 'Deleted')
    fetchQuotations()
  }

  // ── Convert ──
  const handleConvert = async (q: QuotItem) => {
    if (!confirm(ar ? `تحويل العرض "${q.invoice_number}" إلى فاتورة مبيعات؟` : `Convert "${q.invoice_number}" to invoice?`)) return
    setConverting(q.id)
    const res = await api.post(`/quotations/${q.id}/convert`, {})
    setConverting(null)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? '✅ تم التحويل إلى فاتورة' : '✅ Converted to invoice')
    fetchQuotations()
  }

  // ── Add Customer inline ──
  const handleAddCustomer = async () => {
    if (!newCust.name.trim()) return
    setAddingCust(true)
    const res = await api.post('/customers', newCust)
    setAddingCust(false)
    if (res.error) { flash(res.error, false); return }
    const c: Customer = res.data?.data ?? res.data
    setSelectedCustomer(c)
    setCustomerQuery(c.name)
    setAddCustomerOpen(false)
    setNewCust({ name: '', phone: '', email: '' })
    flash(ar ? 'تم إضافة العميل ✓' : 'Customer added ✓')
  }

  // ── Add Product inline ──
  const handleAddProduct = async () => {
    if (!newProd.name.trim()) return
    setAddingProd(true)
    const res = await api.post('/products', {
      name:       newProd.name,
      sale_price: Number(newProd.sale_price) || 0,
      sku:        newProd.sku || undefined,
    })
    setAddingProd(false)
    if (res.error) { flash(res.error, false); return }
    const p: Product = res.data?.data ?? res.data
    selectProduct(addProdLineIdx, p)
    setAddProductOpen(false)
    setNewProd({ name: '', sale_price: '', sku: '' })
    flash(ar ? 'تم إضافة المنتج ✓' : 'Product added ✓')
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n ?? 0)

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Toast */}
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
            borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}>
            {ar ? '+ عرض سعر جديد' : '+ New Quotation'}
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder={ar ? 'بحث برقم العرض أو اسم العميل...' : 'Search by number or customer...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 20,
            border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14,
            boxSizing: 'border-box' as any,
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
              {ar ? 'لا توجد عروض أسعار بعد' : 'No quotations yet'}
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {[
                    ar ? 'رقم العرض'      : 'Number',
                    ar ? 'العميل'         : 'Customer',
                    ar ? 'الإجمالي'       : 'Total',
                    ar ? 'صالح حتى'       : 'Valid Until',
                    ar ? 'التاريخ'        : 'Date',
                    ar ? 'الحالة'         : 'Status',
                    ar ? 'إجراءات'        : 'Actions',
                  ].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: ar ? 'right' : 'left', fontWeight: 700, fontSize: 13, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1a56db' }}>{q.invoice_number}</td>
                    <td style={{ padding: '13px 16px' }}>{q.customer?.name ?? (ar ? 'عميل نقدي' : 'Walk-in')}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 600 }}>{fmt(q.total)}</td>
                    <td style={{ padding: '13px 16px', color: '#6b7280', fontSize: 13 }}>
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}
                    </td>
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
                      {q.status === 'quotation' ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => openEdit(q)} style={{
                            background: '#f3f4f6', border: 'none', borderRadius: 6,
                            padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}>✏️ {ar ? 'تعديل' : 'Edit'}</button>
                          <button onClick={() => handleConvert(q)} disabled={converting === q.id} style={{
                            background: '#d1fae5', color: '#065f46', border: 'none',
                            borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}>
                            {converting === q.id ? '⏳' : '🔄'} {ar ? 'تحويل' : 'Convert'}
                          </button>
                          <button onClick={() => handleDelete(q)} style={{
                            background: '#fef2f2', color: '#dc2626', border: 'none',
                            borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}>🗑️</button>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>{ar ? 'تم التحويل' : 'Converted'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #d1d5db', cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#fff' }}>
              {ar ? 'السابق' : 'Prev'}
            </button>
            <span style={{ padding: '8px 14px', color: '#6b7280' }}>{page}</span>
            <button disabled={quotations.length < 15} onClick={() => setPage(p => p + 1)}
              style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff' }}>
              {ar ? 'التالي' : 'Next'}
            </button>
          </div>
        )}

        {/* ══ Modal: Create / Edit ══════════════════════════ */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: 24, overflowY: 'auto' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 760, marginTop: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {editing ? (ar ? '✏️ تعديل عرض السعر' : '✏️ Edit Quotation') : (ar ? '📄 عرض سعر جديد' : '📄 New Quotation')}
                </h2>
                <button onClick={() => { setModalOpen(false); resetForm() }}
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                  {/* العميل */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontWeight: 600, fontSize: 13 }}>{ar ? 'العميل' : 'Customer'}</label>
                      <button type="button" onClick={() => setAddCustomerOpen(true)}
                        style={{ background: 'none', border: 'none', color: '#1a56db', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        + {ar ? 'عميل جديد' : 'New Customer'}
                      </button>
                    </div>
                    <Autocomplete
                      placeholder={ar ? 'ابحث عن عميل...' : 'Search customer...'}
                      value={customerQuery}
                      onSelect={(c: Customer) => { setSelectedCustomer(c); setCustomerQuery(c.name) }}
                      fetchFn={fetchCustomers}
                      renderOption={(c: Customer) => (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                          {c.phone && <div style={{ fontSize: 11, color: '#6b7280' }}>{c.phone}</div>}
                        </div>
                      )}
                      onAddNew={() => setAddCustomerOpen(true)}
                      addNewLabel={ar ? 'إضافة عميل جديد' : 'Add new customer'}
                    />
                  </div>

                  {/* صالح حتى */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                      {ar ? 'صالح حتى' : 'Valid Until'}
                    </label>
                    <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any }} />
                  </div>
                </div>

                {/* Items */}
                {!editing && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ fontWeight: 600, fontSize: 13 }}>{ar ? 'العناصر *' : 'Items *'}</label>
                      <button type="button" onClick={addLine} style={{
                        background: '#eff6ff', color: '#1a56db', border: 'none',
                        borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      }}>+ {ar ? 'إضافة عنصر' : 'Add Item'}</button>
                    </div>

                    {errors.items && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>{errors.items}</p>}

                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 80px 100px 90px auto', gap: 8, marginBottom: 4 }}>
                      {[ar ? 'المنتج' : 'Product', ar ? 'كمية' : 'Qty', ar ? 'سعر' : 'Price', ar ? 'خصم' : 'Discount', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', padding: '0 2px' }}>{h}</div>
                      ))}
                    </div>

                    {lines.map((line, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.5fr 80px 100px 90px auto', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                        {/* Product autocomplete */}
                        <div>
                          <Autocomplete
                            placeholder={ar ? 'ابحث عن منتج...' : 'Search product...'}
                            value={line.name}
                            onSelect={(p: Product) => selectProduct(i, p)}
                            fetchFn={fetchProducts}
                            renderOption={(p: Product) => (
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: '#6b7280' }}>
                                  {p.sku && <span style={{ marginLeft: 8 }}>{p.sku}</span>}
                                  {p.sale_price !== undefined && <span style={{ color: '#1a56db' }}> {p.sale_price}</span>}
                                </div>
                              </div>
                            )}
                            onAddNew={() => { setAddProdLineIdx(i); setAddProductOpen(true) }}
                            addNewLabel={ar ? 'إضافة منتج جديد' : 'Add new product'}
                          />
                          {errors[`item_${i}`] && <p style={{ color: '#ef4444', fontSize: 11, margin: '2px 0 0' }}>{errors[`item_${i}`]}</p>}
                        </div>

                        <input type="number" min="0.001" step="0.001" value={line.qty}
                          onChange={e => updateLine(i, 'qty', Number(e.target.value))}
                          style={{ padding: '10px 8px', border: `1px solid ${errors[`qty_${i}`] ? '#ef4444' : '#d1d5db'}`, borderRadius: 7, fontSize: 13, width: '100%', boxSizing: 'border-box' as any }} />

                        <input type="number" min="0" step="0.01" value={line.price}
                          onChange={e => updateLine(i, 'price', Number(e.target.value))}
                          style={{ padding: '10px 8px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, width: '100%', boxSizing: 'border-box' as any }} />

                        <input type="number" min="0" step="0.01" value={line.discount}
                          onChange={e => updateLine(i, 'discount', Number(e.target.value))}
                          placeholder="0"
                          style={{ padding: '10px 8px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, width: '100%', boxSizing: 'border-box' as any }} />

                        <button type="button" onClick={() => removeLine(i)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 16, fontWeight: 700, padding: '10px 12px' }}>×</button>
                      </div>
                    ))}

                    {lines.length > 0 && (
                      <div style={{ textAlign: 'left', marginTop: 12, padding: '10px 14px', background: '#f9fafb', borderRadius: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a56db' }}>
                          {ar ? 'الإجمالي:' : 'Total:'} {fmt(grandTotal())}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'ملاحظات / الشروط والأحكام' : 'Notes / Terms & Conditions'}
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any, resize: 'vertical' }}
                    placeholder={ar ? 'شروط الدفع، صلاحية العرض، ملاحظات أخرى...' : 'Payment terms, validity, other notes...'} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => { setModalOpen(false); resetForm() }}
                    style={{ flex: 1, padding: 11, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={saving}
                    style={{ flex: 2, padding: 11, border: 'none', borderRadius: 8, background: saving ? '#93c5fd' : '#1a56db', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}>
                    {saving ? (ar ? '⏳ جاري الحفظ...' : '⏳ Saving...') : (ar ? '💾 حفظ العرض' : '💾 Save Quotation')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: Add Customer ═══════════════════════════ */}
        {addCustomerOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 420 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>
                {ar ? '👤 إضافة عميل جديد' : '👤 Add New Customer'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input placeholder={ar ? 'الاسم *' : 'Name *'} value={newCust.name}
                  onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))}
                  style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} autoFocus />
                <input placeholder={ar ? 'الهاتف' : 'Phone'} value={newCust.phone}
                  onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))}
                  style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
                <input placeholder={ar ? 'البريد الإلكتروني' : 'Email'} type="email" value={newCust.email}
                  onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))}
                  style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setAddCustomerOpen(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  {ar ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handleAddCustomer} disabled={addingCust || !newCust.name.trim()}
                  style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 8, background: '#1a56db', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                  {addingCust ? '⏳...' : (ar ? '✓ حفظ العميل' : '✓ Save Customer')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Modal: Add Product ════════════════════════════ */}
        {addProductOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 420 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>
                {ar ? '📦 إضافة منتج جديد' : '📦 Add New Product'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input placeholder={ar ? 'اسم المنتج *' : 'Product Name *'} value={newProd.name}
                  onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))}
                  style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} autoFocus />
                <input placeholder={ar ? 'سعر البيع' : 'Sale Price'} type="number" min="0" step="0.01" value={newProd.sale_price}
                  onChange={e => setNewProd(p => ({ ...p, sale_price: e.target.value }))}
                  style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
                <input placeholder={ar ? 'كود المنتج (اختياري)' : 'SKU (optional)'} value={newProd.sku}
                  onChange={e => setNewProd(p => ({ ...p, sku: e.target.value }))}
                  style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setAddProductOpen(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  {ar ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handleAddProduct} disabled={addingProd || !newProd.name.trim()}
                  style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 8, background: '#1a56db', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                  {addingProd ? '⏳...' : (ar ? '✓ حفظ المنتج' : '✓ Save Product')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ERPLayout>
  )
}