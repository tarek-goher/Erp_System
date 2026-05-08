'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui'
import { useI18n } from '../../lib/i18n'

type Sale = {
  id: number
  invoice_number: string
  customer?: { id: number; name: string }
  total: number
  subtotal?: number
  tax?: number
  discount?: number
  status: string
  payment_method?: string
  notes?: string
  created_at: string
}

type Customer = { id: number; name: string }

type Stats = {
  total_sales: number
  total_amount: number
  paid_amount: number
  unpaid_amount: number
  draft_count?: number
  pending_count?: number
}

const STATUSES = ['draft', 'pending', 'completed', 'cancelled', 'refunded']

const PAYMENT_METHODS = [
  { value: 'cash',          label_ar: 'نقدي',         label_en: 'Cash' },
  { value: 'card',          label_ar: 'بطاقة بنكية',  label_en: 'Card' },
  { value: 'bank_transfer', label_ar: 'تحويل بنكي',   label_en: 'Bank Transfer' },
  { value: 'credit',        label_ar: 'آجل (دين)',     label_en: 'Credit' },
]

type SaleItem = {
  product_id:   string
  name:         string
  qty:          number
  unit_price:   number
  warehouse_id: string
  discount:     number
  max_qty?:     number
  cost_price?:  number
}

function ProductSearchInput({
  value,
  products,
  warehouses,
  lang,
  onChange,
}: {
  value: SaleItem
  products: { id: number; name: string; price?: number; sell_price?: number; qty?: number; cost?: number }[]
  warehouses: { id: number; name: string }[]
  lang: string
  onChange: (field: string, val: any) => void
}) {
  const [query,     setQuery]     = useState(value.name || '')
  const [open,      setOpen]      = useState(false)
  const [focused,   setFocused]   = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value.name || '') }, [value.name])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.trim().length === 0
    ? products.slice(0, 8)
    : products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)

const handleSelect = (p: typeof products[0]) => {
  onChange('product_id', String(p.id))
  onChange('name',       p.name)
  onChange('unit_price', p.sell_price ?? p.price ?? 0)
  onChange('qty',        1)
  onChange('max_qty',    p.qty ?? 0)
  onChange('cost_price', p.cost ?? 0)
  onChange('warehouse_id', warehouses[0] ? String(warehouses[0].id) : '')
  setQuery(p.name)
  setOpen(false)
  setFocused(false)
}

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setOpen(true)
    if (!e.target.value) {
      onChange('product_id', '')
      onChange('name',       '')
      onChange('unit_price', 0)
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="input"
        placeholder={lang === 'ar' ? 'ابحث عن منتج...' : 'Search product...'}
        value={query}
        onChange={handleInput}
        onFocus={() => { setOpen(true); setFocused(true) }}
        autoComplete="off"
        style={{
          borderColor: value.product_id ? 'var(--color-success, #16a34a)' : undefined,
        }}
      />
      {value.product_id && (
        <span style={{
          position: 'absolute',
          insetInlineEnd: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-success, #16a34a)',
          fontSize: 12,
          pointerEvents: 'none',
        }}><i className="fas fa-check"></i></span>
      )}
      {open && focused && filtered.length > 0 && (
        <div style={{
          position:     'absolute',
          top:          '100%',
          insetInlineStart: 0,
          insetInlineEnd:   0,
          background:   'var(--bg-card, #fff)',
          border:       '1px solid var(--border-color, #e5e7eb)',
          borderRadius: 'var(--radius-md, 8px)',
          boxShadow:    '0 8px 24px rgba(0,0,0,0.12)',
          zIndex:       999,
          maxHeight:    220,
          overflowY:    'auto',
        }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onMouseDown={() => handleSelect(p)}
              style={{
                padding:    '8px 12px',
                cursor:     'pointer',
                display:    'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize:   13,
                borderBottom: '1px solid var(--border-color, #f3f4f6)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover, #f9fafb)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span>{p.name}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 12 }}>
                  {new Intl.NumberFormat().format(p.sell_price || p.price || 0)}
                </span>
                <span style={{ color: (p.qty ?? 0) > 0 ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)', fontSize: 11 }}>
                  {lang === 'ar' ? `المخزون: ${p.qty ?? 0}` : `Stock: ${p.qty ?? 0}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SalesPage() {
  const { show, toasts, remove } = useToast()
  const { t, lang } = useI18n()

  const [isMounted, setIsMounted] = useState(false)

  const [sales,     setSales]     = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading,   setLoading]   = useState(true)
  const [total,     setTotal]     = useState(0)
  const [stats,     setStats]     = useState<Stats | null>(null)

  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dateFrom,       setDateFrom]       = useState('')
  const [dateTo,         setDateTo]         = useState('')
  const [page,           setPage]           = useState(1)
  const [showFilters,    setShowFilters]    = useState(false)

  const [modalOpen,      setModalOpen]      = useState(false)
  const [exportLoading,  setExportLoading]  = useState(false)

  const [editId,      setEditId]      = useState<number | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const [form, setForm] = useState({
    customer_id:    '',
    notes:          '',
    status:         'confirmed',
    tax_rate_id:    '',
    payment_method: 'cash',
    discount:       0,
    due_date:       '',
  })
  const [formError,   setFormError]   = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [taxRates,    setTaxRates]    = useState<{id:number;name:string;rate:number}[]>([])
  const [products,    setProducts]    = useState<{id:number;name:string;price?:number;sell_price?:number;qty?:number;cost?:number}[]>([])
  const [warehouses,  setWarehouses]  = useState<{id:number;name:string}[]>([])

  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    { product_id: '', name: '', qty: 1, unit_price: 0, warehouse_id: '', discount: 0 }
  ])

  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomerName,  setNewCustomerName]  = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [addingCustomer,   setAddingCustomer]   = useState(false)
  const [addCustomerErr,   setAddCustomerErr]   = useState('')

  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchStats = async () => {
    const res = await api.get<Stats>('/sales/stats')
    if (res.data) setStats(res.data as any)
  }

  const fetchSales = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page:     String(page),
      per_page: '15',
      ...(search         && { search }),
      ...(statusFilter   && { status: statusFilter }),
      ...(customerFilter && { customer_id: customerFilter }),
      ...(dateFrom       && { from: dateFrom }),
      ...(dateTo         && { to: dateTo }),
    })
    const res = await api.get<{ data: Sale[]; total: number }>(`/sales?${params}`)
    if (res.data) {
      setSales(extractArray(res.data))
      setTotal(res.data.total || 0)
    }
    setLoading(false)
  }

  const fetchCustomers = async () => {
    const res = await api.get<{ data: Customer[] }>('/customers?per_page=200')
    if (res.data) setCustomers(extractArray(res.data))
  }

  useEffect(() => { fetchSales() }, [page, search, statusFilter, customerFilter, dateFrom, dateTo])

  useEffect(() => {
    setIsMounted(true)
    fetchStats()
    fetchCustomers()
    api.get<any>('/tax-rates').then(r => { if (r.data) setTaxRates(extractArray(r.data)) })
    api.get<any>('/products?per_page=200').then(r => { if (r.data) setProducts(extractArray(r.data)) })
    api.get<any>('/warehouses').then(r => { if (r.data) setWarehouses(r.data.data ?? r.data) })
  }, [])

  const handleExport = async () => {
    setExportLoading(true)
    const params = new URLSearchParams({
      format: 'excel',
      ...(statusFilter   && { status: statusFilter }),
      ...(customerFilter && { customer_id: customerFilter }),
      ...(dateFrom       && { from: dateFrom }),
      ...(dateTo         && { to: dateTo }),
      ...(search         && { search }),
    })
    try {
      const token = localStorage.getItem('erp_token') || ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/export/sales?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `sales-export-${new Date().toISOString().slice(0,10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      show(lang === 'ar' ? 'تم تصدير الملف' : 'File exported')
    } catch {
      show(lang === 'ar' ? 'فشل التصدير' : 'Export failed', 'error')
    }
    setExportLoading(false)
  }

  const handleEdit = async (sale: Sale) => {
    setEditLoading(true)
    setEditId(sale.id)
    setModalOpen(true)

    const res = await api.get<any>(`/sales/${sale.id}`)
    const s   = res.data?.data ?? res.data ?? sale

    setForm({
      customer_id:    String(s.customer?.id || sale.customer?.id || ''),
      notes:          s.notes          || '',
      status:         s.status         || 'draft',
      tax_rate_id:    String(s.tax_rate_id || ''),
      payment_method: s.payment_method || 'cash',
      discount:       Number(s.discount || 0),
      due_date:       s.due_date ? String(s.due_date).slice(0, 10) : '',
    })

    if (s.items?.length > 0) {
      setSaleItems(
        s.items.map((i: any) => ({
          product_id:   String(i.product?.id || i.product_id || ''),
          name:         i.product?.name || '',
          qty:          Number(i.quantity || i.qty || 0),
          unit_price:   Number(i.unit_price || 0),
          warehouse_id: String(i.warehouse?.id || i.warehouse_id || ''),
          discount:     Number(i.discount || 0),
        }))
      )
    }

    setEditLoading(false)
  }

  const handleAddCustomer = async (e: FormEvent) => {
    e.preventDefault()
    setAddCustomerErr('')
    if (!newCustomerName.trim()) {
      setAddCustomerErr(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required')
      return
    }
    setAddingCustomer(true)
    const res = await api.post('/customers', {
      name:  newCustomerName.trim(),
      email: newCustomerEmail.trim() || undefined,
      phone: newCustomerPhone.trim() || undefined,
    })
    setAddingCustomer(false)
    if (res.error) { setAddCustomerErr(res.error); return }
    const newC: Customer = { id: res.data?.data?.id || res.data?.id, name: newCustomerName.trim() }
    setCustomers(prev => [...prev, newC])
    setForm(prev => ({ ...prev, customer_id: String(newC.id) }))
    setShowAddCustomer(false)
    setNewCustomerName(''); setNewCustomerEmail(''); setNewCustomerPhone('')
  }

  const addSaleItem = () =>
    setSaleItems(prev => [...prev, { product_id: '', name: '', qty: 1, unit_price: 0, warehouse_id: '', discount: 0 }])

  const removeSaleItem = (idx: number) =>
    setSaleItems(prev => prev.filter((_, i) => i !== idx))

  const updateSaleItem = (idx: number, field: string, val: any) => {
    setSaleItems(prev => {
      const arr = [...prev]
      arr[idx] = { ...arr[idx], [field]: val }
      return arr
    })
  }

  const saleSubtotal = saleItems.reduce((s, i) => {
    const lineTotal   = i.qty * i.unit_price
    const lineDiscount = (lineTotal * (i.discount || 0)) / 100
    return s + (lineTotal - lineDiscount)
  }, 0)
  const invoiceDiscount = editId
    ? Number(form.discount)
    : (saleSubtotal * (form.discount || 0)) / 100
  const afterDiscount   = saleSubtotal - invoiceDiscount
  const selectedSaleTax = taxRates.find(tx => String(tx.id) === form.tax_rate_id)
  const saleTaxAmount   = selectedSaleTax ? (afterDiscount * selectedSaleTax.rate) / 100 : 0
  const saleTotal       = afterDiscount + saleTaxAmount

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.customer_id) {
      setFormError(lang === 'ar' ? 'يجب اختيار العميل' : 'Customer is required')
      return
    }

    setFormLoading(true)
    try {
      if (editId) {
        const payload: Record<string, any> = {
          customer_id:    Number(form.customer_id),
          status:         form.status,
          payment_method: form.payment_method,
          notes:          form.notes,
        }
        if (form.discount !== undefined) payload.discount = Number(form.discount)

        const res = await api.put(`/sales/${editId}`, payload)
        if (res.error) { show(res.error, 'error'); return }
        show(lang === 'ar' ? 'تم تعديل الفاتورة' : 'Sale updated')
        setModalOpen(false)
        resetForm()
        fetchSales()
        fetchStats()
        return
      }

      const validItems = saleItems.filter(i => i.product_id && i.qty > 0)

      if (validItems.length === 0) {
        setFormError(lang === 'ar' ? 'أضف منتجاً واحداً على الأقل' : 'Add at least one item')
        return
      }

      const res = await api.post('/sales', {
        customer_id:    Number(form.customer_id),
        notes:          form.notes,
        status:         form.status,
        payment_method: form.payment_method || 'cash',
        discount:       form.discount || 0,
        due_date:       form.due_date || undefined,
        items: validItems.map(i => ({
          product_id:   Number(i.product_id),
          qty:          i.qty,
          unit_price:   i.unit_price,
          discount:     i.discount || 0,
          warehouse_id: i.warehouse_id ? Number(i.warehouse_id) : null,
        })),
        ...(form.tax_rate_id && { tax_rate_id: Number(form.tax_rate_id) }),
      })
      if (res.error) { show(res.error, 'error'); return }
      show(lang === 'ar' ? 'تم تسجيل عملية البيع' : 'Sale created')
      setModalOpen(false)
      resetForm()
      fetchSales()
      fetchStats()
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setEditId(null)
    setForm({ customer_id: '', notes: '', status: 'completed', tax_rate_id: '', payment_method: 'cash', discount: 0, due_date: '' })
    setSaleItems([{ product_id: '', name: '', qty: 1, unit_price: 0, warehouse_id: '', discount: 0 }])
    setShowAddCustomer(false)
    setFormError('')
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await api.delete(`/sales/${deleteId}`)
    setDeleteId(null)
    if (res.error) { show(res.error, 'error'); return }
    setSales(prev => prev.filter(s => s.id !== deleteId))
    fetchStats()
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')

  const statusBadge = (s: string) => ({
    completed: 'badge-success',
    paid:      'badge-success',
    pending:   'badge-warning',
    draft:     'badge-muted',
    cancelled: 'badge-danger',
    refunded:  'badge-danger',
  }[s] || 'badge-muted')

  const paymentLabel = (m?: string) =>
    PAYMENT_METHODS.find(p => p.value === m)?.[lang === 'ar' ? 'label_ar' : 'label_en'] || m || '—'

  const n = (v: any) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(Number(v) || 0)

  const canEdit = (status: string) => !['cancelled', 'refunded'].includes(status)

  return (
    <ERPLayout pageTitle={t('sales')}>
      <ToastContainer toasts={toasts} remove={remove} />

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {lang === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{n(stats.total_sales)}</div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {lang === 'ar' ? 'إجمالي المبيعات' : 'Total Amount'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{n(stats.total_amount)}</div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {lang === 'ar' ? 'المحصّل' : 'Paid'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{n(stats.paid_amount)}</div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {lang === 'ar' ? 'غير محصّل' : 'Unpaid'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)' }}>{n(stats.unpaid_amount)}</div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span><i className="fas fa-search"></i></span>
            <input
              placeholder={lang === 'ar' ? 'بحث في المبيعات...' : 'Search sales...'}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            className="input" style={{ width: 'auto' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
            <><i className="fas fa-chevron-down"></i> {lang === 'ar' ? 'فلاتر' : 'Filters'}</>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exportLoading}>
            {exportLoading ? <><i className="fas fa-spinner fa-spin"></i>...</> : <><i className="fas fa-file-export"></i> {lang === 'ar' ? 'Excel' : 'Export Excel'}</>}
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setModalOpen(true) }}>
            <><i className="fas fa-plus"></i> {lang === 'ar' ? 'بيع جديد' : 'New Sale'}</>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', alignItems: 'end' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">{lang === 'ar' ? 'العميل' : 'Customer'}</label>
              <select className="input" value={customerFilter} onChange={e => { setCustomerFilter(e.target.value); setPage(1) }}>
                <option value="">{lang === 'ar' ? 'كل العملاء' : 'All Customers'}</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">{lang === 'ar' ? 'من تاريخ' : 'From Date'}</label>
              <input className="input" type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">{lang === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
              <input className="input" type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              setCustomerFilter(''); setDateFrom(''); setDateTo('')
              setStatusFilter(''); setSearch(''); setPage(1)
            }}>
              <><i className="fas fa-trash"></i> {lang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}</>
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="fas fa-money-bill-wave"></i></div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('customer')}</th>
                  <th>{t('total')}</th>
                  <th>{lang === 'ar' ? 'الدفع' : 'Payment'}</th>
                  <th>{t('status')}</th>
                  <th>{t('date')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td>
                      <a href={`/sales/${sale.id}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>
                        {sale.invoice_number}
                      </a>
                    </td>
                    <td>{sale.customer?.name || '—'}</td>
                    <td className="fw-semibold">{fmt(sale.total)}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {paymentLabel(sale.payment_method)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(sale.status)}`}>
                        {t(sale.status) || sale.status}
                      </span>
                    </td>
                    <td className="text-muted">{fmtDate(sale.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <a href={`/sales/${sale.id}`} className="btn btn-secondary btn-sm">
                          {t('view')}
                        </a>
                        {canEdit(sale.status) && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEdit(sale)}
                            disabled={editLoading}
                          >
                            <><i className="fas fa-pen"></i> {lang === 'ar' ? 'تعديل' : 'Edit'}</>
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(sale.id)}>
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="sales-pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <><i className="fas fa-arrow-left"></i> {lang === 'ar' ? 'السابق' : 'Prev'}</>
            </button>
            <span className="text-muted">
              {lang === 'ar' ? `صفحة ${page} من ${Math.ceil(total / 15)}` : `Page ${page} of ${Math.ceil(total / 15)}`}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => p + 1)}
              disabled={sales.length < 15}
            >
              <>{lang === 'ar' ? 'التالي' : 'Next'} <i className="fas fa-arrow-right"></i></>
            </button>
          </div>
        )}
      </div>

      {modalOpen && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => { setModalOpen(false); resetForm() }}>
          <div style={{ maxWidth: 820, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editId
                  ? (lang === 'ar' ? <><i className="fas fa-pen"></i> تعديل الفاتورة</> : <><i className="fas fa-pen"></i> Edit Sale</>)
                  : (lang === 'ar' ? <><i className="fas fa-file-invoice"></i> بيع جديد</>       : <><i className="fas fa-file-invoice"></i> New Sale</>)
                }
              </h3>
              <button className="btn-icon" onClick={() => { setModalOpen(false); resetForm() }}><i className="fas fa-times"></i></button>
            </div>

            {editLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
                {lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading...'}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="modal-body" style={{ overflowY: 'auto' }}>
                  <div className="form-grid">

                    <div className="input-group">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>{t('customer')} *</label>
                        {!editId && (
                          <button
                            type="button"
                            onClick={() => { setShowAddCustomer(!showAddCustomer); setAddCustomerErr('') }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            {showAddCustomer
                              ? (lang === 'ar' ? <><i className="fas fa-arrow-left"></i> رجوع للقائمة</> : <><i className="fas fa-arrow-left"></i> Back to list</>)
                              : (lang === 'ar' ? <><i className="fas fa-user-plus"></i> عميل جديد</> : <><i className="fas fa-user-plus"></i> New Customer</>)}
                          </button>
                        )}
                      </div>
                      {showAddCustomer && !editId ? (
                        <div style={{ border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: 'var(--color-primary-light)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input className="input" placeholder={lang === 'ar' ? 'الاسم *' : 'Name *'} value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} autoFocus />
                            <input className="input" placeholder={lang === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'} type="email" value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} />
                            <input className="input" placeholder={lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'} value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                            {addCustomerErr && <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}><i className="fas fa-exclamation-triangle"></i> {addCustomerErr}</div>}
                            <button type="button" className="btn btn-primary btn-sm" onClick={handleAddCustomer} disabled={addingCustomer} style={{ alignSelf: 'flex-start' }}>
                              {addingCustomer ? <><i className="fas fa-spinner fa-spin"></i>...</> : (lang === 'ar' ? <><i className="fas fa-save"></i> حفظ العميل</> : <><i className="fas fa-save"></i> Save Customer</>)}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select className="input" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} required>
                          <option value="">{lang === 'ar' ? 'اختر العميل' : 'Select Customer'}</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="input-group">
                      <label className="input-label">{t('status')}</label>
                      <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                      <select className="input" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                        {PAYMENT_METHODS.map(m => (
                          <option key={m.value} value={m.value}>{lang === 'ar' ? m.label_ar : m.label_en}</option>
                        ))}
                      </select>
                    </div>

                    {!editId && (
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'تاريخ الاستحقاق (اختياري)' : 'Due Date (optional)'}</label>
                        <input className="input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                      </div>
                    )}

                    {!editId && (
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'الضريبة (اختياري)' : 'Tax Rate (optional)'}</label>
                        <select className="input" value={form.tax_rate_id} onChange={e => setForm({ ...form, tax_rate_id: e.target.value })}>
                          <option value="">{lang === 'ar' ? 'بدون ضريبة' : 'No Tax'}</option>
                          {taxRates.map(tx => <option key={tx.id} value={tx.id}>{tx.name} ({tx.rate}%)</option>)}
                        </select>
                      </div>
                    )}

                    <div className="input-group">
                      <label className="input-label">
                        {lang === 'ar' ? 'خصم على الفاتورة' : 'Invoice Discount'}
                        {editId
                          ? (lang === 'ar' ? ' (قيمة)' : ' (amount)')
                          : ' %'
                        }
                      </label>
                      <input
                        className="input" type="number" min="0" step="0.01"
                        placeholder="0"
                        value={form.discount || ''}
                        onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
                        readOnly={!!editId}
                        style={editId ? { background: 'var(--bg-hover)', cursor: 'not-allowed', opacity: 0.7 } : {}}
                      />
                      {editId && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {lang === 'ar' ? <><i className="fas fa-exclamation-triangle"></i> الخصم لا يمكن تغييره بعد الإنشاء</> : <><i className="fas fa-exclamation-triangle"></i> Discount cannot be changed after creation</>}
                        </div>
                      )}
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label className="fw-semibold">
                          {lang === 'ar' ? 'أصناف الفاتورة' : 'Invoice Items'}
                          {editId && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginInlineStart: 8 }}>
                              {lang === 'ar' ? '(للعرض فقط)' : '(read-only)'}
                            </span>
                          )}
                        </label>
                        {!editId && (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={addSaleItem}>
                            <><i className="fas fa-plus"></i> {lang === 'ar' ? 'صنف' : 'Add Item'}</>
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: editId ? '2fr 1.2fr 0.8fr 1fr 0.8fr' : '2fr 1.2fr 0.8fr 1fr 0.8fr auto', gap: 6, marginBottom: 4 }}>
                        {[
                          lang === 'ar' ? 'المنتج'   : 'Product',
                          lang === 'ar' ? 'المستودع' : 'Warehouse',
                          lang === 'ar' ? 'الكمية'   : 'Qty',
                          lang === 'ar' ? 'سعر البيع': 'Unit Price',
                          lang === 'ar' ? 'خصم %'    : 'Disc %',
                          ...(editId ? [] : ['']),
                        ].map((h, i) => (
                          <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {saleItems.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: editId ? '2fr 1.2fr 0.8fr 1fr 0.8fr' : '2fr 1.2fr 0.8fr 1fr 0.8fr auto',
                              gap: 6,
                              alignItems: 'center',
                              opacity: editId ? 0.75 : 1,
                            }}
                          >
                            {editId ? (
                              <div className="input" style={{ background: 'var(--bg-hover)', cursor: 'default', display: 'flex', alignItems: 'center' }}>
                                {item.name || '—'}
                              </div>
                            ) : (
                              <ProductSearchInput
                                value={item}
                                products={products}
                                warehouses={warehouses}
                                lang={lang}
                                onChange={(field, val) => updateSaleItem(idx, field, val)}
                              />
                            )}
                            <select
                              className="input"
                              value={item.warehouse_id}
                              onChange={e => updateSaleItem(idx, 'warehouse_id', e.target.value)}
                              disabled={!!editId}
                              style={editId ? { background: 'var(--bg-hover)', cursor: 'not-allowed' } : {}}
                            >
                              <option value="">{lang === 'ar' ? 'اختر مستودع' : 'Warehouse'}</option>
                              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <input
                              className="input" type="number" min="0.001" step="0.001"
                              value={item.qty}
                              onChange={e => updateSaleItem(idx, 'qty', Number(e.target.value))}
                              readOnly={!!editId}
                              style={editId ? { background: 'var(--bg-hover)', cursor: 'not-allowed' } : {}}
                            />
                            <input
                              className="input" type="number" min="0" step="0.01"
                              value={item.unit_price}
                              onChange={e => updateSaleItem(idx, 'unit_price', Number(e.target.value))}
                              readOnly={!!editId}
                              style={editId ? { background: 'var(--bg-hover)', cursor: 'not-allowed' } : {}}
                            />
                            <input
                              className="input" type="number" min="0" max="100" step="0.1"
                              placeholder="0"
                              value={item.discount || ''}
                              onChange={e => updateSaleItem(idx, 'discount', Number(e.target.value))}
                              readOnly={!!editId}
                              style={editId ? { background: 'var(--bg-hover)', cursor: 'not-allowed' } : {}}
                            />
                            {!editId && (
                              <button type="button" className="btn-icon" onClick={() => removeSaleItem(idx)} style={{ color: 'var(--color-danger)' }}><i className="fas fa-times"></i></button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <strong>{n(saleSubtotal)}</strong>
                        </div>
                        {(invoiceDiscount > 0) && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>
                            {lang === 'ar' ? 'الخصم:' : 'Discount:'} <strong>- {n(invoiceDiscount)}</strong>
                          </div>
                        )}
                        {selectedSaleTax && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {lang === 'ar' ? `ضريبة ${selectedSaleTax.rate}%:` : `Tax ${selectedSaleTax.rate}%:`} <strong>{n(saleTaxAmount)}</strong>
                          </div>
                        )}
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                          {lang === 'ar' ? 'الإجمالي:' : 'Total:'} {n(saleTotal)}
                        </div>
                      </div>
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label">{t('notes')}</label>
                      <textarea
                        className="input" rows={3}
                        placeholder={lang === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="login-error" style={{ marginTop: '1rem' }}>
                      <span><i className="fas fa-exclamation-triangle"></i></span> {formError}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm() }}>
                    {t('cancel')}
                  </button>
                  {!editId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={formLoading}
                      onClick={() => {
                        setForm(f => ({ ...f, status: 'draft' }))
                        setTimeout(() => { document.getElementById('submit-sale-btn')?.click() }, 50)
                      }}
                    >
                      {lang === 'ar' ? <><i className="fas fa-save"></i> حفظ مسودة</> : <><i className="fas fa-save"></i> Save Draft</>}
                    </button>
                  )}
                  <button
                    id="submit-sale-btn"
                    type="submit"
                    className="btn btn-primary"
                    disabled={formLoading || showAddCustomer}
                  >
                    {formLoading
                      ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('loading')}</>
                      : editId
                        ? (lang === 'ar' ? <><i className="fas fa-save"></i> حفظ التعديلات</> : <><i className="fas fa-save"></i> Save Changes</>)
                        : (lang === 'ar' ? <><i className="fas fa-check"></i> تأكيد البيع</>   : <><i className="fas fa-check"></i> Confirm Sale</>)
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {deleteId && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setDeleteId(null)}>
          <div style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}><i className="fas fa-trash"></i></div>
              <h3 style={{ marginBottom: '0.5rem' }}>{t('confirm_delete')}</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                {lang === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </ERPLayout>
  )
}