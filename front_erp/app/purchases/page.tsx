'use client'

// ══════════════════════════════════════════════════════════
// app/purchases/page.tsx
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxOpen,
  faChevronLeft,
  faCircleExclamation,
  faEye,
  faMagnifyingGlass,
  faPenToSquare,
  faPlus,
  faSave,
  faTrash,
  faXmark,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type PurchaseItem = {
  id: number
  product_id?: number
  product?: { id: number; name: string }
  qty: number
  cost: number
  total: number
}

type Purchase = {
  id: number
  order_number: string
  supplier?: { id: number; name: string }
  subtotal?: number
  tax_amount?: number
  total: number
  status: string
  created_at: string
  notes?: string
  expected_date?: string
  items?: PurchaseItem[]
}

type Supplier = { id: number; name: string }
type TaxRate  = { id: number; name: string; rate: number }
type Product  = { id: number; name: string; cost?: number; purchase_price?: number }

const STATUSES = ['draft', 'pending', 'approved', 'received', 'cancelled']

type OrderItem = { product_id: string; name: string; qty: number; cost: number }

export default function PurchasesPage() {
  const { t, lang } = useI18n()
  const [items,        setItems]        = useState<Purchase[]>([])
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([])
  const [taxRates,     setTaxRates]     = useState<TaxRate[]>([])
  const [products,     setProducts]     = useState<Product[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal,        setModal]        = useState(false)
  const [deleteId,     setDeleteId]     = useState<number | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [formErr,      setFormErr]      = useState('')

  // مودال العرض
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null)
  const [viewLoading,  setViewLoading]  = useState(false)

  // مودال التعديل
  const [editId,      setEditId]      = useState<number | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // إضافة مورد inline
  const [showAddSupplier,  setShowAddSupplier]  = useState(false)
  const [newSupplierName,  setNewSupplierName]  = useState('')
  const [newSupplierEmail, setNewSupplierEmail] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [addingSupplier,   setAddingSupplier]   = useState(false)
  const [addSupplierErr,   setAddSupplierErr]   = useState('')

  const [form, setForm] = useState({
    supplier_id: '', status: 'draft', notes: '', tax_rate_id: '', expected_date: '',
  })

  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { product_id: '', name: '', qty: 1, cost: 0 }
  ])

  // ── helpers ──
  const resetForm = () => {
    setForm({ supplier_id: '', status: 'draft', notes: '', tax_rate_id: '', expected_date: '' })
    setOrderItems([{ product_id: '', name: '', qty: 1, cost: 0 }])
    setShowAddSupplier(false)
    setFormErr('')
    setEditId(null)
  }

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams({
      per_page: '15',
      ...(search       && { search }),
      ...(statusFilter && { status: statusFilter }),
    })
    const res = await api.get<{ data: Purchase[] }>(`/purchases?${p}`)
    if (res.data) setItems(extractArray(res.data))
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search, statusFilter])

  useEffect(() => {
    api.get<{ data: Supplier[] }>('/suppliers?per_page=200').then(r => {
      if (r.data) setSuppliers(extractArray(r.data))
    })
    api.get<any>('/tax-rates').then(r => {
      if (r.data) setTaxRates(extractArray(r.data))
    })
    api.get<{ data: Product[] }>('/products?per_page=200').then(r => {
      if (r.data) setProducts(extractArray(r.data))
    })
  }, [])

  // ── عرض التفاصيل ──
const handleView = async (id: number) => {
  setViewLoading(true)
  setViewPurchase({ id, order_number: '', total: 0, status: '', created_at: '' })
  try {
    const res = await api.get<any>(`/purchases/${id}`)
    // ← غير السطر ده
    const data = res.data?.data ?? res.data ?? res
    if (data?.id) setViewPurchase(data)
    else setViewPurchase({ id, order_number: '—', total: 0, status: '—', created_at: '' })
  } catch {
    setViewPurchase(null)
  }
  setViewLoading(false)
}

  // ── فتح مودال التعديل ──
  const handleEdit = async (id: number) => {
    setEditLoading(true)
    setEditId(id)
    setModal(true)
    const res = await api.get<any>(`/purchases/${id}`)
    if (res.data) {
      const p = res.data?.data ?? res.data
      setForm({
        supplier_id:   String(p.supplier?.id || ''),
        status:        p.status || 'draft',
        notes:         p.notes || '',
        tax_rate_id:   '',
        expected_date: p.expected_date || '',
      })
      setOrderItems(
        p.items && p.items.length > 0
          ? p.items.map((i: PurchaseItem) => ({
              product_id: String(i.product?.id || i.product_id || ''),
              name:       i.product?.name || '',
              qty:        i.qty,
              cost:       i.cost,
            }))
          : [{ product_id: '', name: '', qty: 1, cost: 0 }]
      )
    }
    setEditLoading(false)
  }

  // ── إضافة مورد ──
  const handleAddSupplier = async (e: FormEvent) => {
    e.preventDefault(); setAddSupplierErr('')
    if (!newSupplierName.trim()) {
      setAddSupplierErr(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required')
      return
    }
    setAddingSupplier(true)
    const res = await api.post('/suppliers', {
      name:  newSupplierName.trim(),
      email: newSupplierEmail.trim() || undefined,
      phone: newSupplierPhone.trim() || undefined,
    })
    setAddingSupplier(false)
    if (res.error) { setAddSupplierErr(res.error); return }
    const newS: Supplier = { id: res.data?.data?.id || res.data?.id, name: newSupplierName.trim() }
    setSuppliers(prev => [...prev, newS])
    setForm(prev => ({ ...prev, supplier_id: String(newS.id) }))
    setShowAddSupplier(false)
    setNewSupplierName(''); setNewSupplierEmail(''); setNewSupplierPhone('')
  }

  // ── حساب الإجمالي ──
  const subtotal    = orderItems.reduce((s, i) => s + (i.qty * i.cost), 0)
  const selectedTax = taxRates.find(tx => String(tx.id) === form.tax_rate_id)
  const taxAmount   = selectedTax ? Math.round(subtotal * selectedTax.rate) / 100 : 0
  const grandTotal  = subtotal + taxAmount

  const addItem    = () => setOrderItems(prev => [...prev, { product_id: '', name: '', qty: 1, cost: 0 }])
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

  // ── حفظ (إنشاء أو تعديل) ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.supplier_id) {
      setFormErr(lang === 'ar' ? 'يجب اختيار المورد' : 'Supplier is required')
      return
    }
 const validItems = orderItems.filter(i => 
    i.product_id && 
    Number(i.product_id) > 0 &&  // ✅ تأكد إن الـ id مش 0
    i.qty > 0 && 
    i.cost >= 0
)
    setSaving(true)
// ✅ الصح
const payload = {
  supplier_id:   Number(form.supplier_id),
  status:        form.status,
  notes:         form.notes,
  expected_date: form.expected_date || undefined,
  items: validItems.map(i => ({
    product_id: Number(i.product_id),
    quantity:   i.qty,
    unit_price: i.cost,
  })),
  ...(form.tax_rate_id && { tax_rate_id: Number(form.tax_rate_id) }),
}

    const res = editId
      ? await api.put(`/purchases/${editId}`, payload)
      : await api.post('/purchases', payload)

    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    resetForm()
    fetchItems()
  }

const handleDelete = async () => {
  if (!deleteId) return
  const res = await api.delete(`/purchases/${deleteId}`)
  if (!res.error) {
    await fetchItems() // ← refresh من السيرفر مش local فقط
  }
  setDeleteId(null)
}
  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'
  const badge   = (s: string) => ({
    approved: 'badge-success', received: 'badge-success',
    pending: 'badge-warning', draft: 'badge-muted', cancelled: 'badge-danger',
  }[s] || 'badge-muted')

  return (
    <ERPLayout pageTitle={t('purchases')}>
      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span aria-hidden="true"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
            <input
              placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setModal(true) }}>
          <FontAwesomeIcon icon={faPlus} style={{ marginInlineEnd: 8 }} />
          {lang === 'ar' ? 'طلب شراء' : 'New Order'}
        </button>
      </div>

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
                  <th>{t('number')}</th>
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
                    <td className="fw-semibold">{item.order_number}</td>
                    <td>{item.supplier?.name || '—'}</td>
                    <td className="text-muted">{item.subtotal ? fmt(item.subtotal) : '—'}</td>
                    <td className="text-muted">{item.tax_amount ? fmt(item.tax_amount) : '—'}</td>
                    <td className="fw-semibold">{fmt(item.total)}</td>
                    <td><span className={`badge ${badge(item.status)}`}>{t(item.status) || item.status}</span></td>
                    <td className="text-muted">{fmtDate(item.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleView(item.id)}>
                          <FontAwesomeIcon icon={faEye} style={{ marginInlineEnd: 6 }} />
                          {lang === 'ar' ? 'عرض' : 'View'}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item.id)}>
                          <FontAwesomeIcon icon={faPenToSquare} style={{ marginInlineEnd: 6 }} />
                          {lang === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>
                          <FontAwesomeIcon icon={faTrash} style={{ marginInlineEnd: 6 }} />
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
      </div>

      {/* ══ Modal: عرض التفاصيل ══ */}
      {viewPurchase && (
        <div className="modal-overlay" onClick={() => setViewPurchase(null)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {lang === 'ar' ? 'تفاصيل طلب الشراء' : 'Purchase Order Details'}
                {viewPurchase.order_number && (
                  <span style={{ marginRight: 8, marginLeft: 8, color: 'var(--color-primary)' }}>
                    #{viewPurchase.order_number}
                  </span>
                )}
              </h3>
              <button className="btn-icon" onClick={() => setViewPurchase(null)} aria-label={t('close') || 'Close'}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="modal-body">
              {viewLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 36 }} />)}
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('supplier')}</div>
                      <div className="fw-semibold">{viewPurchase.supplier?.name || '—'}</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('status')}</div>
                      <span className={`badge ${badge(viewPurchase.status)}`}>{t(viewPurchase.status) || viewPurchase.status}</span>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('date')}</div>
                      <div>{fmtDate(viewPurchase.created_at)}</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{lang === 'ar' ? 'تاريخ التوريد' : 'Expected Date'}</div>
                      <div>{viewPurchase.expected_date ? fmtDate(viewPurchase.expected_date) : '—'}</div>
                    </div>
                  </div>

                  {viewPurchase.items && viewPurchase.items.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div className="fw-semibold" style={{ marginBottom: '0.5rem' }}>
                        {lang === 'ar' ? 'الأصناف' : 'Items'}
                      </div>
                      <table className="table" style={{ fontSize: '0.875rem' }}>
                        <thead>
                          <tr>
                            <th>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                            <th>{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                            <th>{lang === 'ar' ? 'سعر التكلفة' : 'Cost'}</th>
                            <th>{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewPurchase.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.product?.name || '—'}</td>
                              <td>{item.qty}</td>
                              <td>{fmt(item.cost)}</td>
                              <td className="fw-semibold">{fmt(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    {viewPurchase.subtotal !== undefined && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <strong>{fmt(viewPurchase.subtotal)}</strong>
                      </div>
                    )}
                    {viewPurchase.tax_amount !== undefined && viewPurchase.tax_amount > 0 && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {lang === 'ar' ? 'الضريبة:' : 'Tax:'} <strong>{fmt(viewPurchase.tax_amount)}</strong>
                      </div>
                    )}
                    <div style={{ fontSize: '1rem', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: 6, marginTop: 2 }}>
                      {lang === 'ar' ? 'الإجمالي الكلي:' : 'Grand Total:'} {fmt(viewPurchase.total)}
                    </div>
                  </div>

                  {viewPurchase.notes && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('notes')}</div>
                      <div style={{ fontSize: '0.875rem' }}>{viewPurchase.notes}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewPurchase(null)}>
                {t('close') || (lang === 'ar' ? 'إغلاق' : 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: إنشاء / تعديل طلب شراء ══ */}
      {modal && (
        <div className="modal-overlay" onClick={() => { setModal(false); resetForm() }}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editId
                  ? (lang === 'ar' ? 'تعديل طلب الشراء' : 'Edit Purchase Order')
                  : (lang === 'ar' ? 'طلب شراء جديد'    : 'New Purchase Order')}
              </h3>
              <button className="btn-icon" onClick={() => { setModal(false); resetForm() }} aria-label={t('close') || 'Close'}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {editLoading ? (
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="modal-body">
                  <div className="form-grid form-grid-2">

                    {/* المورد */}
                    <div className="input-group">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>{t('supplier')} *</label>
                        <button type="button"
                          onClick={() => { setShowAddSupplier(!showAddSupplier); setAddSupplierErr('') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {showAddSupplier
                            ? (
                              <>
                                <FontAwesomeIcon icon={faChevronLeft} style={{ marginInlineEnd: 6 }} />
                                {lang === 'ar' ? 'رجوع للقائمة' : 'Back'}
                              </>
                            )
                            : (
                              <>
                                <FontAwesomeIcon icon={faPlus} style={{ marginInlineEnd: 6 }} />
                                {lang === 'ar' ? 'مورد جديد' : 'New Supplier'}
                              </>
                            )}
                        </button>
                      </div>
                      {showAddSupplier ? (
                        <div style={{ border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: 'var(--color-primary-light)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input className="input" placeholder={lang === 'ar' ? 'الاسم *' : 'Name *'} value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} autoFocus />
                            <input className="input" placeholder={lang === 'ar' ? 'البريد (اختياري)' : 'Email (optional)'} type="email" value={newSupplierEmail} onChange={e => setNewSupplierEmail(e.target.value)} />
                            <input className="input" placeholder={lang === 'ar' ? 'الهاتف (اختياري)' : 'Phone (optional)'} value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} />
                            {addSupplierErr && <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}><FontAwesomeIcon icon={faCircleExclamation} style={{ marginInlineEnd: 6 }} />{addSupplierErr}</div>}
                            <button type="button" className="btn btn-primary btn-sm" onClick={handleAddSupplier} disabled={addingSupplier} style={{ alignSelf: 'flex-start' }}>
                              {addingSupplier ? '...' : (
                                <>
                                  <FontAwesomeIcon icon={faSave} style={{ marginInlineEnd: 6 }} />
                                  {lang === 'ar' ? 'حفظ المورد' : 'Save Supplier'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select className="input" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} required>
                          <option value="">{suppliers.length === 0 ? (lang === 'ar' ? 'اضغط "مورد جديد"' : 'Click "New Supplier"') : (lang === 'ar' ? 'اختر المورد' : 'Select Supplier')}</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      )}
                    </div>

                    {/* الحالة */}
                    <div className="input-group">
                      <label className="input-label">{t('status')}</label>
                      <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
                      </select>
                    </div>

                    {/* الضريبة */}
                    <div className="input-group">
                      <label className="input-label">{lang === 'ar' ? 'الضريبة' : 'Tax Rate'}</label>
                      <select className="input" value={form.tax_rate_id} onChange={e => setForm({ ...form, tax_rate_id: e.target.value })}>
                        <option value="">{lang === 'ar' ? 'بدون ضريبة' : 'No Tax'}</option>
                        {taxRates.length === 0
                          ? <option disabled>{lang === 'ar' ? 'لا توجد ضرائب معرّفة' : 'No tax rates defined'}</option>
                          : taxRates.map(tx => <option key={tx.id} value={tx.id}>{tx.name} ({tx.rate}%)</option>)
                        }
                      </select>
                      {taxRates.length === 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          <FontAwesomeIcon icon={faLightbulb} style={{ marginInlineEnd: 6 }} />
                          {lang === 'ar' ? 'أضف ضرائب من صفحة الإعدادات ← الضرائب' : 'Add taxes from Settings → Taxes'}
                        </div>
                      )}
                    </div>

                    {/* تاريخ التوريد */}
                    <div className="input-group">
                      <label className="input-label">{lang === 'ar' ? 'تاريخ التوريد المتوقع' : 'Expected Date'}</label>
                      <input className="input" type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} />
                    </div>

                    {/* ملاحظات */}
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label">{t('notes')}</label>
                      <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
                    </div>
                  </div>

                  {/* أصناف الطلب */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className="fw-semibold">{lang === 'ar' ? 'أصناف الطلب' : 'Order Items'}</label>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                        <FontAwesomeIcon icon={faPlus} style={{ marginInlineEnd: 6 }} />
                        {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {orderItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                          <select className="input" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                            <option value="">{lang === 'ar' ? 'اختر منتج' : 'Select Product'}</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input className="input" type="number" min="0.001" step="0.001"
                            placeholder={lang === 'ar' ? 'الكمية' : 'Qty'}
                            value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} />
                          <input className="input" type="number" min="0" step="0.01"
                            placeholder={lang === 'ar' ? 'سعر التكلفة' : 'Cost'}
                            value={item.cost} onChange={e => updateItem(idx, 'cost', Number(e.target.value))} />
                          <button type="button" className="btn-icon" onClick={() => removeItem(idx)} style={{ color: 'var(--color-danger)' }} aria-label={t('delete')}>
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* ملخص الإجمالي */}
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <strong>{fmt(subtotal)}</strong>
                      </div>
                      {selectedTax && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {lang === 'ar' ? `ضريبة ${selectedTax.rate}%:` : `Tax ${selectedTax.rate}%:`} <strong>{fmt(taxAmount)}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                        {lang === 'ar' ? 'الإجمالي:' : 'Total:'} {fmt(grandTotal)}
                      </div>
                    </div>
                  </div>

                  {formErr && (
                    <div className="login-error" style={{ marginTop: '1rem' }}>
                      <span aria-hidden="true"><FontAwesomeIcon icon={faCircleExclamation} /></span> {formErr}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setModal(false); resetForm() }}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving || showAddSupplier}>
                    {saving
                      ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('loading')}</>
                      : t('save')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}><FontAwesomeIcon icon={faTrash} /></div>
              <h3>{t('confirm_delete')}</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>{lang === 'ar' ? 'لا يمكن التراجع' : 'Cannot be undone'}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </ERPLayout>
  )
}
