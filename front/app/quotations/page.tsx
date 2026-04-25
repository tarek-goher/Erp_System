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
  customer?: { id: number; name: string; phone?: string; email?: string }
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

// ── Status Config ──────────────────────────────────────────
const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; bg: string; color: string }> = {
  quotation:  { labelAr: 'عرض سعر',    labelEn: 'Quotation',  bg: '#eff6ff', color: '#1e40af' },
  sent:       { labelAr: 'تم الإرسال', labelEn: 'Sent',       bg: '#e0f2fe', color: '#0369a1' },
  confirmed:  { labelAr: 'مؤكد',       labelEn: 'Confirmed',  bg: '#d1fae5', color: '#065f46' },
  cancelled:  { labelAr: 'ملغي',       labelEn: 'Cancelled',  bg: '#fef2f2', color: '#dc2626' },
  converted:  { labelAr: 'محوّل',      labelEn: 'Converted',  bg: '#f3f4f6', color: '#374151' },
}

const getStatusCfg = (status: string, ar: boolean) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['quotation']
  return { ...cfg, label: ar ? cfg.labelAr : cfg.labelEn }
}

// ── Print Quotation ────────────────────────────────────────
const printQuotation = async (q: QuotItem, ar: boolean) => {
  // جيب اسم الشركة من localStorage
  const user = JSON.parse(localStorage.getItem('erp_user') || '{}')
  const companyName = user?.company?.name ?? (ar ? 'شركتنا' : 'Our Company')

  // جيب التفاصيل الكاملة مع الأصناف
  const res = await api.get(`/quotations/${q.id}`)
  const full = (res.data?.data ?? res.data ?? q) as QuotItem

  const fmt = (n: number) =>
    new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n ?? 0)

  const cfg = getStatusCfg(full.status, ar)

  const itemsHtml = full.items && full.items.length > 0
    ? full.items.map((item: any, idx: number) => {
        const name     = item.product?.name ?? item.name ?? '—'
        const qty      = item.quantity ?? item.qty ?? 0
        const price    = Number(item.unit_price ?? item.price ?? 0)
        const discount = Number(item.discount ?? 0)
        const net      = qty * price - discount
        return `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${idx + 1}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;">${name}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">${qty}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(price)}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(discount)}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#1a56db;">${fmt(net)}</td>
          </tr>`
      }).join('')
    : `<tr><td colspan="6" style="padding:20px;text-align:center;color:#9ca3af;">${ar ? 'لا توجد عناصر' : 'No items'}</td></tr>`

  const html = `
    <!DOCTYPE html>
    <html dir="${ar ? 'rtl' : 'ltr'}" lang="${ar ? 'ar' : 'en'}">
    <head>
      <meta charset="UTF-8"/>
      <title>${ar ? 'عرض سعر' : 'Quotation'} - ${full.invoice_number}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${ar ? "'Segoe UI', Tahoma, Arial" : "'Segoe UI', Arial"}, sans-serif; color: #111; background: #fff; padding: 32px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .company { font-size: 22px; font-weight: 800; color: #1a56db; }
        .doc-title { font-size: 18px; font-weight: 700; color: #374151; margin-top: 4px; }
        .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${cfg.bg}; color: ${cfg.color}; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
        .meta-box { background: #f9fafb; border-radius: 10px; padding: 16px 20px; }
        .meta-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
        .meta-value { font-size: 15px; font-weight: 700; color: #111; }
        .meta-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead tr { background: #1a56db; color: #fff; }
        thead th { padding: 12px 14px; font-size: 12px; font-weight: 700; text-align: ${ar ? 'right' : 'left'}; }
        thead th:nth-child(3) { text-align: center; }
        thead th:nth-child(4), thead th:nth-child(5), thead th:nth-child(6) { text-align: right; }
        tbody tr:nth-child(even) { background: #f9fafb; }
        .total-row { background: #eff6ff; font-weight: 700; font-size: 16px; color: #1a56db; }
        .total-row td { padding: 14px; border-top: 2px solid #1a56db; }
        .notes { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin-top: 20px; }
        .notes-label { font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 6px; }
        .notes-text { font-size: 13px; color: #78350f; line-height: 1.6; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">🏢 ${companyName}</div>
          <div class="doc-title">${ar ? 'عرض سعر' : 'Quotation'}</div>
        </div>
        <div style="text-align:${ar ? 'left' : 'right'}">
          <div style="font-size:20px;font-weight:800;color:#374151;">#${full.invoice_number}</div>
          <div style="margin-top:6px"><span class="badge">${cfg.label}</span></div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <div class="meta-label">${ar ? 'العميل' : 'Customer'}</div>
          <div class="meta-value">${full.customer?.name ?? (ar ? 'عميل نقدي' : 'Walk-in')}</div>
          ${full.customer?.phone ? `<div class="meta-sub">📞 ${full.customer.phone}</div>` : ''}
          ${full.customer?.email ? `<div class="meta-sub">✉️ ${full.customer.email}</div>` : ''}
        </div>
        <div class="meta-box">
          <div class="meta-label">${ar ? 'تفاصيل العرض' : 'Quotation Details'}</div>
          <div class="meta-value">${new Date(full.created_at).toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}</div>
          ${full.valid_until ? `<div class="meta-sub">${ar ? 'صالح حتى:' : 'Valid Until:'} ${new Date(full.valid_until).toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}</div>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:40px">#</th>
            <th>${ar ? 'المنتج / الخدمة' : 'Product / Service'}</th>
            <th style="width:80px">${ar ? 'كمية' : 'Qty'}</th>
            <th style="width:110px">${ar ? 'السعر' : 'Price'}</th>
            <th style="width:110px">${ar ? 'خصم' : 'Discount'}</th>
            <th style="width:120px">${ar ? 'الصافي' : 'Net'}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="5" style="text-align:${ar ? 'left' : 'right'};padding:14px;">${ar ? 'الإجمالي الكلي' : 'Grand Total'}</td>
            <td style="text-align:right;padding:14px;">${fmt(full.total)}</td>
          </tr>
        </tbody>
      </table>

      ${full.notes ? `
        <div class="notes">
          <div class="notes-label">📝 ${ar ? 'ملاحظات / الشروط والأحكام' : 'Notes / Terms & Conditions'}</div>
          <div class="notes-text">${full.notes.replace(/\n/g, '<br/>')}</div>
        </div>
      ` : ''}

      <div class="footer">
        ${ar ? 'تم إنشاء هذا العرض بتاريخ' : 'Generated on'} ${new Date().toLocaleString(ar ? 'ar-EG' : 'en-GB')}
      </div>

      <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}

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

  // ── Filters ──
  const [filterStatus,    setFilterStatus]    = useState('')
  const [filterDateFrom,  setFilterDateFrom]  = useState('')
  const [filterDateTo,    setFilterDateTo]    = useState('')

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
    const p = new URLSearchParams({
      page:     String(page),
      per_page: '15',
      ...(search         && { search }),
      ...(filterStatus   && { status: filterStatus }),
      ...(filterDateFrom && { date_from: filterDateFrom }),
      ...(filterDateTo   && { date_to:   filterDateTo }),
    })
    const res = await api.get(`/quotations?${p}`)
    if (res.data) {
      setQuotations(res.data.data ?? res.data)
      setTotal(res.data.total ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { fetchQuotations() }, [page, search, filterStatus, filterDateFrom, filterDateTo])

  const resetFilters = () => {
    setFilterStatus('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSearch('')
    setPage(1)
  }

  const hasActiveFilters = filterStatus || filterDateFrom || filterDateTo || search

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

  const lineNet    = (l: LineItem) => l.qty * l.price - (l.discount ?? 0)
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

  // ── Change Status ──
  const handleChangeStatus = async (id: number, newStatus: string) => {
    const res = await api.put(`/quotations/${id}`, { status: newStatus })
    if (res.error) { flash(res.error, false); return }
    flash(ar ? 'تم تغيير الحالة ✓' : 'Status updated ✓')
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

  const canEdit = (status: string) => ['quotation', 'sent'].includes(status)

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

        {/* ── Filters Bar ─────────────────────────────────── */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          padding: '16px 20px', marginBottom: 16,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          {/* Search */}
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' }}>
              {ar ? 'بحث' : 'Search'}
            </label>
            <input
              type="text"
              placeholder={ar ? 'رقم العرض أو اسم العميل...' : 'Number or customer...'}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13,
                boxSizing: 'border-box' as any,
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' }}>
              {ar ? 'الحالة' : 'Status'}
            </label>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13,
                background: '#fff', cursor: 'pointer',
              }}
            >
              <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="quotation">{ar ? 'عرض سعر' : 'Quotation'}</option>
              <option value="sent">{ar ? 'تم الإرسال' : 'Sent'}</option>
              <option value="confirmed">{ar ? 'مؤكد' : 'Confirmed'}</option>
              <option value="cancelled">{ar ? 'ملغي' : 'Cancelled'}</option>
              <option value="converted">{ar ? 'محوّل' : 'Converted'}</option>
            </select>
          </div>

          {/* Date From */}
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' }}>
              {ar ? 'من تاريخ' : 'Date From'}
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13,
                boxSizing: 'border-box' as any,
              }}
            />
          </div>

          {/* Date To */}
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' }}>
              {ar ? 'إلى تاريخ' : 'Date To'}
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => { setFilterDateTo(e.target.value); setPage(1) }}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13,
                boxSizing: 'border-box' as any,
              }}
            />
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                padding: '9px 16px', border: '1px solid #fca5a5', borderRadius: 7,
                background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
              }}
            >
              ✕ {ar ? 'مسح الفلاتر' : 'Clear Filters'}
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {filterStatus && (
              <span style={{ background: '#eff6ff', color: '#1e40af', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {ar ? 'الحالة: ' : 'Status: '}
                {ar ? STATUS_CONFIG[filterStatus]?.labelAr : STATUS_CONFIG[filterStatus]?.labelEn}
              </span>
            )}
            {filterDateFrom && (
              <span style={{ background: '#f0fdf4', color: '#166534', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {ar ? 'من: ' : 'From: '}{filterDateFrom}
              </span>
            )}
            {filterDateTo && (
              <span style={{ background: '#f0fdf4', color: '#166534', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {ar ? 'إلى: ' : 'To: '}{filterDateTo}
              </span>
            )}
          </div>
        )}

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
              {ar ? 'لا توجد عروض أسعار' : 'No quotations found'}
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters} style={{ marginTop: 12, background: '#1a56db', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>
                {ar ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            )}
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
                    ar ? 'صالح حتى'   : 'Valid Until',
                    ar ? 'التاريخ'    : 'Date',
                    ar ? 'الحالة'     : 'Status',
                    ar ? 'إجراءات'    : 'Actions',
                  ].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: ar ? 'right' : 'left', fontWeight: 700, fontSize: 13, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => {
                  const cfg = getStatusCfg(q.status, ar)
                  return (
                    <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      {/* Number */}
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1a56db', whiteSpace: 'nowrap' }}>
                        {q.invoice_number}
                      </td>

                      {/* Customer — enhanced */}
                      <td style={{ padding: '13px 16px', minWidth: 160 }}>
                        {q.customer ? (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                              👤 {q.customer.name}
                            </div>
                            {q.customer.phone && (
                              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                                📞 {q.customer.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>
                            {ar ? '— عميل نقدي —' : '— Walk-in —'}
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 15, color: '#111827', whiteSpace: 'nowrap' }}>
                        {fmt(q.total)}
                      </td>

                      {/* Valid Until */}
                      <td style={{ padding: '13px 16px', color: '#6b7280', fontSize: 13 }}>
                        {q.valid_until ? (
                          <span style={{
                            color: new Date(q.valid_until) < new Date() ? '#dc2626' : '#6b7280',
                            fontWeight: new Date(q.valid_until) < new Date() ? 600 : 400,
                          }}>
                            {new Date(q.valid_until).toLocaleDateString()}
                            {new Date(q.valid_until) < new Date() && (ar ? ' ⚠️ منتهي' : ' ⚠️ Expired')}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '13px 16px', color: '#6b7280', fontSize: 13 }}>
                        {new Date(q.created_at).toLocaleDateString()}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          background: cfg.bg, color: cfg.color,
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>

                          {/* Print — always available */}
                          <button
                            onClick={() => printQuotation(q, ar)}
                            title={ar ? 'طباعة' : 'Print'}
                            style={{
                              background: '#f3f4f6', border: 'none', borderRadius: 6,
                              padding: '6px 11px', cursor: 'pointer', fontSize: 13,
                            }}
                          >
                            🖨️
                          </button>

                          {canEdit(q.status) && (
                            <>
                              <button onClick={() => openEdit(q)} style={{
                                background: '#f3f4f6', border: 'none', borderRadius: 6,
                                padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                              }}>✏️ {ar ? 'تعديل' : 'Edit'}</button>

                              <select
                                value={q.status}
                                onChange={e => handleChangeStatus(q.id, e.target.value)}
                                style={{ fontSize: 12, borderRadius: 6, border: '1px solid #d1d5db', padding: '5px 8px', cursor: 'pointer' }}
                              >
                                <option value="quotation">{ar ? 'عرض سعر' : 'Quotation'}</option>
                                <option value="sent">{ar ? 'تم الإرسال' : 'Sent'}</option>
                                <option value="confirmed">{ar ? 'مؤكد' : 'Confirmed'}</option>
                                <option value="cancelled">{ar ? 'ملغي' : 'Cancelled'}</option>
                              </select>

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
                            </>
                          )}

                          {!canEdit(q.status) && q.status !== 'converted' && (
                            <span style={{ color: '#9ca3af', fontSize: 12, padding: '6px 0' }}>
                              {cfg.label}
                            </span>
                          )}

                          {q.status === 'converted' && (
                            <span style={{ color: '#9ca3af', fontSize: 12, padding: '6px 0' }}>
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

                  {/* Customer */}
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

                  {/* Valid Until */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                      {ar ? 'صالح حتى' : 'Valid Until'}
                    </label>
                    <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any }} />
                  </div>
                </div>

                {/* Items — only on create */}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 80px 100px 90px auto', gap: 8, marginBottom: 4 }}>
                      {[ar ? 'المنتج' : 'Product', ar ? 'كمية' : 'Qty', ar ? 'سعر' : 'Price', ar ? 'خصم' : 'Discount', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', padding: '0 2px' }}>{h}</div>
                      ))}
                    </div>

                    {lines.map((line, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.5fr 80px 100px 90px auto', gap: 8, marginBottom: 8, alignItems: 'start' }}>
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