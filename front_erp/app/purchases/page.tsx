'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom' // ✅ إضافة Portal
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

// ... الأنواع (Types) تبقى كما هي بدون تغيير ...
type PurchaseItem = { id: number; product_id?: number; product?: { id: number; name: string }; qty: number; cost: number; total: number; warehouse_id?: number; warehouse?: { id: number; name: string } }
type Purchase = { id: number; order_number: string; po_number?: string; supplier?: { id: number; name: string }; subtotal?: number; tax?: number; discount?: number; total: number; status: string; created_at: string; notes?: string; expected_at?: string; items?: PurchaseItem[] }
type Stats = { total_orders: number; total_amount: number; received_amount: number; pending_amount: number }
type Supplier  = { id: number; name: string }; type Product = { id: number; name: string; cost?: number; purchase_price?: number }; type Warehouse = { id: number; name: string }
const STATUSES = ['draft', 'pending', 'approved', 'received', 'cancelled']
type OrderItem = { product_id: string; name: string; qty: number; cost: number; warehouse_id: string }

export default function PurchasesPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  const router = useRouter()

  // ✅ للتعامل مع البورتال بشكل آمن
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const [items, setItems] = useState<Purchase[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [receiving, setReceiving] = useState<number | null>(null)
  const [formErr, setFormErr] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierEmail, setNewSupplierEmail] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [addingSupplier, setAddingSupplier] = useState(false)
  const [addSupplierErr, setAddSupplierErr] = useState('')
  const [addProductIdx, setAddProductIdx] = useState<number | null>(null)
  const [addingProduct, setAddingProduct] = useState(false)
  const [addProductErr, setAddProductErr] = useState('')
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', purchase_price: '', price: '', category_id: '', unit: '', qty: '', min_qty: '', warehouse_id: '', is_active: true })
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  const [form, setForm] = useState({ supplier_id: '', status: 'draft', notes: '', tax: '', expected_at: '' })
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{ product_id: '', name: '', qty: 1, cost: 0, warehouse_id: '' }])

  // ... الدوال المساعدة (Reset, Fetch, etc.) تبقى كما هي ...
  const resetForm = () => {
    setForm({ supplier_id: '', status: 'draft', notes: '', tax: '', expected_at: '' })
    setOrderItems([{ product_id: '', name: '', qty: 1, cost: 0, warehouse_id: '' }])
    setShowAddSupplier(false); setFormErr(''); setEditId(null); setAddProductIdx(null)
  }

  const fetchStats = async () => { const res = await api.get<any>('/purchases/stats'); if (res.data) setStats(res.data?.data ?? res.data) }
  const fetchItems = async () => {
    setLoading(true); const p = new URLSearchParams({ per_page: '15' }); if (search) p.set('search', search); if (statusFilter) p.set('status', statusFilter); if (dateFrom) p.set('from', dateFrom); if (dateTo) p.set('to', dateTo)
    const res = await api.get<{ data: Purchase[] }>(`/purchases?${p}`); if (res.data) setItems(extractArray(res.data) || []); setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search, statusFilter, dateFrom, dateTo])
  useEffect(() => {
    fetchStats()
    api.get<any>('/suppliers?per_page=200').then(r => setSuppliers(extractArray(r?.data) || []))
    api.get<any>('/products?per_page=200').then(r => setProducts(extractArray(r?.data) || []))
    api.get<any>('/categories?per_page=100').then(r => setCategories(extractArray(r?.data) || []))
    api.get<any>('/warehouses?per_page=100').then(r => { const d = r.data?.data ?? r.data; if (Array.isArray(d)) setWarehouses(d); else if (d) setWarehouses([d]) })
  }, [])

  const handleReceive = async (id: number) => { setReceiving(id); const res = await api.patch(`/purchases/${id}/receive`, {}); setReceiving(null); if (!res.error) { fetchItems(); fetchStats() } }

  const handleEdit = async (id: number) => {
    setEditLoading(true); setEditId(id); setModal(true)
    const res = await api.get<any>(`/purchases/${id}`)
    if (res.data) {
      const p = res.data?.data ?? res.data
      setForm({ supplier_id: String(p.supplier?.id || ''), status: p.status || 'draft', notes: p.notes || '', tax: String(p.tax ?? ''), expected_at: p.expected_at || '' })
      setOrderItems(p.items?.length > 0 ? p.items.map((i: PurchaseItem) => ({ product_id: String(i.product?.id || i.product_id || ''), name: i.product?.name || '', qty: Number(i.qty), cost: Number(i.cost), warehouse_id: String(i.warehouse?.id || i.warehouse_id || '') })) : [{ product_id: '', name: '', qty: 1, cost: 0, warehouse_id: '' }])
    }
    setEditLoading(false)
  }

  const handleAddSupplier = async (e: FormEvent) => {
    e.preventDefault(); setAddSupplierErr('')
    if (!newSupplierName.trim()) { setAddSupplierErr(ar ? 'الاسم مطلوب' : 'Name is required'); return }
    setAddingSupplier(true)
    const res = await api.post('/suppliers', { name: newSupplierName.trim(), email: newSupplierEmail.trim() || undefined, phone: newSupplierPhone.trim() || undefined })
    setAddingSupplier(false)
    if (res.error) { setAddSupplierErr(res.error); return }
    const newS = { id: res.data?.data?.id || res.data?.id, name: newSupplierName.trim() }
    setSuppliers(prev => [...prev, newS]); setForm(prev => ({ ...prev, supplier_id: String(newS.id) })); setShowAddSupplier(false); setNewSupplierName(''); setNewSupplierEmail(''); setNewSupplierPhone('')
  }

  const subtotal = orderItems.reduce((s, i) => s + (i.qty * i.cost), 0); const taxAmount = Number(form.tax) || 0; const grandTotal = subtotal + taxAmount

  const addItem = () => setOrderItems(prev => [...prev, { product_id: '', name: '', qty: 1, cost: 0, warehouse_id: '' }]); const removeItem = (idx: number) => setOrderItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof OrderItem, val: any) => {
    setOrderItems(prev => {
      const arr = [...prev]; arr[idx] = { ...arr[idx], [field]: val }
      if (field === 'product_id') { const p = products.find(p => String(p.id) === val); if (p) { arr[idx].name = p.name; arr[idx].cost = p.purchase_price || p.cost || 0 } }
      return arr
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.supplier_id) { setFormErr(ar ? 'يجب اختيار المورد' : 'Supplier is required'); return }
    const validItems = orderItems.filter(i => i.product_id && Number(i.product_id) > 0 && Number(i.qty) > 0 && Number(i.cost) >= 0)
    setSaving(true)
    const payload = { supplier_id: Number(form.supplier_id), status: form.status, notes: form.notes, expected_at: form.expected_at || undefined, items: validItems.map(i => ({ product_id: Number(i.product_id), quantity: i.qty, unit_price: i.cost, warehouse_id: i.warehouse_id ? Number(i.warehouse_id) : undefined })), ...(form.tax !== '' && { tax: Number(form.tax) || 0 }) }
    const res = editId ? await api.put(`/purchases/${editId}`, payload) : await api.post('/purchases', payload)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false); resetForm(); fetchItems(); fetchStats()
  }

  const handleDelete = async () => { if (!deleteId) return; await api.delete(`/purchases/${deleteId}`); setDeleteId(null); fetchItems(); fetchStats() }

  const handleExport = async () => {
    setExportLoading(true); const p = new URLSearchParams({ format: 'excel' }); if (dateFrom) p.set('from', dateFrom); if (dateTo) p.set('to', dateTo)
    try {
      const token = localStorage.getItem('erp_token') || ''
      const res = await fetch(`${BASE_URL}/reports/export/purchases?${p}`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) { const b = await res.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `purchases.xlsx`; a.click(); URL.revokeObjectURL(u) }
    } catch { } setExportLoading(false)
  }

  const fmt = (n: number) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'
  const badge = (s: string) => ({ approved: 'badge-success', received: 'badge-success', pending: 'badge-warning', draft: 'badge-muted', cancelled: 'badge-danger' }[s] || 'badge-muted')
  const canReceive = (status: string) => ['pending', 'approved'].includes(status)

  return (
    <ERPLayout pageTitle={t('purchases')}>

      {/* Summary Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: ar ? 'إجمالي الطلبات' : 'Total Orders', value: stats.total_orders, isCurrency: false, color: '#1d4ed8' },
            { label: ar ? 'إجمالي المبلغ' : 'Total Amount', value: stats.total_amount, isCurrency: true, color: '#0f766e' },
            { label: ar ? 'المستلم' : 'Received', value: stats.received_amount, isCurrency: true, color: '#15803d' },
            { label: ar ? 'المعلق' : 'Pending', value: stats.pending_amount, isCurrency: true, color: '#b45309' },
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

      {/* Toolbar */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="toolbar-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="search-bar">
            <span><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
            <input placeholder={ar ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{ar ? 'كل الحالات' : 'All Status'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
          </select>
          <input type="date" className="input" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <input type="date" className="input" style={{ width: 'auto' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exportLoading}>
            <FontAwesomeIcon icon={faFileExcel} style={{ marginInlineEnd: 8, color: '#15803d' }} />
            {exportLoading ? '...' : ar ? 'تصدير' : 'Export'}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setModal(true) }}>
            <FontAwesomeIcon icon={faPlus} style={{ marginInlineEnd: 8 }} />
            {ar ? 'طلب شراء' : 'New Order'}
          </button>
        </div>
      </div>

      {/* Table */}
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
                  <th>{ar ? 'رقم الطلب' : 'PO Number'}</th>
                  <th>{t('supplier')}</th>
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
                    <td className="fw-semibold">{fmt(item.total)}</td>
                    <td><span className={`badge ${badge(item.status)}`}>{t(item.status)}</span></td>
                    <td className="text-muted">{fmtDate(item.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/purchases/${item.id}`)}><FontAwesomeIcon icon={faEye} /></button>
                        {item.status !== 'received' && item.status !== 'cancelled' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item.id)}><FontAwesomeIcon icon={faPenToSquare} /></button>
                        )}
                        {canReceive(item.status) && (
                          <button className="btn btn-sm" style={{ background: '#15803d', color: '#fff', border: 'none' }} onClick={() => handleReceive(item.id)} disabled={receiving === item.id}>
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        )}
                        {item.status !== 'received' && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}><FontAwesomeIcon icon={faTrash} /></button>
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

      {/* ══ Modal: New/Edit Purchase Order (Portal) ══ */}
      {modal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => { setModal(false); resetForm() }}>
          <div style={{ maxWidth: 820, width: '95%', background: 'var(--bg-card, #242424)', color: 'var(--text-color, #fff)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color, #333)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                {editId ? (ar ? 'تعديل طلب الشراء' : 'Edit Order') : (ar ? 'طلب شراء جديد' : 'New Order')}
              </h3>
              <button onClick={() => { setModal(false); resetForm() }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'inherit' }}>×</button>
            </div>

            {editLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>{t('loading')}</div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* Supplier */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>{t('supplier')} *</label>
                        <button type="button" onClick={() => setShowAddSupplier(!showAddSupplier)} style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          {showAddSupplier ? (ar ? 'رجوع' : 'Back') : (ar ? '+ مورد جديد' : '+ New')}
                        </button>
                      </div>
                      {showAddSupplier ? (
                        <div style={{ border: '1px dashed #1d4ed8', borderRadius: 6, padding: '0.75rem', background: 'rgba(29,78,216,0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input className="input" placeholder={ar ? 'الاسم *' : 'Name'} value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
                          <button type="button" className="btn btn-primary btn-sm" onClick={handleAddSupplier} disabled={addingSupplier}>{ar ? 'حفظ' : 'Save'}</button>
                        </div>
                      ) : (
                        <select className="input" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} required>
                          <option value="">{ar ? 'اختر المورد' : 'Select Supplier'}</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      )}
                    </div>
                    {/* Status & Date */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label className="input-label">{t('status')}</label>
                      <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label className="input-label">{ar ? 'الضريبة' : 'Tax'}</label>
                      <input className="input" type="number" min="0" step="0.01" placeholder={ar ? 'قيمة الضريبة' : 'Tax value'} value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label className="input-label">{ar ? 'تاريخ التوريد' : 'Expected'}</label>
                      <input type="date" className="input" value={form.expected_at} onChange={e => setForm({ ...form, expected_at: e.target.value })} />
                    </div>
                  </div>

                  {/* Items Section */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <label className="fw-semibold">{ar ? 'أصناف الطلب' : 'Order Items'}</label>
                      <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">+ {ar ? 'إضافة' : 'Add'}</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {orderItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--border-color, #333)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'start' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <select className="input" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)} style={{ flex: 1 }}>
                                <option value="">{ar ? 'اختر منتج' : 'Product'}</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <button type="button" className="btn btn-secondary" onClick={() => setAddProductIdx(addProductIdx === idx ? null : idx)}>+</button>
                            </div>
                            <input className="input" type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} />
                            <input className="input" type="number" placeholder="Cost" value={item.cost} onChange={e => updateItem(idx, 'cost', Number(e.target.value))} />
                            <select className="input" value={item.warehouse_id} onChange={e => updateItem(idx, 'warehouse_id', e.target.value)}>
                              <option value="">{ar ? 'مخزن' : 'WH'}</option>
                              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <button type="button" onClick={() => removeItem(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                          {/* Inline New Product Form if open */}
                          {addProductIdx === idx && (
                            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', gap: 6 }}>
                              <input className="input" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                              <button type="button" className="btn btn-primary btn-sm" onClick={async () => {
                                if (!newProduct.name) return; setAddingProduct(true)
                                const r = await api.post('/products', { name: newProduct.name, purchase_price: item.cost, is_active: true })
                                if (!r.error) { const p = r.data?.data ?? r.data; setProducts(v => [...v, p]); updateItem(idx, 'product_id', String(p.id)); setAddProductIdx(null); setNewProduct({ ...newProduct, name: '' }) }
                                setAddingProduct(false)
                              }}>{addingProduct ? '...' : (ar ? 'حفظ' : 'Save')}</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--bg-hover, #2a2a2a)', borderRadius: 8, textAlign: 'end', fontWeight: 700 }}>
                    {ar ? 'الإجمالي:' : 'Total:'} {fmt(grandTotal)}
                  </div>
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color, #333)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setModal(false); resetForm() }}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : t('save')}</button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ══ Modal: Delete Confirmation (Portal) ══ */}
      {deleteId && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setDeleteId(null)}>
          <div style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #242424)', color: 'var(--text-color, #fff)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#dc2626' }}><FontAwesomeIcon icon={faTrash} /></div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>{t('confirm_delete')}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{ar ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}</p>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color, #333)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
