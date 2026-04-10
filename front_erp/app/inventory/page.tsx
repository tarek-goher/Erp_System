'use client'

// ══════════════════════════════════════════════════════════
// app/inventory/page.tsx — صفحة المخزون والمنتجات
// API: GET/POST /api/products | GET /api/categories
// POST /api/products/{id}/adjust-stock → تعديل المخزون
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  
  // لضمان عمل الـ Portal بدون أخطاء Hydration
  const [isMounted, setIsMounted] = useState(false)
  
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
    if (res.data) setItems(extractArray(res.data) || [])
    setLoading(false)
  }

  useEffect(() => { 
    setIsMounted(true)
    fetchItems() 
  }, [search])

  useEffect(() => {
    api.get<{ data: Category[] }>('/categories?per_page=100').then(r => {
      if (r.data) setCategories(extractArray(r.data) || [])
    })
  }, [])

  const resetForm = () => setForm({
    name: '', sku: '', barcode: '', price: '', purchase_price: '',
    qty: '', category_id: '', description: '',
  })

  // ── فتح مودال منتج جديد ──
  const handleOpenNewProduct = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    resetForm();
    setFormErr('');
    setModal(true);
  }

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
    fetchItems() // تحديث القائمة من الخادم
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
        <button type="button" className="btn btn-primary" onClick={handleOpenNewProduct}>
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
                        <span className={`badge ${stockBadge(item.qty)}`}>{fmt(item.qty)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdjustModal(item)}>
                            {lang === 'ar' ? 'تعديل كمية' : 'Adjust'}
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>
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
      {modal && isMounted && createPortal(
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999, opacity: 1, visibility: 'visible' }} 
          onClick={() => setModal(false)}
        >
          <div 
            style={{ maxWidth: 600, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{lang === 'ar' ? 'منتج جديد' : 'New Product'}</h3>
              <button type="button" onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                  {/* الاسم */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>{t('name')} *</label>
                    <input
                      className="input"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                      autoFocus
                      style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* SKU */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>
                      SKU
                      <small style={{ color: '#6b7280', fontWeight: 400, marginInlineStart: '0.5rem' }}>
                        {lang === 'ar' ? '(اختياري)' : '(optional)'}
                      </small>
                    </label>
                    <input
                      className="input"
                      value={form.sku}
                      onChange={e => setForm({ ...form, sku: e.target.value })}
                      placeholder={lang === 'ar' ? 'كود المنتج' : 'Product code'}
                      style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* الباركود */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>
                      📷 {lang === 'ar' ? 'الباركود' : 'Barcode'}
                      <small style={{ color: '#6b7280', fontWeight: 400, marginInlineStart: '0.5rem' }}>
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
                      style={{ fontFamily: 'monospace', letterSpacing: '0.05em', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* التصنيف */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>{t('category')} *</label>

                    {!showNewCat ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          className="input"
                          value={form.category_id}
                          onChange={e => setForm({ ...form, category_id: e.target.value })}
                          required
                          style={{ flex: 1, padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000' }}
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
                          style={{ whiteSpace: 'nowrap', padding: '0 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer', color: '#000' }}
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
                          style={{ flex: 1, padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000' }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleAddCategory}
                          disabled={!newCatName.trim() || savingCat === 'saving'}
                          style={{ whiteSpace: 'nowrap', padding: '0.625rem 0.75rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        >
                          {savingCat === 'saving'
                            ? (lang === 'ar' ? 'جاري...' : 'Saving...')
                            : (lang === 'ar' ? '✓ حفظ' : '✓ Save')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => { setShowNewCat(false); setNewCatName('') }}
                          style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer', color: '#000' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* سعر الشراء */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>{lang === 'ar' ? 'سعر الشراء' : 'Purchase Price'}</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchase_price}
                      onChange={e => setForm({ ...form, purchase_price: e.target.value })}
                      placeholder="0.00"
                      style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* سعر البيع */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>{lang === 'ar' ? 'سعر البيع' : 'Selling Price'} *</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      required
                      placeholder="0.00"
                      style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                    {form.purchase_price && form.price && (
                      <small style={{
                        marginTop: '0.25rem',
                        display: 'block',
                        fontSize: '0.75rem',
                        color: Number(form.price) >= Number(form.purchase_price)
                          ? '#15803d'
                          : '#dc2626',
                        fontWeight: 600,
                      }}>
                        {lang === 'ar' ? 'هامش الربح:' : 'Margin:'}
                        {' '}{calcMargin(Number(form.price), Number(form.purchase_price))}%
                      </small>
                    )}
                  </div>

                  {/* الكمية */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>{t('quantity')}</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={form.qty}
                      onChange={e => setForm({ ...form, qty: e.target.value })}
                      style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* الوصف */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>{t('description')}</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      style={{ resize: 'vertical', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                </div>

                {formErr && (
                  <div style={{ color: '#dc2626', background: 'rgba(220,38,38,0.1)', padding: '0.5rem', borderRadius: 4, marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    ⚠️ {formErr}
                  </div>
                )}
              </div>
              <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModal(false)} style={{ padding: '0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500, background: '#fff', color: '#000' }}>
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving} style={{ padding: '0.625rem 1rem', border: 'none', borderRadius: 6, background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* ── Modal: تعديل المخزون ──────────────────────── */}
      {adjustModal && isMounted && createPortal(
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999, opacity: 1, visibility: 'visible' }} 
          onClick={() => setAdjustModal(null)}
        >
          <div 
            style={{ maxWidth: 420, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                {lang === 'ar'
                  ? `تعديل مخزون: ${adjustModal.name}`
                  : `Adjust Stock: ${adjustModal.name}`}
              </h3>
              <button type="button" onClick={() => setAdjustModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>
                      {lang === 'ar' ? 'الكمية الجديدة' : 'New Quantity'} *
                    </label>
                    <input
                      className="input"
                      type="number"
                      value={adjustQty}
                      onChange={e => setAdjustQty(e.target.value)}
                      required
                      style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {lang === 'ar'
                        ? `المخزون الحالي: ${adjustModal.qty}`
                        : `Current stock: ${adjustModal.qty}`}
                    </small>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>{t('notes')}</label>
                    <input
                      className="input"
                      value={adjustNote}
                      onChange={e => setAdjustNote(e.target.value)}
                      style={{ padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: '#000', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setAdjustModal(null)} style={{ padding: '0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500, background: '#fff', color: '#000' }}>
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving} style={{ padding: '0.625rem 1rem', border: 'none', borderRadius: 6, background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* ── Modal: تأكيد الحذف ────────────────────────── */}
      {deleteId && isMounted && createPortal(
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999, opacity: 1, visibility: 'visible' }} 
          onClick={() => setDeleteId(null)}
        >
          <div 
            style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>{t('confirm_delete')}</h3>
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setDeleteId(null)} style={{ padding: '0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500, background: '#fff', color: '#000' }}>{t('cancel')}</button>
              <button type="button" onClick={handleDelete} style={{ padding: '0.625rem 1rem', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>{t('delete')}</button>
            </div>
          </div>
        </div>, document.body
      )}

    </ERPLayout>
  )
}