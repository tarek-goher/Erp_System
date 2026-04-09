'use client'

// ══════════════════════════════════════════════════════════
// app/inventory/page.tsx — صفحة المخزون والمنتجات
// API: GET/POST /api/products | GET /api/categories
// POST /api/products/{id}/adjust-stock → تعديل المخزون
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent, useRef } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Product = {
  id: number
  name: string
  sku: string
  barcode?: string
  qty: number
  price: number
  cost?: number
  category?: { name: string }
  status: string
}
type Category = { id: number; name: string }

// ── توليد SKU تلقائي لو المستخدم ما كتبش ──────────────
const generateSku = () => 'SKU-' + Date.now().toString(36).toUpperCase()

export default function InventoryPage() {
  const { t, lang } = useI18n()
  const [items,       setItems]       = useState<Product[]>([])
  const [categories,  setCategories]  = useState<Category[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [modal,       setModal]       = useState(false)
  const [adjustModal, setAdjustModal] = useState<Product | null>(null)
  const [deleteId,    setDeleteId]    = useState<number | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [formErr,     setFormErr]     = useState('')
  const [adjustQty,   setAdjustQty]   = useState('')
  const [adjustNote,  setAdjustNote]  = useState('')
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const newCatInputRef  = useRef<HTMLInputElement>(null)

  // ── إضافة فئة جديدة inline ────────────────────────────
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [savingCat,  setSavingCat]  = useState('')

  const handleAddCategory = async () => {
    const name = newCatName.trim()
    if (!name) return
    setSavingCat('saving')
    const res = await api.post('/categories', { name })
    if (res.error) { setSavingCat(''); alert(res.error); return }
    const created: Category = res.data?.id ? res.data : { id: res.data?.data?.id, name }
    setCategories(prev => [...prev, created])
    setForm(f => ({ ...f, category_id: String(created.id) }))
    setNewCatName('')
    setShowNewCat(false)
    setSavingCat('')
  }

  const [form, setForm] = useState({
    name:           '',
    sku:            '',
    barcode:        '',
    price:          '',
    purchase_price: '',
    qty:            '',
    category_id:    '',
    description:    '',
  })

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }) })
    const res = await api.get<{ data: Product[] | { data: Product[] } }>(`/products?${p}`)
    if (res.data) setItems(extractArray(res.data))
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search])

  useEffect(() => {
    api.get<{ data: Category[] }>('/categories?per_page=100').then(r => {
      if (r.data) setCategories(extractArray(r.data))
    })
  }, [])

  const resetForm = () => setForm({
    name: '', sku: '', barcode: '', price: '', purchase_price: '',
    qty: '', category_id: '', description: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')

    if (!form.name || !form.price || !form.category_id) {
      setFormErr(
        lang === 'ar'
          ? 'الاسم، سعر البيع، والتصنيف مطلوبون'
          : 'Name, selling price, and category are required'
      )
      return
    }

    setSaving(true)
    const res = await api.post('/products', {
      name:        form.name,
      sku:         form.sku || generateSku(),
      barcode:     form.barcode || undefined,
      category_id: Number(form.category_id),
      price:       Number(form.price),
      cost:        form.purchase_price ? Number(form.purchase_price) : undefined,
      qty:         Number(form.qty) || 0,
      description: form.description || undefined,
    })
    setSaving(false)

    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    resetForm()
    fetchItems()
  }

  const handleAdjust = async (e: FormEvent) => {
    e.preventDefault()
    if (!adjustModal || !adjustQty) return
    setSaving(true)
    const res = await api.post(`/products/${adjustModal.id}/adjust-stock`, {
      quantity: Number(adjustQty),
      notes:    adjustNote,
    })
    setSaving(false)
    if (res.error) { alert(res.error); return }
    setAdjustModal(null)
    setAdjustQty('')
    setAdjustNote('')
    fetchItems()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await api.delete(`/products/${deleteId}`)
    if (res.error) { alert(res.error); return }
    setDeleteId(null)
    setItems(p => p.filter(i => i.id !== deleteId))
  }

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.preventDefault()
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  const stockBadge = (q: number) => {
    if (q <= 0)  return 'badge-danger'
    if (q <= 10) return 'badge-warning'
    return 'badge-success'
  }

  const calcMargin = (sale: number, purchase: number) => {
    if (!purchase || purchase <= 0 || !sale || sale <= 0) return null
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
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
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
                  // ✅ إصلاح: cost بدل purchase_price في الـ type
                  const margin = calcMargin(item.price, item.cost && item.cost > 0 ? item.cost : 0)
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
                      {/* ✅ إصلاح: cost بدل purchase_price */}
                      <td className="text-muted">{item.cost && item.cost > 0 ? fmt(item.cost) : '—'}</td>
                      <td className="fw-semibold">{fmt(item.price)}</td>
                      <td>
                        {margin !== null ? (
                          <span style={{
                            color: Number(margin) >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                            fontWeight: 600,
                          }}>
                            {Number(margin) >= 0 ? '+' : ''}{margin}%
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {/* ✅ إصلاح: item.qty بدل item.quantity */}
                        <span className={`badge ${stockBadge(item.qty)}`}>{fmt(item.qty)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setAdjustModal(item)}>
                            {lang === 'ar' ? 'تعديل كمية' : 'Adjust'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>
                            {t('delete')}
                          </button>
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

      {/* ── Modal: إضافة منتج ─────────────────────────── */}
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
                    <input
                      className="input"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  {/* SKU */}
                  <div className="input-group">
                    <label className="input-label">
                      SKU
                      <small style={{ color: 'var(--text-muted)', fontWeight: 400, marginInlineStart: '0.5rem' }}>
                        {lang === 'ar' ? '(اختياري — يُولَّد تلقائياً)' : '(optional — auto-generated)'}
                      </small>
                    </label>
                    <input
                      className="input"
                      value={form.sku}
                      onChange={e => setForm({ ...form, sku: e.target.value })}
                      placeholder={lang === 'ar' ? 'كود المنتج' : 'Product code'}
                    />
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

                  {/* التصنيف */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('category')} *</label>

                    {!showNewCat ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          className="input"
                          value={form.category_id}
                          onChange={e => setForm({ ...form, category_id: e.target.value })}
                          required
                          style={{ flex: 1 }}
                        >
                          <option value="">
                            {lang === 'ar' ? '— اختر التصنيف —' : '— Select Category —'}
                          </option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => { setShowNewCat(true); setTimeout(() => newCatInputRef.current?.focus(), 50) }}
                          title={lang === 'ar' ? 'إضافة فئة جديدة' : 'Add new category'}
                          style={{ whiteSpace: 'nowrap', padding: '0 0.75rem' }}
                        >
                          ➕ {lang === 'ar' ? 'إضافة فئة' : 'Add Category'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          ref={newCatInputRef}
                          className="input"
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() }
                            if (e.key === 'Escape') { setShowNewCat(false); setNewCatName('') }
                          }}
                          placeholder={lang === 'ar' ? 'اسم الفئة الجديدة...' : 'New category name...'}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleAddCategory}
                          disabled={!newCatName.trim() || savingCat === 'saving'}
                          style={{ whiteSpace: 'nowrap', padding: '0 0.75rem' }}
                        >
                          {savingCat === 'saving'
                            ? (lang === 'ar' ? 'جاري...' : 'Saving...')
                            : (lang === 'ar' ? '✓ حفظ' : '✓ Save')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => { setShowNewCat(false); setNewCatName('') }}
                          style={{ padding: '0 0.75rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
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
                    {form.purchase_price && form.price && (
                      <small style={{
                        marginTop: '0.25rem',
                        display: 'block',
                        fontSize: '0.75rem',
                        color: Number(form.price) >= Number(form.purchase_price)
                          ? 'var(--color-success)'
                          : 'var(--color-danger)',
                        fontWeight: 600,
                      }}>
                        {lang === 'ar' ? 'هامش الربح:' : 'Margin:'}
                        {' '}{calcMargin(Number(form.price), Number(form.purchase_price))}%
                      </small>
                    )}
                  </div>

                  {/* الكمية */}
                  <div className="input-group">
                    <label className="input-label">{t('quantity')}</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={form.qty}
                      onChange={e => setForm({ ...form, qty: e.target.value })}
                    />
                  </div>

                  {/* الوصف */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('description')}</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                </div>

                {formErr && (
                  <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    ⚠️ {formErr}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: تعديل المخزون ──────────────────────── */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {lang === 'ar'
                  ? `تعديل مخزون: ${adjustModal.name}`
                  : `Adjust Stock: ${adjustModal.name}`}
              </h3>
              <button className="btn-icon" onClick={() => setAdjustModal(null)}>✕</button>
            </div>
            <form onSubmit={handleAdjust}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">
                      {lang === 'ar' ? 'الكمية الجديدة' : 'New Quantity'} *
                    </label>
                    <input
                      className="input"
                      type="number"
                      value={adjustQty}
                      onChange={e => setAdjustQty(e.target.value)}
                      required
                    />
                    {/* ✅ إصلاح: adjustModal.qty بدل adjustModal.quantity */}
                    <small className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {lang === 'ar'
                        ? `المخزون الحالي: ${adjustModal.qty}`
                        : `Current stock: ${adjustModal.qty}`}
                    </small>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('notes')}</label>
                    <input
                      className="input"
                      value={adjustNote}
                      onChange={e => setAdjustNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustModal(null)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: تأكيد الحذف ────────────────────────── */}
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