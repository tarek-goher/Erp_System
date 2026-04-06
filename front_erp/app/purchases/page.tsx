'use client'

// ══════════════════════════════════════════════════════════
// app/purchases/page.tsx — صفحة المشتريات (FIXED)
// API: GET/POST /api/purchases | GET /api/suppliers | GET /api/tax-rates
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Purchase = {
  id: number; order_number: string
  supplier?: { name: string }
  total: number; tax_amount?: number; status: string; created_at: string
}
type Supplier = { id: number; name: string }
type TaxRate  = { id: number; name: string; rate: number }
type Product  = { id: number; name: string; cost?: number; purchase_price?: number }

const STATUSES = ['draft', 'pending', 'approved', 'received', 'cancelled']

type OrderItem = { product_id: string; name: string; qty: number; cost: number }

export default function PurchasesPage() {
  const { t, lang } = useI18n()
  const [items,     setItems]     = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [taxRates,  setTaxRates]  = useState<TaxRate[]>([])
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal,     setModal]     = useState(false)
  const [deleteId,  setDeleteId]  = useState<number | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [formErr,   setFormErr]   = useState('')

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

  // أصناف الطلب
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { product_id: '', name: '', qty: 1, cost: 0 }
  ])

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams({
      per_page: '15',
      ...(search       && { search }),
      ...(statusFilter && { status: statusFilter }),
    })
    const res = await api.get<{ data: Purchase[] }>(`/purchases?${p}`)
    if (res.data) setItems(res.data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search, statusFilter])

  useEffect(() => {
    api.get<{ data: Supplier[] }>('/suppliers?per_page=200').then(r => {
      if (r.data) setSuppliers(r.data.data || [])
    })
    api.get<any>('/tax-rates').then(r => {
      if (r.data) setTaxRates(r.data.data || r.data || [])
    })
    api.get<{ data: Product[] }>('/products?per_page=200').then(r => {
      if (r.data) setProducts(r.data.data || [])
    })
  }, [])

  const handleAddSupplier = async (e: FormEvent) => {
    e.preventDefault(); setAddSupplierErr('')
    if (!newSupplierName.trim()) { setAddSupplierErr(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required'); return }
    setAddingSupplier(true)
    const res = await api.post('/suppliers', {
      name: newSupplierName.trim(),
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

  // حساب الإجمالي
  const subtotal = orderItems.reduce((s, i) => s + (i.qty * i.cost), 0)
  const selectedTax = taxRates.find(tx => String(tx.id) === form.tax_rate_id)
  const taxAmount = selectedTax ? Math.round(subtotal * selectedTax.rate) / 100 : 0
  const grandTotal = subtotal + taxAmount

  const addItem = () => setOrderItems(prev => [...prev, { product_id: '', name: '', qty: 1, cost: 0 }])
  const removeItem = (idx: number) => setOrderItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof OrderItem, val: any) => {
    setOrderItems(prev => {
      const arr = [...prev]
      arr[idx] = { ...arr[idx], [field]: val }
      // لو اختار منتج، اجيب سعره تلقائي
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
    const validItems = orderItems.filter(i => i.product_id && i.qty > 0 && i.cost >= 0)
    setSaving(true)
    const res = await api.post('/purchases', {
      supplier_id:   Number(form.supplier_id),
      status:        form.status,
      notes:         form.notes,
      expected_date: form.expected_date || undefined,
      items: validItems.map(i => ({ product_id: Number(i.product_id), qty: i.qty, cost: i.cost })),
      ...(form.tax_rate_id && { tax_rate_id: Number(form.tax_rate_id) }),
    })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ supplier_id: '', status: 'draft', notes: '', tax_rate_id: '', expected_date: '' })
    setOrderItems([{ product_id: '', name: '', qty: 1, cost: 0 }])
    setShowAddSupplier(false)
    fetchItems()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/purchases/${deleteId}`)
    setDeleteId(null); setItems(p => p.filter(i => i.id !== deleteId))
  }

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')
  const badge = (s: string) => ({
    approved: 'badge-success', received: 'badge-success',
    pending: 'badge-warning', draft: 'badge-muted', cancelled: 'badge-danger',
  }[s] || 'badge-muted')

  return (
    <ERPLayout pageTitle={t('purchases')}>
      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
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
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + {lang === 'ar' ? 'طلب شراء' : 'New Order'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🛒</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('number')}</th>
                  <th>{t('supplier')}</th>
                  <th>{t('total')}</th>
                  <th>{lang === 'ar' ? 'الضريبة' : 'Tax'}</th>
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
                    <td className="fw-semibold">{fmt(item.total)}</td>
                    <td className="text-muted">{item.tax_amount ? fmt(item.tax_amount) : '—'}</td>
                    <td><span className={`badge ${badge(item.status)}`}>{t(item.status) || item.status}</span></td>
                    <td className="text-muted">{fmtDate(item.created_at)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ Modal: طلب شراء جديد ══ */}
      {modal && (
        <div className="modal-overlay" onClick={() => { setModal(false); setShowAddSupplier(false) }}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{lang === 'ar' ? 'طلب شراء جديد' : 'New Purchase Order'}</h3>
              <button className="btn-icon" onClick={() => { setModal(false); setShowAddSupplier(false) }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">

                  {/* المورد */}
                  <div className="input-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ marginBottom: 0 }}>{t('supplier')} *</label>
                      <button type="button" onClick={() => { setShowAddSupplier(!showAddSupplier); setAddSupplierErr('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                        {showAddSupplier ? (lang === 'ar' ? '← رجوع للقائمة' : '← Back') : (lang === 'ar' ? '+ مورد جديد' : '+ New Supplier')}
                      </button>
                    </div>
                    {showAddSupplier ? (
                      <div style={{ border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: 'var(--color-primary-light)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input className="input" placeholder={lang === 'ar' ? 'الاسم *' : 'Name *'} value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} autoFocus />
                          <input className="input" placeholder={lang === 'ar' ? 'البريد (اختياري)' : 'Email (optional)'} type="email" value={newSupplierEmail} onChange={e => setNewSupplierEmail(e.target.value)} />
                          <input className="input" placeholder={lang === 'ar' ? 'الهاتف (اختياري)' : 'Phone (optional)'} value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} />
                          {addSupplierErr && <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>⚠️ {addSupplierErr}</div>}
                          <button type="button" className="btn btn-primary btn-sm" onClick={handleAddSupplier} disabled={addingSupplier} style={{ alignSelf: 'flex-start' }}>
                            {addingSupplier ? '⏳...' : (lang === 'ar' ? '✓ حفظ المورد' : '✓ Save Supplier')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <select className="input" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} required>
                        <option value="">{suppliers.length === 0 ? (lang === 'ar' ? '← اضغط "+ مورد جديد"' : '← Click "+ New Supplier"') : (lang === 'ar' ? 'اختر المورد' : 'Select Supplier')}</option>
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
                      {taxRates.map(tx => <option key={tx.id} value={tx.id}>{tx.name} ({tx.rate}%)</option>)}
                    </select>
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

                {/* ── أصناف الطلب ── */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="fw-semibold">{lang === 'ar' ? 'أصناف الطلب' : 'Order Items'}</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {orderItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                        <select className="input" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                          <option value="">{lang === 'ar' ? 'اختر منتج' : 'Select Product'}</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input className="input" type="number" min="0.001" step="0.001" placeholder={lang === 'ar' ? 'الكمية' : 'Qty'} value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} />
                        <input className="input" type="number" min="0" step="0.01" placeholder={lang === 'ar' ? 'سعر التكلفة' : 'Cost'} value={item.cost} onChange={e => updateItem(idx, 'cost', Number(e.target.value))} />
                        <button type="button" className="btn-icon" onClick={() => removeItem(idx)} style={{ color: 'var(--color-danger)' }}>✕</button>
                      </div>
                    ))}
                  </div>

                  {/* ملخص الإجمالي */}
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <strong>{fmt(subtotal)}</strong></div>
                    {selectedTax && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? `ضريبة ${selectedTax.rate}%:` : `Tax ${selectedTax.rate}%:`} <strong>{fmt(taxAmount)}</strong></div>}
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{lang === 'ar' ? 'الإجمالي:' : 'Total:'} {fmt(grandTotal)}</div>
                  </div>
                </div>

                {formErr && <div className="login-error" style={{ marginTop: '1rem' }}><span>⚠️</span> {formErr}</div>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setModal(false); setShowAddSupplier(false) }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving || showAddSupplier}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('loading')}</> : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
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
