'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxOpen, faChevronLeft, faCircleExclamation, faEye,
  faMagnifyingGlass, faPenToSquare, faPlus, faSave, faTrash,
  faXmark, faFileExcel, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray, BASE_URL } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type PurchaseItem = {
  id: number
  product_id?: number
  product?: { id: number; name: string }
  qty: number
  cost: number
  total: number
  warehouse_id?: number
  warehouse?: { id: number; name: string }
}

type Purchase = {
  id: number
  order_number: string
  po_number?: string
  supplier?: { id: number; name: string }
  subtotal?: number
  tax?: number
  discount?: number
  total: number
  status: string
  created_at: string
  notes?: string
  expected_at?: string
  items?: PurchaseItem[]
}

type Stats = {
  total_orders: number
  total_amount: number
  received_amount: number
  pending_amount: number
}

type Supplier  = { id: number; name: string }
type TaxRate   = { id: number; name: string; rate: number }
type Product   = { id: number; name: string; cost?: number; purchase_price?: number }
type Warehouse = { id: number; name: string }

const STATUSES = ['draft', 'pending', 'approved', 'received', 'cancelled']
type OrderItem = { product_id: string; name: string; qty: number; cost: number; warehouse_id: string }

export default function PurchasesPage() {
  const { t, lang } = useI18n()
  const router = useRouter()

  const [items,         setItems]         = useState<Purchase[]>([])
  const [stats,         setStats]         = useState<Stats | null>(null)
  const [suppliers,     setSuppliers]     = useState<Supplier[]>([])
  const [taxRates,      setTaxRates]      = useState<TaxRate[]>([])
  const [products,      setProducts]      = useState<Product[]>([])
  const [warehouses,    setWarehouses]    = useState<Warehouse[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')
  const [modal,         setModal]         = useState(false)
  const [deleteId,      setDeleteId]      = useState<number | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [receiving,     setReceiving]     = useState<number | null>(null)
  const [formErr,       setFormErr]       = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [editId,        setEditId]        = useState<number | null>(null)
  const [editLoading,   setEditLoading]   = useState(false)

  const [showAddSupplier,  setShowAddSupplier]  = useState(false)
  const [newSupplierName,  setNewSupplierName]  = useState('')
  const [newSupplierEmail, setNewSupplierEmail] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [addingSupplier,   setAddingSupplier]   = useState(false)
  const [addSupplierErr,   setAddSupplierErr]   = useState('')
const [addProductIdx,    setAddProductIdx]    = useState<number | null>(null)
const [addingProduct,    setAddingProduct]    = useState(false)
const [addProductErr,    setAddProductErr]    = useState('')
const [newProduct, setNewProduct] = useState({
  name: '', sku: '', purchase_price: '', price: '', category_id: '',
  unit: '', qty: '', min_qty: '', warehouse_id: '', is_active: true,
})
const [categories, setCategories] = useState<{id: number; name: string}[]>([])
const [showNewCat, setShowNewCat] = useState(false)
const [newCatName, setNewCatName] = useState('')
const [savingCat,  setSavingCat]  = useState(false)
  const [form, setForm] = useState({
    supplier_id: '', status: 'draft', notes: '', tax_rate_id: '', expected_at: '',
  })
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { product_id: '', name: '', qty: 1, cost: 0, warehouse_id: '' }
  ])

  const resetForm = () => {
    setForm({ supplier_id: '', status: 'draft', notes: '', tax_rate_id: '', expected_at: '' })
    setOrderItems([{ product_id: '', name: '', qty: 1, cost: 0, warehouse_id: '' }])
    setShowAddSupplier(false)
    setFormErr('')
    setEditId(null)
  }

  const fetchStats = async () => {
    const res = await api.get<any>('/purchases/stats')
    if (res.data) setStats(res.data?.data ?? res.data)
  }

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '15' })
    if (search)       p.set('search', search)
    if (statusFilter) p.set('status', statusFilter)
    if (dateFrom)     p.set('from', dateFrom)
    if (dateTo)       p.set('to', dateTo)
    const res = await api.get<{ data: Purchase[] }>(`/purchases?${p}`)
    if (res.data) setItems(extractArray(res.data) || [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchStats()
    api.get<any>('/suppliers?per_page=200').then(r => setSuppliers(extractArray(r?.data) || [])).catch(() => {})
    api.get<any>('/tax-rates').then(r => setTaxRates(extractArray(r?.data) || [])).catch(() => {})
    api.get<any>('/products?per_page=200').then(r => setProducts(extractArray(r?.data) || [])).catch(() => {})
    api.get<any>('/categories?per_page=100').then(r => setCategories(extractArray(r?.data) || [])).catch(() => {})
    api.get<any>('/warehouses?per_page=100').then(r => {
  const data = r.data?.data ?? r.data
  if (Array.isArray(data)) setWarehouses(data)
  else if (data) setWarehouses([data])
}).catch(() => {})
  }, [])

  const handleReceive = async (id: number) => {
    setReceiving(id)
    const res = await api.patch(`/purchases/${id}/receive`, {})
    setReceiving(null)
    if (!res.error) { fetchItems(); fetchStats() }
  }

  const handleEdit = async (id: number) => {
    setEditLoading(true)
    setEditId(id)
    setModal(true)
    const res = await api.get<any>(`/purchases/${id}`)
    if (res.data) {
      const p = res.data?.data ?? res.data
      setForm({
        supplier_id: String(p.supplier?.id || ''),
        status:      p.status || 'draft',
        notes:       p.notes || '',
        tax_rate_id: '',
        expected_at: p.expected_at || '',
      })
      setOrderItems(
        p.items?.length > 0
          ? p.items.map((i: PurchaseItem) => ({
              product_id:   String(i.product?.id || i.product_id || ''),
              name:         i.product?.name || '',
             qty:          Number(i.qty),
cost:         Number(i.cost),
              warehouse_id: String(i.warehouse?.id || i.warehouse_id || ''),
            }))
          : [{ product_id: '', name: '', qty: 1, cost: 0, warehouse_id: '' }]
      )
    }
    setEditLoading(false)
  }

  const handleAddSupplier = async (e: FormEvent) => {
    e.preventDefault(); setAddSupplierErr('')
    if (!newSupplierName.trim()) { setAddSupplierErr(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required'); return }
    setAddingSupplier(true)
    const res = await api.post('/suppliers', { name: newSupplierName.trim(), email: newSupplierEmail.trim() || undefined, phone: newSupplierPhone.trim() || undefined })
    setAddingSupplier(false)
    if (res.error) { setAddSupplierErr(res.error); return }
    const newS: Supplier = { id: res.data?.data?.id || res.data?.id, name: newSupplierName.trim() }
    setSuppliers(prev => [...prev, newS])
    setForm(prev => ({ ...prev, supplier_id: String(newS.id) }))
    setShowAddSupplier(false)
    setNewSupplierName(''); setNewSupplierEmail(''); setNewSupplierPhone('')
  }

  const subtotal    = orderItems.reduce((s, i) => s + (i.qty * i.cost), 0)
  const selectedTax = taxRates.find(tx => String(tx.id) === form.tax_rate_id)
  const taxAmount   = selectedTax ? Math.round(subtotal * selectedTax.rate) / 100 : 0
  const grandTotal  = subtotal + taxAmount

  const addItem    = () => setOrderItems(prev => [...prev, { product_id: '', name: '', qty: 1, cost: 0, warehouse_id: '' }])
  const removeItem = (idx: number) => setOrderItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof OrderItem, val: any) => {
    setOrderItems(prev => {
      const arr = [...prev]
      arr[idx] = { ...arr[idx], [field]: val }
      if (field === 'product_id') {
        const p = products.find(p => String(p.id) === val)
        if (p) { arr[idx].name = p.name; arr[idx].cost = p.purchase_price || p.cost || 0 }
      }
      return arr
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.supplier_id) { setFormErr(lang === 'ar' ? 'يجب اختيار المورد' : 'Supplier is required'); return }
   const validItems = orderItems.filter(i => i.product_id && Number(i.product_id) > 0 && Number(i.qty) > 0 && Number(i.cost) >= 0)
    setSaving(true)
    const payload = {
      supplier_id: Number(form.supplier_id),
      status:      form.status,
      notes:       form.notes,
      expected_at: form.expected_at || undefined,
      items: validItems.map(i => ({
        product_id:   Number(i.product_id),
        quantity:     i.qty,
        unit_price:   i.cost,
        warehouse_id: i.warehouse_id ? Number(i.warehouse_id) : undefined,
      })),
      ...(form.tax_rate_id && { tax_rate_id: Number(form.tax_rate_id) }),
    }
    const res = editId ? await api.put(`/purchases/${editId}`, payload) : await api.post('/purchases', payload)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false); resetForm(); fetchItems(); fetchStats()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/purchases/${deleteId}`)
    setDeleteId(null); fetchItems(); fetchStats()
  }

const handleExport = async () => {
  setExportLoading(true)
  const p = new URLSearchParams({ format: 'excel' })
  if (dateFrom) p.set('from', dateFrom)
  if (dateTo)   p.set('to', dateTo)
  try {
    const token = localStorage.getItem('erp_token') || ''
const res = await fetch(`${BASE_URL}/reports/export/purchases?${p}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
})
    if (res.ok) {
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `purchases_${dateFrom || 'all'}_${dateTo || 'all'}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
  } catch {}
  setExportLoading(false)
}

  const handleOpenNewOrder = (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation()
    resetForm(); setEditLoading(false); setModal(true)
  }

  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'
  const badge   = (s: string) => ({ approved: 'badge-success', received: 'badge-success', pending: 'badge-warning', draft: 'badge-muted', cancelled: 'badge-danger' }[s] || 'badge-muted')
  const canReceive = (status: string) => ['pending', 'approved'].includes(status)

  return (
    <ERPLayout pageTitle={t('purchases')}>

      {/* ══ Summary Cards ══ */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',  value: stats.total_orders,    isCurrency: false, color: '#1d4ed8' },
            { label: lang === 'ar' ? 'إجمالي المبلغ'  : 'Total Amount',  value: stats.total_amount,    isCurrency: true,  color: '#0f766e' },
            { label: lang === 'ar' ? 'المستلم'         : 'Received',      value: stats.received_amount, isCurrency: true,  color: '#15803d' },
            { label: lang === 'ar' ? 'المعلق'          : 'Pending',       value: stats.pending_amount,  isCurrency: true,  color: '#b45309' },
          ].map((card, i) => (
            <div key={i} className="card" style={{ padding: '1rem', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: card.isCurrency ? '1.1rem' : '1.5rem', fontWeight: 700, color: card.color }}>
                {card.isCurrency ? fmt(card.value as number) : card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ Toolbar ══ */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="toolbar-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="search-bar">
            <span aria-hidden="true"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
            <input placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
          </select>
          <input type="date" className="input" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title={lang === 'ar' ? 'من تاريخ' : 'From'} />
          <input type="date" className="input" style={{ width: 'auto' }} value={dateTo}   onChange={e => setDateTo(e.target.value)}   title={lang === 'ar' ? 'إلى تاريخ' : 'To'} />
          {(dateFrom || dateTo) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setDateFrom(''); setDateTo('') }}>
              <FontAwesomeIcon icon={faXmark} style={{ marginInlineEnd: 4 }} />
              {lang === 'ar' ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exportLoading}>
            <FontAwesomeIcon icon={faFileExcel} style={{ marginInlineEnd: 8, color: '#15803d' }} />
            {exportLoading ? '...' : (lang === 'ar' ? 'Excel' : 'Export')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleOpenNewOrder}>
            <FontAwesomeIcon icon={faPlus} style={{ marginInlineEnd: 8 }} />
            {lang === 'ar' ? 'طلب شراء' : 'New Order'}
          </button>
        </div>
      </div>

      {/* ══ Table ══ */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FontAwesomeIcon icon={faBoxOpen} /></div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'رقم الطلب' : 'PO Number'}</th>
                  <th>{t('supplier')}</th>
                  <th>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</th>
                  <th>{lang === 'ar' ? 'الضريبة' : 'Tax'}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                  <th>{t('date')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.po_number || item.order_number}</td>
                    <td>{item.supplier?.name || '—'}</td>
                    <td className="text-muted">{item.subtotal ? fmt(item.subtotal) : '—'}</td>
                    <td className="text-muted">{item.tax ? fmt(item.tax) : '—'}</td>
                    <td className="fw-semibold">{fmt(item.total)}</td>
                    <td><span className={`badge ${badge(item.status)}`}>{t(item.status) || item.status}</span></td>
                    <td className="text-muted">{fmtDate(item.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/purchases/${item.id}`)}>
                          <FontAwesomeIcon icon={faEye} style={{ marginInlineEnd: 4 }} />
                          {lang === 'ar' ? 'عرض' : 'View'}
                        </button>
                        {item.status !== 'received' && item.status !== 'cancelled' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item.id)}>
                            <FontAwesomeIcon icon={faPenToSquare} style={{ marginInlineEnd: 4 }} />
                            {lang === 'ar' ? 'تعديل' : 'Edit'}
                          </button>
                        )}
                        {canReceive(item.status) && (
                          <button
                            className="btn btn-sm"
                            style={{ background: '#15803d', color: '#fff', border: 'none' }}
                            onClick={() => handleReceive(item.id)}
                            disabled={receiving === item.id}
                          >
                            <FontAwesomeIcon icon={faCheck} style={{ marginInlineEnd: 4 }} />
                            {receiving === item.id ? '...' : (lang === 'ar' ? 'استلام' : 'Receive')}
                          </button>
                        )}
                        {item.status !== 'received' && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ Modal: إنشاء / تعديل ══ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => { setModal(false); resetForm() }}>
          <div style={{ maxWidth: 760, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                {editId ? (lang === 'ar' ? 'تعديل طلب الشراء' : 'Edit Purchase Order') : (lang === 'ar' ? 'طلب شراء جديد' : 'New Purchase Order')}
              </h3>
              <button onClick={() => { setModal(false); resetForm() }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {editLoading ? (
              <div style={{ padding: '1.5rem', flex: 1 }}>
                {Array(4).fill(0).map((_, i) => <div key={i} style={{ height: 44, background: '#f3f4f6', borderRadius: 4, marginBottom: 12 }} />)}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

                    {/* المورد */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontWeight: 500 }}>{t('supplier')} *</label>
                        <button type="button" onClick={() => { setShowAddSupplier(!showAddSupplier); setAddSupplierErr('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 600 }}>
                          {showAddSupplier
                            ? <><FontAwesomeIcon icon={faChevronLeft} style={{ marginInlineEnd: 4 }} />{lang === 'ar' ? 'رجوع' : 'Back'}</>
                            : <><FontAwesomeIcon icon={faPlus} style={{ marginInlineEnd: 4 }} />{lang === 'ar' ? 'مورد جديد' : 'New Supplier'}</>}
                        </button>
                      </div>
                      {showAddSupplier ? (
                        <div style={{ border: '1px dashed #1d4ed8', borderRadius: 6, padding: '0.75rem', background: 'rgba(29,78,216,0.05)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input placeholder={lang === 'ar' ? 'الاسم *' : 'Name *'} value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} autoFocus style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }} />
                            <input placeholder={lang === 'ar' ? 'البريد (اختياري)' : 'Email (optional)'} type="email" value={newSupplierEmail} onChange={e => setNewSupplierEmail(e.target.value)} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }} />
                            <input placeholder={lang === 'ar' ? 'الهاتف (اختياري)' : 'Phone (optional)'} value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }} />
                            {addSupplierErr && <div style={{ color: '#dc2626', fontSize: '0.8rem' }}><FontAwesomeIcon icon={faCircleExclamation} style={{ marginInlineEnd: 6 }} />{addSupplierErr}</div>}
                            <button type="button" onClick={handleAddSupplier} disabled={addingSupplier} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
                              {addingSupplier ? '...' : <><FontAwesomeIcon icon={faSave} style={{ marginInlineEnd: 6 }} />{lang === 'ar' ? 'حفظ المورد' : 'Save Supplier'}</>}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} required style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}>
                          <option value="">{lang === 'ar' ? 'اختر المورد' : 'Select Supplier'}</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      )}
                    </div>

                    {/* الحالة */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: 500 }}>{t('status')}</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
                      </select>
                    </div>

                    {/* الضريبة */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: 500 }}>{lang === 'ar' ? 'الضريبة' : 'Tax Rate'}</label>
                      <select value={form.tax_rate_id} onChange={e => setForm({ ...form, tax_rate_id: e.target.value })} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}>
                        <option value="">{lang === 'ar' ? 'بدون ضريبة' : 'No Tax'}</option>
                        {taxRates.map(tx => <option key={tx.id} value={tx.id}>{tx.name} ({tx.rate}%)</option>)}
                      </select>
                    </div>

                    {/* تاريخ التوريد */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: 500 }}>{lang === 'ar' ? 'تاريخ التوريد المتوقع' : 'Expected Date'}</label>
                      <input type="date" value={form.expected_at} onChange={e => setForm({ ...form, expected_at: e.target.value })} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    {/* ملاحظات */}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: 500 }}>{t('notes')}</label>
                      <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', fontFamily: 'inherit', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* أصناف الطلب */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.95rem', fontWeight: 600 }}>{lang === 'ar' ? 'أصناف الطلب' : 'Order Items'}</label>
                      <button type="button" onClick={addItem} style={{ padding: '0.4rem 0.8rem', background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#000' }}>
                        <FontAwesomeIcon icon={faPlus} style={{ marginInlineEnd: 6 }} />{lang === 'ar' ? 'إضافة صنف' : 'Add Item'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {orderItems.map((item, idx) => (
                        
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
  <div style={{ display: 'flex', gap: 4 }}>
    <select
      value={item.product_id}
      onChange={e => updateItem(idx, 'product_id', e.target.value)}
      style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', flex: 1, boxSizing: 'border-box' }}
    >
      <option value="">{lang === 'ar' ? 'اختر منتج' : 'Select Product'}</option>
      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
    <button
      type="button"
      onClick={() => { setAddProductIdx(addProductIdx === idx ? null : idx); setNewProduct({ name: '', sku: '', purchase_price: '', price: '', category_id: '', unit: '', qty: '', min_qty: '', warehouse_id: '', is_active: true }); setAddProductErr('') }}
      title={lang === 'ar' ? 'منتج جديد' : 'New Product'}
      style={{ padding: '0 0.6rem', background: addProductIdx === idx ? '#1d4ed8' : '#e5e7eb', color: addProductIdx === idx ? '#fff' : '#1d4ed8', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}
    >
      <FontAwesomeIcon icon={faPlus} />
    </button>
  </div>

{addProductIdx === idx && (
  <div style={{ border: '1px dashed #1d4ed8', borderRadius: 6, padding: '0.75rem', background: 'rgba(29,78,216,0.05)' }}>
    <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 8, color: '#1d4ed8' }}>
      {lang === 'ar' ? '+ منتج جديد' : '+ New Product'}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {/* الاسم */}
      <div style={{ gridColumn: '1 / -1' }}>
        <input
          placeholder={lang === 'ar' ? 'اسم المنتج *' : 'Product Name *'}
          value={newProduct.name}
          onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
          autoFocus
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', boxSizing: 'border-box' }}
        />
      </div>

      {/* التصنيف */}
      <div style={{ display: 'flex', gap: 4 }}>
        {!showNewCat ? (
          <>
            <select
              value={newProduct.category_id}
              onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))}
              style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000' }}
            >
              <option value="">{lang === 'ar' ? 'التصنيف' : 'Category'}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" onClick={() => setShowNewCat(true)}
              style={{ padding: '0 0.5rem', background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#1d4ed8', fontWeight: 700 }}>
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 4, flex: 1 }}>
            <input
              placeholder={lang === 'ar' ? 'اسم الفئة' : 'Category name'}
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              autoFocus
              style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem' }}
            />
            <button type="button" disabled={savingCat} onClick={async () => {
              if (!newCatName.trim()) return
              setSavingCat(true)
              const res = await api.post('/categories', { name: newCatName.trim() })
              setSavingCat(false)
              if (res.error) return
              const created = { id: res.data?.data?.id ?? res.data?.id, name: newCatName.trim() }
              setCategories(prev => [...prev, created])
              setNewProduct(p => ({ ...p, category_id: String(created.id) }))
              setNewCatName(''); setShowNewCat(false)
            }} style={{ padding: '0 0.5rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              {savingCat ? '...' : '✓'}
            </button>
            <button type="button" onClick={() => { setShowNewCat(false); setNewCatName('') }}
              style={{ padding: '0 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>✕</button>
          </div>
        )}
      </div>
      {/* وحدة القياس */}
    
    </div>

    {/* أزرار الحفظ والإلغاء */}
    <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
      {addProductErr && (
        <div style={{ flex: 1, color: '#dc2626', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
          <FontAwesomeIcon icon={faCircleExclamation} />{addProductErr}
        </div>
      )}
      <button type="button" onClick={() => { setAddProductIdx(null); setNewProduct({ name: '', sku: '', purchase_price: '', price: '', category_id: '', unit: '', qty: '', min_qty: '', warehouse_id: '', is_active: true }); setAddProductErr('') }}
        style={{ padding: '0.5rem 0.75rem', background: 'none', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', color: '#6b7280', fontSize: '0.8rem' }}>
        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
      </button>
      <button type="button" disabled={addingProduct} onClick={async () => {
        if (!newProduct.name.trim()) { setAddProductErr(lang === 'ar' ? 'الاسم مطلوب' : 'Name required'); return }
        setAddingProduct(true); setAddProductErr('')
        const payload: any = {
          name: newProduct.name.trim(),
          price: item.cost || 0,
          purchase_price: item.cost || 0,
          cost: item.cost || 0,
          is_active: true,
        }
        if (newProduct.category_id) payload.category_id = Number(newProduct.category_id)
        const res = await api.post('/products', payload)
        setAddingProduct(false)
        if (res.error) { setAddProductErr(res.error); return }
        const newP: Product = {
          id: res.data?.data?.id ?? res.data?.id,
          name: newProduct.name.trim(),
          purchase_price: item.cost || 0,
          cost: item.cost || 0,
        }
        setProducts(prev => [...prev, newP])
        updateItem(idx, 'product_id', String(newP.id))
        setAddProductIdx(null)
        setNewProduct({ name: '', sku: '', purchase_price: '', price: '', category_id: '', unit: '', qty: '', min_qty: '', warehouse_id: '', is_active: true })
      }} style={{ padding: '0.5rem 1rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
        {addingProduct ? '...' : <><FontAwesomeIcon icon={faSave} style={{ marginInlineEnd: 6 }} />{lang === 'ar' ? 'حفظ المنتج' : 'Save Product'}</>}
      </button>
    </div>
  </div>
)}
</div>
                          <input type="number" min="0.001" step="0.001" placeholder={lang === 'ar' ? 'الكمية' : 'Qty'} value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }} />
                          <input type="number" min="0" step="0.01" placeholder={lang === 'ar' ? 'سعر التكلفة' : 'Cost'} value={item.cost} onChange={e => updateItem(idx, 'cost', Number(e.target.value))} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }} />
                          <select value={item.warehouse_id} onChange={e => updateItem(idx, 'warehouse_id', e.target.value)} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}>
                            <option value="">{lang === 'ar' ? 'المخزن' : 'Warehouse'}</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                          <button type="button" onClick={() => removeItem(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                        
                      ))}
                    </div>

                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '0.85rem' }}>{lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <strong>{fmt(subtotal)}</strong></div>
                      {selectedTax && <div style={{ fontSize: '0.85rem' }}>{lang === 'ar' ? `ضريبة ${selectedTax.rate}%:` : `Tax ${selectedTax.rate}%:`} <strong>{fmt(taxAmount)}</strong></div>}
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>{lang === 'ar' ? 'الإجمالي:' : 'Total:'} {fmt(grandTotal)}</div>
                    </div>
                  </div>

                  {formErr && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 6, color: '#dc2626', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
                      <FontAwesomeIcon icon={faCircleExclamation} /><span>{formErr}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => { setModal(false); resetForm() }} style={{ padding: '0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500, background: '#fff', color: '#000' }}>{t('cancel')}</button>
                  <button type="submit" disabled={saving || showAddSupplier} style={{ padding: '0.625rem 1rem', border: 'none', borderRadius: 6, background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                    {saving
                      ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> {t('loading')}</>
                      : t('save')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══ تأكيد الحذف ══ */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setDeleteId(null)}>
          <div style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#dc2626' }}><FontAwesomeIcon icon={faTrash} /></div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>{t('confirm_delete')}</h3>
              <p style={{ fontSize: '0.875rem', margin: 0, color: '#6b7280' }}>{lang === 'ar' ? 'لا يمكن التراجع' : 'Cannot be undone'}</p>
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500, background: '#fff', color: '#000' }}>{t('cancel')}</button>
              <button onClick={handleDelete} style={{ padding: '0.625rem 1rem', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </ERPLayout>
  )
}