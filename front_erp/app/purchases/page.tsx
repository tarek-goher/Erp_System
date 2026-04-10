'use client'

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
    if (res.data) setItems(extractArray(res.data) || [])
    setLoading(false)
  }

  useEffect(() => { 
    fetchItems() 
  }, [search, statusFilter])

  useEffect(() => {
    api.get<{ data: Supplier[] }>('/suppliers?per_page=200').then(r => {
      setSuppliers(extractArray(r?.data) || [])
    }).catch(() => setSuppliers([]))
    
    api.get<any>('/tax-rates').then(r => {
      setTaxRates(extractArray(r?.data) || [])
    }).catch(() => setTaxRates([]))
    
    api.get<{ data: Product[] }>('/products?per_page=200').then(r => {
      setProducts(extractArray(r?.data) || [])
    }).catch(() => setProducts([]))
  }, [])

  // ── عرض التفاصيل ──
  const handleView = async (id: number) => {
    setViewLoading(true)
    setViewPurchase({ id, order_number: '', total: 0, status: '', created_at: '' })
    try {
      const res = await api.get<any>(`/purchases/${id}`)
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
        Number(i.product_id) > 0 && 
        i.qty > 0 && 
        i.cost >= 0
    )
    setSaving(true)
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
      await fetchItems() 
    }
    setDeleteId(null)
  }

  // ── فتح مودال طلب جديد ──
  const handleOpenNewOrder = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    resetForm();
    setEditLoading(false);
    setModal(true);
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
        <button type="button" className="btn btn-primary" onClick={handleOpenNewOrder}>
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
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999, opacity: 1, visibility: 'visible' }} 
          onClick={() => setViewPurchase(null)}
        >
          <div 
            style={{ maxWidth: 700, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                {lang === 'ar' ? 'تفاصيل طلب الشراء' : 'Purchase Order Details'}
                {viewPurchase.order_number && (
                  <span style={{ marginRight: 8, marginLeft: 8, color: '#1d4ed8' }}>
                    #{viewPurchase.order_number}
                  </span>
                )}
              </h3>
              <button onClick={() => setViewPurchase(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {viewLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(0).map((_, i) => <div key={i} style={{ height: 36, background: '#f3f4f6', borderRadius: 4 }} />)}
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>{t('supplier')}</div>
                      <div className="fw-semibold" style={{color: '#000'}}>{viewPurchase.supplier?.name || '—'}</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>{t('status')}</div>
                      <span className={`badge ${badge(viewPurchase.status)}`}>{t(viewPurchase.status) || viewPurchase.status}</span>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>{t('date')}</div>
                      <div style={{color: '#000'}}>{fmtDate(viewPurchase.created_at)}</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>{lang === 'ar' ? 'تاريخ التوريد' : 'Expected Date'}</div>
                      <div style={{color: '#000'}}>{viewPurchase.expected_date ? fmtDate(viewPurchase.expected_date) : '—'}</div>
                    </div>
                  </div>

                  {viewPurchase.items && viewPurchase.items.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#000' }}>
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
                              <td style={{fontWeight: 600}}>{fmt(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', color: '#000' }}>
                    {viewPurchase.subtotal !== undefined && (
                      <div style={{ fontSize: '0.875rem' }}>
                        {lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <strong>{fmt(viewPurchase.subtotal)}</strong>
                      </div>
                    )}
                    {viewPurchase.tax_amount !== undefined && viewPurchase.tax_amount > 0 && (
                      <div style={{ fontSize: '0.875rem' }}>
                        {lang === 'ar' ? 'الضريبة:' : 'Tax:'} <strong>{fmt(viewPurchase.tax_amount)}</strong>
                      </div>
                    )}
                    <div style={{ fontSize: '1rem', fontWeight: 700, borderTop: '1px solid #d1d5db', paddingTop: 6, marginTop: 2 }}>
                      {lang === 'ar' ? 'الإجمالي الكلي:' : 'Grand Total:'} {fmt(viewPurchase.total)}
                    </div>
                  </div>

                  {viewPurchase.notes && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>{t('notes')}</div>
                      <div style={{ fontSize: '0.875rem', color: '#000' }}>{viewPurchase.notes}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewPurchase(null)} style={{ padding: '0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500, background: '#fff', color: '#000' }}>
                {t('close') || (lang === 'ar' ? 'إغلاق' : 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: إنشاء / تعديل طلب شراء ══ */}
      {modal && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999, opacity: 1, visibility: 'visible' }} 
          onClick={() => { setModal(false); resetForm(); }}
        >
          <div 
            style={{ maxWidth: 760, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                {editId
                  ? (lang === 'ar' ? 'تعديل طلب الشراء' : 'Edit Purchase Order')
                  : (lang === 'ar' ? 'طلب شراء جديد'    : 'New Purchase Order')}
              </h3>
              <button onClick={() => { setModal(false); resetForm(); }} aria-label={t('close') || 'Close'} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {editLoading ? (
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(0).map((_, i) => <div key={i} style={{ height: 44, background: '#f3f4f6', borderRadius: 4 }} />)}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

                    {/* المورد */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ marginBottom: 0, fontWeight: 500 }}>{t('supplier')} *</label>
                        <button type="button"
                          onClick={() => { setShowAddSupplier(!showAddSupplier); setAddSupplierErr('') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 600 }}>
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
                        <div style={{ border: '1px dashed #1d4ed8', borderRadius: 6, padding: '0.75rem', background: 'rgba(29, 78, 216, 0.05)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input placeholder={lang === 'ar' ? 'الاسم *' : 'Name *'} value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} autoFocus style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }} />
                            <input placeholder={lang === 'ar' ? 'البريد (اختياري)' : 'Email (optional)'} type="email" value={newSupplierEmail} onChange={e => setNewSupplierEmail(e.target.value)} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }} />
                            <input placeholder={lang === 'ar' ? 'الهاتف (اختياري)' : 'Phone (optional)'} value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }} />
                            {addSupplierErr && <div style={{ color: '#dc2626', fontSize: '0.8rem' }}><FontAwesomeIcon icon={faCircleExclamation} style={{ marginInlineEnd: 6 }} />{addSupplierErr}</div>}
                            <button type="button" onClick={handleAddSupplier} disabled={addingSupplier} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
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
                        <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} required style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}>
                          <option value="">{suppliers.length === 0 ? (lang === 'ar' ? 'اضغط "مورد جديد"' : 'Click "New Supplier"') : (lang === 'ar' ? 'اختر المورد' : 'Select Supplier')}</option>
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
                        {taxRates.length === 0
                          ? <option disabled>{lang === 'ar' ? 'لا توجد ضرائب معرّفة' : 'No tax rates defined'}</option>
                          : taxRates.map(tx => <option key={tx.id} value={tx.id}>{tx.name} ({tx.rate}%)</option>)
                        }
                      </select>
                    </div>

                    {/* تاريخ التوريد */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: 500 }}>{lang === 'ar' ? 'تاريخ التوريد المتوقع' : 'Expected Date'}</label>
                      <input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    {/* ملاحظات */}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: 500 }}>{t('notes')}</label>
                      <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', fontFamily: 'inherit', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* أصناف الطلب */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.95rem', fontWeight: 600 }}>{lang === 'ar' ? 'أصناف الطلب' : 'Order Items'}</label>
                      <button type="button" onClick={addItem} style={{ padding: '0.4rem 0.8rem', background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#000' }}>
                        <FontAwesomeIcon icon={faPlus} style={{ marginInlineEnd: 6 }} />
                        {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {orderItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                          <select value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}>
                            <option value="">{lang === 'ar' ? 'اختر منتج' : 'Select Product'}</option>
                            {(products || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="number" min="0.001" step="0.001"
                            placeholder={lang === 'ar' ? 'الكمية' : 'Qty'}
                            value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }} />
                          <input type="number" min="0" step="0.01"
                            placeholder={lang === 'ar' ? 'سعر التكلفة' : 'Cost'}
                            value={item.cost} onChange={e => updateItem(idx, 'cost', Number(e.target.value))} style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }} />
                          <button type="button" onClick={() => removeItem(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} aria-label={t('delete')}>
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* ملخص الإجمالي */}
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', color: '#000' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        {lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <strong>{fmt(subtotal)}</strong>
                      </div>
                      {selectedTax && (
                        <div style={{ fontSize: '0.85rem' }}>
                          {lang === 'ar' ? `ضريبة ${selectedTax.rate}%:` : `Tax ${selectedTax.rate}%:`} <strong>{fmt(taxAmount)}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                        {lang === 'ar' ? 'الإجمالي:' : 'Total:'} {fmt(grandTotal)}
                      </div>
                    </div>
                  </div>

                  {formErr && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 6, color: '#dc2626', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
                      <span aria-hidden="true" style={{ flexShrink: 0 }}><FontAwesomeIcon icon={faCircleExclamation} /></span>
                      <span>{formErr}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { setModal(false); resetForm(); }} 
                    style={{ padding: '0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500, background: '#fff', color: '#000' }}
                  >
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={saving || showAddSupplier} style={{ padding: '0.625rem 1rem', border: 'none', borderRadius: 6, background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                    {saving
                      ? <><span className="spinner" style={{ width: 14, height: 14, display: 'inline-block', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> {t('loading')}</>
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
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999, opacity: 1, visibility: 'visible' }} 
          onClick={() => setDeleteId(null)}
        >
          <div 
            style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#dc2626' }}><FontAwesomeIcon icon={faTrash} /></div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>{t('confirm_delete')}</h3>
              <p style={{ fontSize: '0.875rem', margin: '0', color: '#6b7280' }}>{lang === 'ar' ? 'لا يمكن التراجع' : 'Cannot be undone'}</p>
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