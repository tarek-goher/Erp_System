'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import './page.css'

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
  name: string
  qty: number
  price: number
  discount: number
}

const EMPTY_LINE: LineItem = { product_id: '', name: '', qty: 1, price: 0, discount: 0 }

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; bg: string; color: string }> = {
  quotation: { labelAr: 'عرض سعر', labelEn: 'Quotation', bg: '#eff6ff', color: '#1e40af' },
  sent: { labelAr: 'تم الإرسال', labelEn: 'Sent', bg: '#e0f2fe', color: '#0369a1' },
  confirmed: { labelAr: 'مؤكد', labelEn: 'Confirmed', bg: '#d1fae5', color: '#065f46' },
  cancelled: { labelAr: 'ملغي', labelEn: 'Cancelled', bg: '#fef2f2', color: '#dc2626' },
  converted: { labelAr: 'محوّل', labelEn: 'Converted', bg: '#f3f4f6', color: '#374151' },
}

const getStatusCfg = (status: string, ar: boolean) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.quotation
  return { ...cfg, label: ar ? cfg.labelAr : cfg.labelEn }
}

const printQuotation = async (q: QuotItem, ar: boolean) => {
  const user = JSON.parse(localStorage.getItem('erp_user') || '{}')
  const companyName = user?.company?.name ?? (ar ? 'شركتنا' : 'Our Company')

  const res = await api.get(`/quotations/${q.id}`)
  const full = (res.data?.data ?? res.data ?? q) as QuotItem

  const fmt = (n: number) =>
    new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n ?? 0)

  const cfg = getStatusCfg(full.status, ar)

  const itemsHtml = full.items && full.items.length > 0
    ? full.items.map((item: any, idx: number) => {
        const name = item.product?.name ?? item.name ?? '-'
        const qty = item.quantity ?? item.qty ?? 0
        const price = Number(item.unit_price ?? item.price ?? 0)
        const discount = Number(item.discount ?? 0)
        const net = qty * price - discount
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
          <div class="company">${companyName}</div>
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
          ${full.customer?.phone ? `<div class="meta-sub">${full.customer.phone}</div>` : ''}
          ${full.customer?.email ? `<div class="meta-sub">${full.customer.email}</div>` : ''}
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
          <div class="notes-label">${ar ? 'ملاحظات / الشروط والأحكام' : 'Notes / Terms & Conditions'}</div>
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
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function Autocomplete({
  placeholder,
  value,
  onSelect,
  fetchFn,
  renderOption,
  onAddNew,
  addNewLabel,
}: {
  placeholder: string
  value: string
  onSelect: (item: any) => void
  fetchFn: (q: string) => Promise<any[]>
  renderOption: (item: any) => React.ReactNode
  onAddNew?: () => void
  addNewLabel?: string
}) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<any>(null)

  useEffect(() => { setQuery(value) }, [value])

  const handleChange = (val: string) => {
    setQuery(val)
    clearTimeout(timer.current)
    if (!val.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetchFn(val)
      setResults(res)
      setOpen(true)
      setLoading(false)
    }, 300)
  }

  return (
    <div className="quotation-autocomplete">
      <input
        className="input"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => query && results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
      />
      {loading && (
        <div style={{ position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>
          ...
        </div>
      )}
      {open && (results.length > 0 || onAddNew) && (
        <div className="quotation-autocomplete-menu">
          {results.map((item, i) => (
            <div key={i} onMouseDown={() => { onSelect(item); setQuery(item.name); setOpen(false) }} className="quotation-autocomplete-option">
              {renderOption(item)}
            </div>
          ))}
          {onAddNew && (
            <div onMouseDown={onAddNew} className="quotation-autocomplete-create">
              + {addNewLabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuotationsPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const [quotations, setQuotations] = useState<QuotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<QuotItem | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }])

  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '' })
  const [addingCust, setAddingCust] = useState(false)

  const [addProductOpen, setAddProductOpen] = useState(false)
  const [newProd, setNewProd] = useState({ name: '', sale_price: '', sku: '' })
  const [addingProd, setAddingProd] = useState(false)
  const [addProdLineIdx, setAddProdLineIdx] = useState(0)

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchQuotations = async () => {
    setLoading(true)
    const p = new URLSearchParams({
      page: String(page),
      per_page: '15',
      ...(search && { search }),
      ...(filterStatus && { status: filterStatus }),
      ...(filterDateFrom && { date_from: filterDateFrom }),
      ...(filterDateTo && { date_to: filterDateTo }),
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

  const hasActiveFilters = !!(filterStatus || filterDateFrom || filterDateTo || search)

  const fetchCustomers = async (q: string): Promise<Customer[]> => {
    const res = await api.get(`/customers?search=${encodeURIComponent(q)}&per_page=10`)
    return res.data?.data ?? res.data ?? []
  }

  const fetchProducts = async (q: string): Promise<Product[]> => {
    const res = await api.get(`/products?search=${encodeURIComponent(q)}&per_page=10`)
    return res.data?.data ?? res.data ?? []
  }

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
        name: prod.name,
        price: prod.sale_price ?? prod.price ?? 0,
      }
      return arr
    })
  }

  const removeLine = (i: number) => setLines(p => p.filter((_, idx) => idx !== i))

  const lineNet = (l: LineItem) => l.qty * l.price - (l.discount ?? 0)
  const grandTotal = () => lines.reduce((s, l) => s + lineNet(l), 0)

  const resetForm = () => {
    setSelectedCustomer(null)
    setCustomerQuery('')
    setNotes('')
    setValidUntil('')
    setLines([{ ...EMPTY_LINE }])
    setErrors({})
    setEditing(null)
  }

  const openAdd = () => {
    resetForm()
    setModalOpen(true)
  }

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
            name: i.product?.name ?? i.name ?? '',
            qty: i.quantity ?? i.qty ?? 1,
            price: Number(i.unit_price ?? i.price ?? 0),
            discount: Number(i.discount ?? 0),
          }))
        : [{ ...EMPTY_LINE }]
    )
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!editing) {
      if (!lines.length || lines.every(l => !l.product_id)) {
        e.items = ar ? 'أضف عنصراً واحداً على الأقل' : 'Add at least one item'
      }
      lines.forEach((l, i) => {
        if (!l.product_id) e[`item_${i}`] = ar ? 'اختر منتج' : 'Select product'
        if (l.qty <= 0) e[`qty_${i}`] = ar ? 'كمية غير صحيحة' : 'Invalid qty'
      })
    }
    setErrors(e)
    return !Object.keys(e).length
  }

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
        qty: l.qty,
        price: l.price,
        discount: l.discount ?? 0,
      })),
    }

    const res = editing
      ? await api.put(`/quotations/${editing.id}`, { notes, customer_id: payload.customer_id, valid_until: payload.valid_until })
      : await api.post('/quotations', payload)

    setSaving(false)
    if (res.error) {
      flash(res.error, false)
      return
    }

    flash(ar ? (editing ? 'تم التحديث ✓' : 'تم إنشاء العرض ✓') : (editing ? 'Updated ✓' : 'Created ✓'))
    setModalOpen(false)
    resetForm()
    fetchQuotations()
  }

  const handleDelete = async (q: QuotItem) => {
    if (!confirm(ar ? `حذف عرض "${q.invoice_number}"؟` : `Delete "${q.invoice_number}"?`)) return
    const res = await api.delete(`/quotations/${q.id}`)
    if (res.error) {
      flash(res.error, false)
      return
    }
    flash(ar ? 'تم الحذف' : 'Deleted')
    fetchQuotations()
  }

  const handleConvert = async (q: QuotItem) => {
    if (!confirm(ar ? `تحويل العرض "${q.invoice_number}" إلى فاتورة مبيعات؟` : `Convert "${q.invoice_number}" to invoice?`)) return
    setConverting(q.id)
    const res = await api.post(`/quotations/${q.id}/convert`, {})
    setConverting(null)
    if (res.error) {
      flash(res.error, false)
      return
    }
    flash(ar ? 'تم التحويل إلى فاتورة ✓' : 'Converted to invoice ✓')
    fetchQuotations()
  }

  const handleChangeStatus = async (id: number, newStatus: string) => {
    const res = await api.put(`/quotations/${id}`, { status: newStatus })
    if (res.error) {
      flash(res.error, false)
      return
    }
    flash(ar ? 'تم تغيير الحالة ✓' : 'Status updated ✓')
    fetchQuotations()
  }

  const handleAddCustomer = async () => {
    if (!newCust.name.trim()) return
    setAddingCust(true)
    const res = await api.post('/customers', newCust)
    setAddingCust(false)
    if (res.error) {
      flash(res.error, false)
      return
    }
    const c: Customer = res.data?.data ?? res.data
    setSelectedCustomer(c)
    setCustomerQuery(c.name)
    setAddCustomerOpen(false)
    setNewCust({ name: '', phone: '', email: '' })
    flash(ar ? 'تم إضافة العميل ✓' : 'Customer added ✓')
  }

  const handleAddProduct = async () => {
    if (!newProd.name.trim()) return
    setAddingProd(true)
    const res = await api.post('/products', {
      name: newProd.name,
      sale_price: Number(newProd.sale_price) || 0,
      sku: newProd.sku || undefined,
    })
    setAddingProd(false)
    if (res.error) {
      flash(res.error, false)
      return
    }
    const p: Product = res.data?.data ?? res.data
    selectProduct(addProdLineIdx, p)
    setAddProductOpen(false)
    setNewProd({ name: '', sale_price: '', sku: '' })
    flash(ar ? 'تم إضافة المنتج ✓' : 'Product added ✓')
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n ?? 0)

  const canEdit = (status: string) => ['quotation', 'sent'].includes(status)
  const statusBadgeClass = (status: string) => ({
    quotation: 'badge-primary',
    sent: 'badge-info',
    confirmed: 'badge-success',
    cancelled: 'badge-danger',
    converted: 'badge-muted',
  }[status] || 'badge-muted')

  const expiredCount = quotations.filter(q => q.valid_until && new Date(q.valid_until) < new Date()).length
  const convertibleCount = quotations.filter(q => canEdit(q.status)).length

  return (
    <ERPLayout pageTitle={ar ? 'عروض الأسعار' : 'Quotations'}>
      <div className="quotations-page">
        {toast && (
          <div className={`quotation-toast ${toast.ok ? 'ok' : 'error'}`}>{toast.msg}</div>
        )}

        <div className="quotations-hero">
          <div>
            <h2>{ar ? 'عروض الأسعار' : 'Quotations'}</h2>
            <p>{ar ? `الإجمالي: ${total} عرض` : `Total: ${total} quotations`}</p>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            + {ar ? 'عرض سعر جديد' : 'New Quotation'}
          </button>
        </div>

        <div className="quotations-stats">
          {[
            { label: ar ? 'كل العروض' : 'All Quotations', value: total },
            { label: ar ? 'قابلة للتحويل' : 'Ready To Convert', value: convertibleCount },
            { label: ar ? 'منتهية الصلاحية' : 'Expired', value: expiredCount },
          ].map(card => (
            <div key={card.label} className="stat-card">
              <div>
                <div className="quotations-stat-value">{card.value}</div>
                <div className="quotations-stat-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card quotations-filter-card">
          <div className="quotations-filter-grid">
            <div className="input-group">
              <label className="input-label">{ar ? 'بحث' : 'Search'}</label>
              <input
                className="input"
                type="text"
                placeholder={ar ? 'رقم العرض أو اسم العميل...' : 'Number or customer...'}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            <div className="input-group">
              <label className="input-label">{ar ? 'الحالة' : 'Status'}</label>
              <select className="input" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
                <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
                <option value="quotation">{ar ? 'عرض سعر' : 'Quotation'}</option>
                <option value="sent">{ar ? 'تم الإرسال' : 'Sent'}</option>
                <option value="confirmed">{ar ? 'مؤكد' : 'Confirmed'}</option>
                <option value="cancelled">{ar ? 'ملغي' : 'Cancelled'}</option>
                <option value="converted">{ar ? 'محوّل' : 'Converted'}</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">{ar ? 'من تاريخ' : 'Date From'}</label>
              <input className="input" type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }} />
            </div>

            <div className="input-group">
              <label className="input-label">{ar ? 'إلى تاريخ' : 'Date To'}</label>
              <input className="input" type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1) }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={resetFilters} className="btn btn-secondary" disabled={!hasActiveFilters}>
                {ar ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="quotations-chips" style={{ marginTop: '0.9rem' }}>
              {filterStatus && (
                <span className="quotations-chip status">
                  {ar ? 'الحالة: ' : 'Status: '}
                  {ar ? STATUS_CONFIG[filterStatus]?.labelAr : STATUS_CONFIG[filterStatus]?.labelEn}
                </span>
              )}
              {filterDateFrom && (
                <span className="quotations-chip date">{ar ? 'من: ' : 'From: '}{filterDateFrom}</span>
              )}
              {filterDateTo && (
                <span className="quotations-chip date">{ar ? 'إلى: ' : 'To: '}{filterDateTo}</span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 46 }} />)}
            </div>
          </div>
        ) : quotations.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">{ar ? 'لا توجد عروض أسعار' : 'No quotations found'}</div>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="btn btn-primary" style={{ marginTop: 12 }}>
                {ar ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{ar ? 'رقم العرض' : 'Number'}</th>
                    <th>{ar ? 'العميل' : 'Customer'}</th>
                    <th>{ar ? 'الإجمالي' : 'Total'}</th>
                    <th>{ar ? 'صالح حتى' : 'Valid Until'}</th>
                    <th>{ar ? 'التاريخ' : 'Date'}</th>
                    <th>{ar ? 'الحالة' : 'Status'}</th>
                    <th>{ar ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map(q => {
                    const cfg = getStatusCfg(q.status, ar)
                    const isExpired = !!(q.valid_until && new Date(q.valid_until) < new Date())

                    return (
                      <tr key={q.id}>
                        <td className="quotation-number">{q.invoice_number}</td>
                        <td>
                          {q.customer ? (
                            <div className="quotation-customer">
                              <div className="quotation-customer-name">{q.customer.name}</div>
                              {q.customer.phone && <div className="quotation-customer-sub">{q.customer.phone}</div>}
                            </div>
                          ) : (
                            <div className="text-muted">{ar ? '— عميل نقدي —' : '— Walk-in —'}</div>
                          )}
                        </td>
                        <td className="quotation-total">{fmt(q.total)}</td>
                        <td>
                          {q.valid_until ? (
                            <span className={`quotation-validity ${isExpired ? 'expired' : ''}`}>
                              {new Date(q.valid_until).toLocaleDateString()}
                              {isExpired ? ` ${ar ? 'منتهي' : 'Expired'}` : ''}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-muted">{new Date(q.created_at).toLocaleDateString()}</td>
                        <td><span className={`badge ${statusBadgeClass(q.status)}`}>{cfg.label}</span></td>
                        <td>
                          <div className="quotation-actions">
                            <button onClick={() => printQuotation(q, ar)} className="btn btn-secondary btn-sm">
                              {ar ? 'طباعة' : 'Print'}
                            </button>

                            {canEdit(q.status) && (
                              <>
                                <button onClick={() => openEdit(q)} className="btn btn-secondary btn-sm">
                                  {ar ? 'تعديل' : 'Edit'}
                                </button>

                                <select className="input" value={q.status} onChange={e => handleChangeStatus(q.id, e.target.value)}>
                                  <option value="quotation">{ar ? 'عرض سعر' : 'Quotation'}</option>
                                  <option value="sent">{ar ? 'تم الإرسال' : 'Sent'}</option>
                                  <option value="confirmed">{ar ? 'مؤكد' : 'Confirmed'}</option>
                                  <option value="cancelled">{ar ? 'ملغي' : 'Cancelled'}</option>
                                </select>

                                <button onClick={() => handleConvert(q)} disabled={converting === q.id} className="btn btn-primary btn-sm">
                                  {converting === q.id ? (ar ? 'جاري التحويل...' : 'Converting...') : (ar ? 'تحويل' : 'Convert')}
                                </button>

                                <button onClick={() => handleDelete(q)} className="btn btn-danger btn-sm">
                                  {ar ? 'حذف' : 'Delete'}
                                </button>
                              </>
                            )}

                            {!canEdit(q.status) && q.status !== 'converted' && (
                              <span className="text-muted">{cfg.label}</span>
                            )}

                            {q.status === 'converted' && (
                              <span className="text-muted">{ar ? 'تم التحويل' : 'Converted'}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {total > 15 && (
          <div className="quotation-pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary">
              {ar ? 'السابق' : 'Prev'}
            </button>
            <span className="quotation-page-badge">{page}</span>
            <button disabled={quotations.length < 15} onClick={() => setPage(p => p + 1)} className="btn btn-secondary">
              {ar ? 'التالي' : 'Next'}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            النافذة المنبثقة: إنشاء/تعديل عرض سعر 
            استخدام ستايل مباشر مطابق لصفحة الـ Sales لضمان الظهور
        ══════════════════════════════════════════════════════════ */}
        {modalOpen && isMounted && createPortal(
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => { setModalOpen(false); resetForm() }}>
            <div style={{ maxWidth: 820, width: '95%', background: 'var(--bg-card, #242424)', color: 'var(--text-color, #fff)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color, #333)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{editing ? (ar ? 'تعديل عرض السعر' : 'Edit Quotation') : (ar ? 'عرض سعر جديد' : 'New Quotation')}</h3>
                </div>
                <button type="button" onClick={() => { setModalOpen(false); resetForm() }} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleSubmit} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="modal-body" style={{ padding: '1rem', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>{ar ? 'العميل' : 'Customer'}</label>
                        <button type="button" onClick={() => setAddCustomerOpen(true)} className="btn btn-secondary btn-sm">
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
                            <div className="fw-semibold">{c.name}</div>
                            {c.phone && <div className="quotation-customer-sub" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</div>}
                          </div>
                        )}
                        onAddNew={() => setAddCustomerOpen(true)}
                        addNewLabel={ar ? 'إضافة عميل جديد' : 'Add new customer'}
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ marginBottom: '0.45rem' }}>{ar ? 'صالح حتى' : 'Valid Until'}</label>
                      <input className="input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                    </div>
                  </div>

                  {!editing && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>{ar ? 'العناصر *' : 'Items *'}</label>
                        <button type="button" onClick={addLine} className="btn btn-secondary btn-sm">
                          + {ar ? 'إضافة عنصر' : 'Add Item'}
                        </button>
                      </div>

                      {errors.items && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{errors.items}</p>}

                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2.5fr) 90px 110px 100px 40px', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                        {[ar ? 'المنتج' : 'Product', ar ? 'كمية' : 'Qty', ar ? 'سعر' : 'Price', ar ? 'خصم' : 'Discount', ''].map((h, i) => (
                          <div key={i}>{h}</div>
                        ))}
                      </div>

                      {lines.map((line, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2.5fr) 90px 110px 100px 40px', gap: '0.5rem', alignItems: 'start' }}>
                          <div>
                            <Autocomplete
                              placeholder={ar ? 'ابحث عن منتج...' : 'Search product...'}
                              value={line.name}
                              onSelect={(p: Product) => selectProduct(i, p)}
                              fetchFn={fetchProducts}
                              renderOption={(p: Product) => (
                                <div>
                                  <div className="fw-semibold">{p.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {p.sku ? `${p.sku} ` : ''}
                                    {p.sale_price !== undefined ? fmt(p.sale_price) : ''}
                                  </div>
                                </div>
                              )}
                              onAddNew={() => { setAddProdLineIdx(i); setAddProductOpen(true) }}
                              addNewLabel={ar ? 'إضافة منتج جديد' : 'Add new product'}
                            />
                            {errors[`item_${i}`] && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: 4 }}>{errors[`item_${i}`]}</p>}
                          </div>

                          <input className="input" type="number" min="0.001" step="0.001" value={line.qty} onChange={e => updateLine(i, 'qty', Number(e.target.value))} />
                          <input className="input" type="number" min="0" step="0.01" value={line.price} onChange={e => updateLine(i, 'price', Number(e.target.value))} />
                          <input className="input" type="number" min="0" step="0.01" value={line.discount} onChange={e => updateLine(i, 'discount', Number(e.target.value))} placeholder="0" />
                          <button type="button" onClick={() => removeLine(i)} className="btn btn-danger btn-sm" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>×</button>
                        </div>
                      ))}

                      {lines.length > 0 && (
                        <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color, #333)', borderRadius: 8, background: 'var(--bg-hover, #2a2a2a)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, marginTop: '0.5rem' }}>
                          <span>{ar ? 'الإجمالي' : 'Total'}</span>
                          <span>{fmt(grandTotal())}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="input-group" style={{ marginTop: '1.5rem' }}>
                    <label className="input-label">{ar ? 'ملاحظات / الشروط والأحكام' : 'Notes / Terms & Conditions'}</label>
                    <textarea
                      className="input"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      style={{ resize: 'vertical' }}
                      placeholder={ar ? 'شروط الدفع، صلاحية العرض، ملاحظات أخرى...' : 'Payment terms, validity, other notes...'}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border-color, #333)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexShrink: 0 }}>
                  <button type="button" onClick={() => { setModalOpen(false); resetForm() }} className="btn btn-secondary">
                    {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'حفظ العرض' : 'Save Quotation')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════
            النافذة المنبثقة: إضافة عميل جديد 
        ══════════════════════════════════════════════════════════ */}
        {addCustomerOpen && isMounted && createPortal(
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setAddCustomerOpen(false)}>
            <div style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #242424)', color: 'var(--text-color, #fff)', borderRadius: 8, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color, #333)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{ar ? 'إضافة عميل جديد' : 'Add New Customer'}</h3>
                <button onClick={() => setAddCustomerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input className="input" placeholder={ar ? 'الاسم *' : 'Name *'} value={newCust.name} onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))} autoFocus />
                <input className="input" placeholder={ar ? 'الهاتف' : 'Phone'} value={newCust.phone} onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))} />
                <input className="input" placeholder={ar ? 'البريد الإلكتروني' : 'Email'} type="email" value={newCust.email} onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color, #333)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setAddCustomerOpen(false)} className="btn btn-secondary">
                  {ar ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handleAddCustomer} disabled={addingCust || !newCust.name.trim()} className="btn btn-primary">
                  {addingCust ? '...' : (ar ? 'حفظ العميل' : 'Save Customer')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════
            النافذة المنبثقة: إضافة منتج جديد
        ══════════════════════════════════════════════════════════ */}
        {addProductOpen && isMounted && createPortal(
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setAddProductOpen(false)}>
            <div style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #242424)', color: 'var(--text-color, #fff)', borderRadius: 8, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color, #333)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{ar ? 'إضافة منتج جديد' : 'Add New Product'}</h3>
                <button onClick={() => setAddProductOpen(false)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input className="input" placeholder={ar ? 'اسم المنتج *' : 'Product Name *'} value={newProd.name} onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))} autoFocus />
                <input className="input" placeholder={ar ? 'سعر البيع' : 'Sale Price'} type="number" min="0" step="0.01" value={newProd.sale_price} onChange={e => setNewProd(p => ({ ...p, sale_price: e.target.value }))} />
                <input className="input" placeholder={ar ? 'كود المنتج (اختياري)' : 'SKU (optional)'} value={newProd.sku} onChange={e => setNewProd(p => ({ ...p, sku: e.target.value }))} />
              </div>
              <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color, #333)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setAddProductOpen(false)} className="btn btn-secondary">
                  {ar ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handleAddProduct} disabled={addingProd || !newProd.name.trim()} className="btn btn-primary">
                  {addingProd ? '...' : (ar ? 'حفظ المنتج' : 'Save Product')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </ERPLayout>
  )
}