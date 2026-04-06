'use client'

// ══════════════════════════════════════════════════════════
// app/inventory/page.tsx — صفحة المخزون والمنتجات
// API: GET/POST /api/products | GET /api/categories
// POST /api/products/{id}/adjust-stock → تعديل المخزون
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent, useRef } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Product = {
  id: number
  name: string
  sku: string
  barcode?: string
  quantity: number
  price: number           // سعر البيع
  purchase_price?: number // سعر الشراء
  category?: { name: string }
  status: string
}
type Category = { id: number; name: string }

export default function InventoryPage() {
  const { t, lang } = useI18n()
  const [items,      setItems]      = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [modal,      setModal]      = useState(false)
  const [adjustModal, setAdjustModal] = useState<Product | null>(null)
  const [deleteId,   setDeleteId]   = useState<number | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [formErr,    setFormErr]    = useState('')
  const [adjustQty,  setAdjustQty]  = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',           // سعر البيع
    purchase_price: '',  // سعر الشراء
    quantity: '',
    category_name: '',
    description: '',
  })

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }) })
    const res = await api.get<{ data: Product[] }>(`/products?${p}`)
    if (res.data) setItems(res.data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search])
  useEffect(() => {
    api.get<{ data: Category[] }>('/categories?per_page=100').then(r => {
      if (r.data) setCategories(r.data.data || [])
    })
  }, [])

  const resetForm = () => setForm({
    name: '', sku: '', barcode: '', price: '', purchase_price: '',
    quantity: '', category_name: '', description: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.name || !form.price) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/products', {
      name:           form.name,
      sku:            form.sku || undefined,
      barcode:        form.barcode || undefined,
      price:          Number(form.price),
      purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
      quantity:       Number(form.quantity) || 0,
      category_name:  form.category_name || undefined,
      description:    form.description || undefined,
    })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false); resetForm(); fetchItems()
  }

  const handleAdjust = async (e: FormEvent) => {
    e.preventDefault()
    if (!adjustModal || !adjustQty) return
    setSaving(true)
    const res = await api.post(`/products/${adjustModal.id}/adjust-stock`, {
      quantity: Number(adjustQty),
      notes: adjustNote,
    })
    setSaving(false)
    if (res.error) { alert(res.error); return }
    setAdjustModal(null); setAdjustQty(''); setAdjustNote(''); fetchItems()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/products/${deleteId}`)
    setDeleteId(null); setItems(p => p.filter(i => i.id !== deleteId))
  }

  // ── مسح حقل الباركود بالسكانر (Enter بعد القراءة) ──
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault() // لا يحفظ الفورم
      // يمكن إضافة بحث عن المنتج بالباركود هنا
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  const stockBadge = (q: number) => {
    if (q <= 0)  return 'badge-danger'
    if (q <= 10) return 'badge-warning'
    return 'badge-success'
  }

  // حساب هامش الربح
  const calcMargin = (sale: number, purchase: number) => {
    if (!purchase || !sale) return null
    return (((sale - purchase) / purchase) * 100).toFixed(1)
  }

  return (
    <ERPLayout pageTitle={t('inventory')}>
      <div className="toolbar">
        <div className="search-bar">
          <span>🔍</span>
          <input
            placeholder={lang === 'ar' ? 'بحث في المنتجات أو الباركود...' : 'Search products or barcode...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setModal(true) }}>
          + {lang === 'ar' ? 'منتج جديد' : 'New Product'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📦</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>SKU / {lang === 'ar' ? 'باركود' : 'Barcode'}</th>
                  <th>{t('category')}</th>
                  <th>{lang === 'ar' ? 'سعر الشراء' : 'Buy Price'}</th>
                  <th>{lang === 'ar' ? 'سعر البيع' : 'Sell Price'}</th>
                  <th>{lang === 'ar' ? 'هامش %' : 'Margin %'}</th>
                  <th>{lang === 'ar' ? 'المخزون' : 'Stock'}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const margin = calcMargin(item.price, item.purchase_price ?? 0)
                  return (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.name}</td>
                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {item.sku && <span>{item.sku}</span>}
                        {item.sku && item.barcode && <span style={{ margin: '0 4px' }}>|</span>}
                        {item.barcode && <span style={{ fontFamily: 'monospace' }}>📷 {item.barcode}</span>}
                        {!item.sku && !item.barcode && '—'}
                      </td>
                      <td>{item.category?.name || '—'}</td>
                      <td className="text-muted">{item.purchase_price ? fmt(item.purchase_price) : '—'}</td>
                      <td className="fw-semibold">{fmt(item.price)}</td>
                      <td>
                        {margin !== null ? (
                          <span style={{ color: Number(margin) >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                            {Number(margin) >= 0 ? '+' : ''}{margin}%
                          </span>
                        ) : '—'}
                      </td>
                      <td><span className={`badge ${stockBadge(item.quantity)}`}>{fmt(item.quantity)}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setAdjustModal(item)}>
                            {lang === 'ar' ? 'تعديل كمية' : 'Adjust'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: إضافة منتج ───────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">{lang === 'ar' ? 'منتج جديد' : 'New Product'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">

                  {/* الاسم */}
                  <div className="input-group">
                    <label className="input-label">{t('name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
                  </div>

                  {/* SKU */}
                  <div className="input-group">
                    <label className="input-label">SKU</label>
                    <input className="input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                      placeholder={lang === 'ar' ? 'كود المنتج' : 'Product code'} />
                  </div>

                  {/* الباركود */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">
                      📷 {lang === 'ar' ? 'الباركود' : 'Barcode'}
                      <small style={{ color: 'var(--text-muted)', fontWeight: 400, marginInlineStart: '0.5rem' }}>
                        {lang === 'ar' ? '(يمكن استخدام ماسح الباركود)' : '(barcode scanner supported)'}
                      </small>
                    </label>
                    <input
                      ref={barcodeInputRef}
                      className="input"
                      value={form.barcode}
                      onChange={e => setForm({ ...form, barcode: e.target.value })}
                      onKeyDown={handleBarcodeKeyDown}
                      placeholder={lang === 'ar' ? 'امسح أو اكتب الباركود...' : 'Scan or type barcode...'}
                      style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                    />
                  </div>

                  {/* سعر الشراء */}
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'سعر الشراء' : 'Purchase Price'}</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchase_price}
                      onChange={e => setForm({ ...form, purchase_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  {/* سعر البيع */}
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'سعر البيع' : 'Selling Price'} *</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                    {/* عرض هامش الربح لحظياً */}
                    {form.purchase_price && form.price && (
                      <small style={{
                        marginTop: '0.25rem',
                        display: 'block',
                        fontSize: '0.75rem',
                        color: Number(form.price) >= Number(form.purchase_price) ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 600,
                      }}>
                        {lang === 'ar' ? 'هامش الربح:' : 'Margin:'} {calcMargin(Number(form.price), Number(form.purchase_price))}%
                      </small>
                    )}
                  </div>

                  {/* الكمية */}
                  <div className="input-group">
                    <label className="input-label">{t('quantity')}</label>
                    <input className="input" type="number" min="0" value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  </div>

                  {/* الفئة */}
                  <div className="input-group">
                    <label className="input-label">{t('category')} {lang === 'ar' ? '(اكتبها بحرية)' : '(type freely)'}</label>
                    <input
                      className="input"
                      value={form.category_name}
                      onChange={e => setForm({ ...form, category_name: e.target.value })}
                      placeholder={lang === 'ar' ? 'مثال: إلكترونيات، ملابس...' : 'e.g. Electronics, Clothing...'}
                      list="categories-list"
                    />
                    <datalist id="categories-list">
                      {categories.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>

                  {/* الوصف */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('description')}</label>
                    <textarea className="input" rows={2} value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
                  </div>
                </div>
                {formErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {formErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: تعديل المخزون ─────────────────────── */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {lang === 'ar' ? `تعديل مخزون: ${adjustModal.name}` : `Adjust Stock: ${adjustModal.name}`}
              </h3>
              <button className="btn-icon" onClick={() => setAdjustModal(null)}>✕</button>
            </div>
            <form onSubmit={handleAdjust}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الكمية الجديدة' : 'New Quantity'} *</label>
                    <input className="input" type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} required />
                    <small className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {lang === 'ar' ? `المخزون الحالي: ${adjustModal.quantity}` : `Current stock: ${adjustModal.quantity}`}
                    </small>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('notes')}</label>
                    <input className="input" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustModal(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: تأكيد الحذف ───────────────────────── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3>{t('confirm_delete')}</h3>
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
