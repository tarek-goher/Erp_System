'use client'

import { useState, useEffect, FormEvent, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

// ── Types ─────────────────────────────────────────────────
type Product = {
  id: number
  name: string
  sku: string
  barcode?: string
  qty: number
   locations?: { warehouse_id: number; qty: number }[]
  min_qty?: number
  price: number
  cost?: number
  purchase_price?: number
  unit?: string
  is_active: boolean
  status?: string
  category?: { id: number; name: string }
  warehouse?: { id: number; name: string }
  reserved_qty?: number
  available_qty?: number
}

type Category   = { id: number; name: string }
type Warehouse  = { id: number; name: string; is_active?: boolean }

type StockMovement = {
  id: number
  type: 'in' | 'out' | 'adjustment' | 'transfer_in' | 'transfer_out'
  qty: number
  qty_before: number
  qty_after: number
  notes?: string
  created_at: string
  product?: { name: string }
  warehouse?: { name: string }
  user?: { name: string }
}

type Tab = 'products' | 'movements'
type ActionType = 'in' | 'out' | 'adjustment' | 'transfer'

const generateSku = () => 'SKU-' + Date.now().toString(36).toUpperCase()

// ── Badge helpers ─────────────────────────────────────────
const stockBadge = (q: number, min = 0) => {
  if (q <= 0)            return 'badge-danger'
  if (min && q <= min)   return 'badge-warning'
  return 'badge-success'
}

const movementColor: Record<string, string> = {
  in:            '#16a34a',
  transfer_in:   '#0284c7',
  out:           '#dc2626',
  transfer_out:  '#ea580c',
  adjustment:    '#7c3aed',
}

const movementIcon: Record<string, string> = {
  in:            '⬆️',
  transfer_in:   '↩️',
  out:           '⬇️',
  transfer_out:  '↪️',
  adjustment:    '⚙️',
}

// ══════════════════════════════════════════════════════════
export default function InventoryPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'

  const [isMounted,   setIsMounted]   = useState(false)
  const [activeTab,   setActiveTab]   = useState<Tab>('products')

  // ── Products state ────────────────────────────────────
  const [items,       setItems]       = useState<Product[]>([])
  const [categories,  setCategories]  = useState<Category[]>([])
  const [warehouses,  setWarehouses]  = useState<Warehouse[]>([])
  const [loading,     setLoading]     = useState(true)

  // ── Filters ───────────────────────────────────────────
  const [search,          setSearch]          = useState('')
  const [filterCategory,  setFilterCategory]  = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState('')
  const [filterStatus,    setFilterStatus]    = useState('')
  const [sortBy,          setSortBy]          = useState('')
  const [showLowStock,    setShowLowStock]    = useState(false)

  // ── Movements state ───────────────────────────────────
  const [movements,     setMovements]     = useState<StockMovement[]>([])
  const [movLoading,    setMovLoading]    = useState(false)
  const [movFilterType, setMovFilterType] = useState('')
  const [movFilterProd, setMovFilterProd] = useState('')

  // ── Modals ────────────────────────────────────────────
  const [modal,       setModal]       = useState(false)
  const [actionModal, setActionModal] = useState<{ product: Product; type: ActionType } | null>(null)
  const [deleteId,    setDeleteId]    = useState<number | null>(null)
  const [detailModal, setDetailModal] = useState<Product | null>(null)

  // ── Form ──────────────────────────────────────────────
  const [saving,  setSaving]  = useState(false)
  const [formErr, setFormErr] = useState('')
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', price: '',
    purchase_price: '', qty: '', min_qty: '',
    category_id: '', unit: '', description: '',
    warehouse_id: '',
    is_active: true,
  })

  // ── Action form ───────────────────────────────────────
  const [actionQty,         setActionQty]         = useState('')
  const [actionNote,        setActionNote]         = useState('')
  const [actionWarehouse,   setActionWarehouse]    = useState('')
  const [actionWarehouseTo, setActionWarehouseTo]  = useState('')

  // ── Category inline add ───────────────────────────────
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [savingCat,  setSavingCat]  = useState(false)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const newCatInputRef  = useRef<HTMLInputElement>(null)

  // ── Fetch products ────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '50' })
    if (search)          p.set('search',       search)
    if (filterCategory)  p.set('category_id',  filterCategory)
    if (filterWarehouse) p.set('warehouse_id', filterWarehouse)
    if (filterStatus)    p.set('status',       filterStatus)
    if (sortBy)          p.set('sort_by',      sortBy)
    if (showLowStock)    p.set('low_stock',    '1')
    const res = await api.get<any>(`/products?${p}`)
    if (res.data) setItems(extractArray(res.data) || [])
    setLoading(false)
  }, [search, filterCategory, filterWarehouse, filterStatus, sortBy, showLowStock])

  // ── Fetch movements ───────────────────────────────────
  const fetchMovements = useCallback(async () => {
    setMovLoading(true)
    const p = new URLSearchParams({ per_page: '50' })
    if (movFilterType) p.set('type',       movFilterType)
    if (movFilterProd) p.set('product_id', movFilterProd)
    const res = await api.get<any>(`/stock-movements?${p}`)
    if (res.data) setMovements(extractArray(res.data) || [])
    setMovLoading(false)
  }, [movFilterType, movFilterProd])

  useEffect(() => { setIsMounted(true) }, [])
  useEffect(() => { fetchItems() },     [fetchItems])
  useEffect(() => {
    if (activeTab === 'movements') fetchMovements()
  }, [activeTab, fetchMovements])

  useEffect(() => {
    api.get<any>('/categories?per_page=100').then(r => {
      if (r.data) setCategories(extractArray(r.data) || [])
    })
    api.get<any>('/warehouses?per_page=100').then(r => {
      if (r.data) setWarehouses(extractArray(r.data) || [])
    })
  }, [])

  // ── Reset form ────────────────────────────────────────
  const resetForm = () => setForm({
    name: '', sku: '', barcode: '', price: '',
    purchase_price: '', qty: '', min_qty: '',
    category_id: '', unit: '', description: '',
    warehouse_id: '',
    is_active: true,
  })

  // ── Add product ────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')

    if (!form.name.trim()) {
      setFormErr(ar ? 'اسم المنتج مطلوب' : 'Product name is required')
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      setFormErr(ar ? 'سعر البيع مطلوب' : 'Selling price is required')
      return
    }
    // ── FIX: منع سعر البيع أقل من سعر الشراء ──────────
    if (form.purchase_price && Number(form.price) < Number(form.purchase_price)) {
      setFormErr(ar
        ? `⚠️ سعر البيع (${form.price}) أقل من سعر الشراء (${form.purchase_price}) — يرجى المراجعة`
        : `⚠️ Selling price (${form.price}) is less than purchase price (${form.purchase_price}) — please review`)
      return
    }
    if (!form.category_id) {
      setFormErr(ar ? 'التصنيف مطلوب' : 'Category is required')
      return
    }

    setSaving(true)

    const payload: Record<string, any> = {
      name:        form.name.trim(),
      sku:         form.sku.trim() || generateSku(),
      category_id: Number(form.category_id),
      price:       Number(form.price),
      is_active:   form.is_active,
    }

    if (form.barcode.trim())      payload.barcode      = form.barcode.trim()
    if (form.purchase_price)      payload.cost         = Number(form.purchase_price)
    if (form.unit)                payload.unit         = form.unit
    if (form.description.trim())  payload.description  = form.description.trim()
    if (form.qty)                 payload.qty          = Number(form.qty)
    if (form.min_qty)             payload.min_qty      = Number(form.min_qty)
    if (form.warehouse_id)        payload.warehouse_id = Number(form.warehouse_id)

    const res = await api.post('/products', payload)
    setSaving(false)

    if (res.error) {
      setFormErr(res.error)
      return
    }

    setModal(false)
    resetForm()
    fetchItems()
  }

  // ── Stock action ────────────────────────────────────────
  const handleAction = async (e: FormEvent) => {
    e.preventDefault()
    if (!actionModal || !actionQty) return

    // Adjustment: warehouse اختياري
    if (actionModal.type !== 'adjustment' && !actionWarehouse) return
    // Transfer: لازم المخزنين
    if (actionModal.type === 'transfer' && (!actionWarehouse || !actionWarehouseTo)) return

    setSaving(true)

    try {
     if (actionModal.type === 'transfer') {
    const res = await api.post('/stock-movements/transfer', {
        product_id:        actionModal.product.id,
        from_warehouse_id: Number(actionWarehouse),
        to_warehouse_id:   Number(actionWarehouseTo),
        qty:               Number(actionQty),
        notes:             actionNote || undefined,
    })
    if (res.error) {
        alert(ar ? `خطأ: ${res.error}` : `Error: ${res.error}`)
        setSaving(false)
        return
    }
}else {
        const payload: Record<string, any> = {
          product_id: actionModal.product.id,
          type:       actionModal.type,
          qty:        Number(actionQty),
        }
        if (actionWarehouse) payload.warehouse_id = Number(actionWarehouse)
        if (actionNote)      payload.notes        = actionNote

        const res = await api.post('/stock-movements', payload)
        if (res.error) {
          alert(ar ? `خطأ: ${res.error}` : `Error: ${res.error}`)
          setSaving(false)
          return
        }
      }
    } catch (err) {
      alert(ar ? 'حدث خطأ غير متوقع' : 'Unexpected error occurred')
      setSaving(false)
      return
    }

    setSaving(false)
    setActionModal(null)
    setActionQty('')
    setActionNote('')
    setActionWarehouse('')
    setActionWarehouseTo('')
    fetchItems()
    if (activeTab === 'movements') fetchMovements()
  }

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    const res = await api.delete(`/products/${deleteId}`)
    if (res.error) { alert(res.error); return }
    setDeleteId(null)
    fetchItems()
  }

  // ── Toggle active ─────────────────────────────────────
  const handleToggleActive = async (product: Product) => {
    await api.patch(`/products/${product.id}`, { is_active: !product.is_active })
    fetchItems()
  }

  // ── Add category ──────────────────────────────────────
  const handleAddCategory = async () => {
    const name = newCatName.trim()
    if (!name) return
    setSavingCat(true)
    const res = await api.post('/categories', { name })
    if (res.error) { setSavingCat(false); alert(res.error); return }
    const created: Category = res.data?.id ? res.data : { id: res.data?.data?.id, name }
    setCategories(prev => [...prev, created])
    setForm(f => ({ ...f, category_id: String(created.id) }))
    setNewCatName('')
    setShowNewCat(false)
    setSavingCat(false)
  }

  // ── Helpers ───────────────────────────────────────────
  const fmt = (n: number) =>
    new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US').format(n || 0)

  const calcMargin = (sale: number, purchase: number) => {
    if (!purchase || purchase <= 0 || !sale || sale <= 0) return null
    return (((sale - purchase) / purchase) * 100).toFixed(1)
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString(ar ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const lowStockCount = items.filter(i => i.min_qty && i.qty <= i.min_qty).length
  const activeWarehouses = warehouses.filter(w => w.is_active !== false)

  const movementLabel: Record<string, { ar: string; en: string }> = {
    in:           { ar: 'وارد',        en: 'Stock In' },
    out:          { ar: 'صادر',        en: 'Stock Out' },
    adjustment:   { ar: 'تعديل',       en: 'Adjustment' },
    transfer_in:  { ar: 'تحويل وارد',  en: 'Transfer In' },
    transfer_out: { ar: 'تحويل صادر',  en: 'Transfer Out' },
  }

  const warehouseRequired = (type: ActionType) => type !== 'adjustment'

  // ── Price validation warning (real-time) ──────────────
  const priceWarning = form.purchase_price && form.price &&
    Number(form.price) > 0 && Number(form.purchase_price) > 0 &&
    Number(form.price) < Number(form.purchase_price)

  // ══════════════════════════════════════════════════════
  return (
    <ERPLayout pageTitle={t('inventory')}>

      {/* ── Reorder Alert Banner ─────────────────────── */}
      {lowStockCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
        }} onClick={() => { setShowLowStock(true); setActiveTab('products') }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <strong style={{ color: '#92400e', fontSize: '0.9rem' }}>
              {ar
                ? `تحذير: ${lowStockCount} منتج وصل للحد الأدنى`
                : `Warning: ${lowStockCount} product(s) reached reorder level`}
            </strong>
            <span style={{ color: '#b45309', fontSize: '0.8rem', marginInlineStart: '0.5rem' }}>
              {ar ? '— اضغط للعرض' : '— Click to view'}
            </span>
          </div>
          {showLowStock && (
            <button
              onClick={e => { e.stopPropagation(); setShowLowStock(false) }}
              style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '1rem' }}
            >✕</button>
          )}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '2px solid var(--border-color, #e5e7eb)' }}>
        {(['products', 'movements'] as Tab[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.625rem 1.25rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? '#1d4ed8' : 'var(--text-muted, #6b7280)',
              borderBottom: activeTab === tab ? '2px solid #1d4ed8' : '2px solid transparent',
              marginBottom: -2,
              fontSize: '0.9rem',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'products'
              ? (ar ? '📦 المنتجات' : '📦 Products')
              : (ar ? '📋 حركات المخزون' : '📋 Stock Movements')}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: Products                                  */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <>
          {/* ── Toolbar ────────────────────────────── */}
          <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="search-bar" style={{ flex: '1 1 200px', minWidth: 0 }}>
              <span>🔍</span>
              <input
                placeholder={ar ? 'بحث بالاسم أو SKU أو باركود...' : 'Search by name, SKU, barcode...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={filterSelectStyle}>
              <option value="">{ar ? 'كل الفئات' : 'All Categories'}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)} style={filterSelectStyle}>
              <option value="">{ar ? 'كل المخازن' : 'All Warehouses'}</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterSelectStyle}>
              <option value="">{ar ? 'كل الحالات' : 'All Status'}</option>
              <option value="active">{ar ? 'نشط' : 'Active'}</option>
              <option value="inactive">{ar ? 'غير نشط' : 'Inactive'}</option>
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={filterSelectStyle}>
              <option value="">{ar ? 'الترتيب' : 'Sort By'}</option>
              <option value="price_asc">{ar ? 'السعر ↑' : 'Price ↑'}</option>
              <option value="price_desc">{ar ? 'السعر ↓' : 'Price ↓'}</option>
              <option value="qty_asc">{ar ? 'الكمية ↑' : 'Qty ↑'}</option>
              <option value="qty_desc">{ar ? 'الكمية ↓' : 'Qty ↓'}</option>
            </select>

            <button
              type="button"
              onClick={() => setShowLowStock(!showLowStock)}
              style={{
                padding: '0.5rem 0.875rem',
                border: `1px solid ${showLowStock ? '#f59e0b' : '#d1d5db'}`,
                borderRadius: 6,
                background: showLowStock ? '#fef3c7' : 'transparent',
                color: showLowStock ? '#92400e' : 'var(--text-color, #374151)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: showLowStock ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              ⚠️ {ar ? 'مخزون منخفض' : 'Low Stock'}
              {lowStockCount > 0 && (
                <span style={{
                  marginInlineStart: '0.375rem',
                  background: '#f59e0b',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '0 5px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}>{lowStockCount}</span>
              )}
            </button>

            <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setFormErr(''); setModal(true) }}>
              + {ar ? 'منتج جديد' : 'New Product'}
            </button>
          </div>

          {/* ── Products Table ───────────────────────── */}
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
                      <th>SKU / {ar ? 'باركود' : 'Barcode'}</th>
                      <th>{t('category')}</th>
                      <th>{ar ? 'الوحدة' : 'Unit'}</th>
                      <th>{ar ? 'شراء' : 'Cost'}</th>
                      <th>{ar ? 'بيع' : 'Price'}</th>
                      <th>{ar ? 'هامش %' : 'Margin'}</th>
                      <th style={{ textAlign: 'center' }}>{ar ? 'متاح' : 'Available'}</th>
                      <th style={{ textAlign: 'center' }}>{ar ? 'فعلي' : 'On Hand'}</th>
                      <th style={{ textAlign: 'center' }}>{ar ? 'الحد الأدنى' : 'Min Qty'}</th>
                      <th>{ar ? 'الحالة' : 'Status'}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const margin    = calcMargin(item.price, (item.cost ?? item.purchase_price ?? 0))
                      const isLow     = !!(item.min_qty && item.qty <= item.min_qty)

                      return (
                        <tr key={item.id} style={{ opacity: item.is_active ? 1 : 0.55, background: isLow ? 'rgba(245,158,11,0.04)' : undefined }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isLow && <span title={ar ? 'مخزون منخفض' : 'Low stock'} style={{ fontSize: '0.75rem' }}>⚠️</span>}
                              <span
                                className="fw-semibold"
                                style={{ cursor: 'pointer', color: '#1d4ed8' }}
                                onClick={() => setDetailModal(item)}
                              >{item.name}</span>
                            </div>
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                            {item.sku && <span>{item.sku}</span>}
                            {item.sku && item.barcode && <span style={{ margin: '0 4px' }}>|</span>}
                            {item.barcode && <span style={{ fontFamily: 'monospace' }}>📷 {item.barcode}</span>}
                            {!item.sku && !item.barcode && '—'}
                          </td>
                          <td>{item.category?.name || '—'}</td>
                          <td className="text-muted">{item.unit || '—'}</td>
                          <td className="text-muted">{(item.cost ?? item.purchase_price) ? fmt(item.cost ?? item.purchase_price ?? 0) : '—'}</td>
                          <td className="fw-semibold">{fmt(item.price)}</td>
                          <td>
                            {margin !== null ? (
                              <span style={{ color: Number(margin) >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                                {Number(margin) >= 0 ? '+' : ''}{margin}%
                              </span>
                            ) : '—'}
                          </td>

                          {/* ── عمود "متاح" — اضغط لعرض الفروع ── */}
                      <td style={{ textAlign: 'center' }}>
  {filterWarehouse ? (
    (() => {
      const locQty = item.locations?.find(l => l.warehouse_id === Number(filterWarehouse))?.qty ?? 0
      return <span className={`badge ${stockBadge(locQty, item.min_qty)}`}>{fmt(locQty)}</span>
    })()
  ) : item.locations && item.locations.filter(l => l.qty > 0).length > 0 ? (
    <details style={{ cursor: 'pointer' }}>
      <summary style={{ listStyle: 'none', display: 'inline-block' }}>
        <span className={`badge ${stockBadge(item.available_qty ?? item.qty, item.min_qty)}`}>
          {fmt(item.available_qty ?? item.qty)}
        </span>
      </summary>
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 130, textAlign: ar ? 'right' : 'left' }}>
        {item.locations.filter(l => l.qty > 0).map(l => {
          const wh = warehouses.find(w => w.id === l.warehouse_id)
          return (
            <div key={l.warehouse_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem' }}>
              <span style={{ color: '#6b7280' }}>{wh?.name ?? '—'}</span>
              <span className={`badge ${stockBadge(l.qty, item.min_qty)}`}>{fmt(l.qty)}</span>
            </div>
          )
        })}
      </div>
    </details>
  ) : (
    <span className={`badge ${stockBadge(item.available_qty ?? item.qty, item.min_qty)}`}>
      {fmt(item.available_qty ?? item.qty)}
    </span>
  )}
</td>

                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-secondary" style={{ background: '#f3f4f6', color: '#374151' }}>{fmt(item.qty)}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.min_qty ? (
                              <span style={{ fontSize: '0.8rem', color: isLow ? '#f59e0b' : '#6b7280', fontWeight: isLow ? 700 : 400 }}>
                                {fmt(item.min_qty)}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              style={{
                                padding: '2px 10px',
                                borderRadius: 20,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: item.is_active ? '#dcfce7' : '#fee2e2',
                                color:      item.is_active ? '#16a34a' : '#dc2626',
                              }}
                            >
                              {item.is_active ? (ar ? 'نشط' : 'Active') : (ar ? 'غير نشط' : 'Inactive')}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              <button type="button" className="btn btn-sm" onClick={() => setActionModal({ product: item, type: 'in' })}
                                style={{ background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                ➕ {ar ? 'إضافة' : 'In'}
                              </button>
                              <button type="button" className="btn btn-sm" onClick={() => setActionModal({ product: item, type: 'out' })}
                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                ➖ {ar ? 'سحب' : 'Out'}
                              </button>
                              <button type="button" className="btn btn-sm" onClick={() => setActionModal({ product: item, type: 'transfer' })}
                                style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                🔄 {ar ? 'تحويل' : 'Transfer'}
                              </button>
                              <button type="button" className="btn btn-sm" onClick={() => setActionModal({ product: item, type: 'adjustment' })}
                                style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                ⚙️ {ar ? 'تعديل' : 'Adjust'}
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
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: Stock Movements                           */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'movements' && (
        <>
          <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <select value={movFilterType} onChange={e => setMovFilterType(e.target.value)} style={filterSelectStyle}>
              <option value="">{ar ? 'كل الأنواع' : 'All Types'}</option>
              <option value="in">{ar ? 'وارد' : 'Stock In'}</option>
              <option value="out">{ar ? 'صادر' : 'Stock Out'}</option>
              <option value="adjustment">{ar ? 'تعديل' : 'Adjustment'}</option>
              <option value="transfer_in">{ar ? 'تحويل وارد' : 'Transfer In'}</option>
              <option value="transfer_out">{ar ? 'تحويل صادر' : 'Transfer Out'}</option>
            </select>

            <select value={movFilterProd} onChange={e => setMovFilterProd(e.target.value)} style={filterSelectStyle}>
              <option value="">{ar ? 'كل المنتجات' : 'All Products'}</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>

            <button type="button" className="btn btn-secondary" onClick={fetchMovements} style={{ marginInlineStart: 'auto' }}>
              🔄 {ar ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {movLoading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : movements.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-text">{t('no_data')}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{ar ? 'النوع' : 'Type'}</th>
                      <th>{t('product')}</th>
                      <th>{t('warehouse')}</th>
                      <th style={{ textAlign: 'center' }}>{ar ? 'قبل' : 'Before'}</th>
                      <th style={{ textAlign: 'center' }}>{ar ? 'التغيير' : 'Change'}</th>
                      <th style={{ textAlign: 'center' }}>{ar ? 'بعد' : 'After'}</th>
                      <th>{t('notes')}</th>
                      <th>{ar ? 'بواسطة' : 'By'}</th>
                      <th>{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(mov => {
                      const isPositive = ['in', 'transfer_in'].includes(mov.type)
                      const color      = movementColor[mov.type] || '#6b7280'
                      const label      = movementLabel[mov.type]?.[lang] || mov.type
                      return (
                        <tr key={mov.id}>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 10px', borderRadius: 20,
                              background: color + '18', color,
                              fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap',
                            }}>
                              {movementIcon[mov.type]} {label}
                            </span>
                          </td>
                          <td className="fw-semibold" style={{ fontSize: '0.875rem' }}>{mov.product?.name || '—'}</td>
                          <td className="text-muted"  style={{ fontSize: '0.85rem'  }}>{mov.warehouse?.name || '—'}</td>
                          <td style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>{fmt(mov.qty_before)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>
                              {isPositive ? '+' : ''}{fmt(mov.qty)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>{fmt(mov.qty_after)}</td>
                          <td className="text-muted" style={{ fontSize: '0.8rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mov.notes || '—'}
                          </td>
                          <td className="text-muted"  style={{ fontSize: '0.8rem' }}>{mov.user?.name || '—'}</td>
                          <td className="text-muted"  style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(mov.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* MODAL: إضافة منتج جديد                            */}
      {/* ══════════════════════════════════════════════════ */}
      {modal && isMounted && createPortal(
        <div style={overlayStyle} onClick={() => setModal(false)}>
          <div style={{ ...modalStyle, maxWidth: 620 }} onClick={e => e.stopPropagation()}>

            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>{ar ? '➕ منتج جديد' : '➕ New Product'}</h3>
              <button type="button" onClick={() => setModal(false)} style={closeButtonStyle}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                  {/* الاسم */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{t('name')} *</label>
                    <input
                      style={inputStyle}
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      autoFocus
                      placeholder={ar ? 'اسم المنتج' : 'Product name'}
                    />
                  </div>

                  {/* SKU */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>SKU <small style={{ color: '#6b7280', fontWeight: 400 }}>({ar ? 'اختياري' : 'optional'})</small></label>
                    <input style={inputStyle} value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder={ar ? 'كود المنتج' : 'Product code'} />
                  </div>

                  {/* الباركود */}
                  <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>📷 {ar ? 'الباركود' : 'Barcode'}</label>
                    <input
                      ref={barcodeInputRef}
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                      value={form.barcode}
                      onChange={e => setForm({ ...form, barcode: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                      placeholder={ar ? 'امسح أو اكتب...' : 'Scan or type...'}
                    />
                  </div>

                  {/* التصنيف */}
                  <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('category')} *</label>
                    {!showNewCat ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          style={{ ...inputStyle, flex: 1 }}
                          value={form.category_id}
                          onChange={e => setForm({ ...form, category_id: e.target.value })}
                        >
                          <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => { setShowNewCat(true); setTimeout(() => newCatInputRef.current?.focus(), 50) }}
                          style={{ padding: '0 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer', color: '#000', whiteSpace: 'nowrap' }}>
                          ➕ {ar ? 'فئة جديدة' : 'New'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          ref={newCatInputRef}
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() }
                            if (e.key === 'Escape') { setShowNewCat(false); setNewCatName('') }
                          }}
                          placeholder={ar ? 'اسم الفئة...' : 'Category name...'}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button type="button" onClick={handleAddCategory} disabled={!newCatName.trim() || savingCat}
                          style={{ padding: '0.5rem 0.75rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {savingCat ? '...' : (ar ? '✓ حفظ' : '✓ Save')}
                        </button>
                        <button type="button" onClick={() => { setShowNewCat(false); setNewCatName('') }}
                          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer' }}>✕</button>
                      </div>
                    )}
                  </div>

                  {/* سعر الشراء */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{ar ? 'سعر الشراء' : 'Purchase Price'}</label>
                    <input type="number" min="0" step="0.01" style={inputStyle} value={form.purchase_price}
                      onChange={e => setForm({ ...form, purchase_price: e.target.value })} placeholder="0.00" />
                  </div>

                  {/* سعر البيع */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{ar ? 'سعر البيع' : 'Selling Price'} *</label>
                    <input
                      type="number" min="0" step="0.01"
                      style={{
                        ...inputStyle,
                        borderColor: priceWarning ? '#f59e0b' : '#d1d5db',
                        background: priceWarning ? '#fffbeb' : '#fff',
                      }}
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00"
                    />
                    {/* ── تحذير سعر البيع أقل من الشراء (real-time) ── */}
                    {priceWarning ? (
                      <small style={{ marginTop: 4, display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '3px 6px', borderRadius: 4 }}>
                        ⚠️ {ar
                          ? `سعر البيع أقل من سعر الشراء — هامش: ${calcMargin(Number(form.price), Number(form.purchase_price))}%`
                          : `Selling price is below purchase price — Margin: ${calcMargin(Number(form.price), Number(form.purchase_price))}%`}
                      </small>
                    ) : (form.purchase_price && form.price && Number(form.price) > 0 && Number(form.purchase_price) > 0) ? (
                      <small style={{ marginTop: 4, display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>
                        {ar ? 'هامش:' : 'Margin:'} +{calcMargin(Number(form.price), Number(form.purchase_price))}%
                      </small>
                    ) : null}
                  </div>

                  {/* الكمية */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{t('quantity')} <small style={{ color: '#6b7280', fontWeight: 400 }}>({ar ? 'اختياري' : 'optional'})</small></label>
                    <input type="number" min="0" style={inputStyle} value={form.qty}
                      onChange={e => setForm({ ...form, qty: e.target.value })} placeholder="0" />
                  </div>

                  {/* الحد الأدنى */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{ar ? 'الحد الأدنى للتنبيه' : 'Reorder Level'}</label>
                    <input type="number" min="0" style={inputStyle} value={form.min_qty}
                      onChange={e => setForm({ ...form, min_qty: e.target.value })} placeholder={ar ? 'مثال: 10' : 'e.g. 10'} />
                  </div>

                  {/* المخزن */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{ar ? 'المخزن' : 'Warehouse'} <small style={{ color: '#6b7280', fontWeight: 400 }}>({ar ? 'اختياري' : 'optional'})</small></label>
                    <select
                      value={form.warehouse_id}
                      onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">{ar ? '— اختر مخزن —' : '— Select Warehouse —'}</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>

                  {/* وحدة القياس */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{ar ? 'وحدة القياس' : 'Unit'}</label>
                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={inputStyle}>
                      <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                      <option value="piece">{ar ? 'قطعة' : 'Piece'}</option>
                      <option value="kg">{ar ? 'كيلو' : 'KG'}</option>
                      <option value="liter">{ar ? 'لتر' : 'Liter'}</option>
                      <option value="box">{ar ? 'كرتونة' : 'Box'}</option>
                      <option value="meter">{ar ? 'متر' : 'Meter'}</option>
                      <option value="set">{ar ? 'طقم' : 'Set'}</option>
                    </select>
                  </div>

                  {/* الحالة */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{ar ? 'الحالة' : 'Status'}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <input type="checkbox" id="is_active" checked={form.is_active}
                        onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      <label htmlFor="is_active" style={{ cursor: 'pointer', fontWeight: 400 }}>
                        {ar ? 'منتج نشط' : 'Active product'}
                      </label>
                    </div>
                  </div>

                  {/* الوصف */}
                  <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('description')}</label>
                    <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>

                </div>

                {/* Error message */}
                {formErr && (
                  <div style={{ color: '#dc2626', background: 'rgba(220,38,38,0.1)', padding: '0.5rem 0.75rem', borderRadius: 6, marginTop: '0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⚠️ {formErr}
                  </div>
                )}
              </div>

              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setModal(false)} style={cancelBtnStyle}>{t('cancel')}</button>
                <button type="submit" disabled={saving} style={submitBtnStyle}>
                  {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* MODAL: Quick Action (in/out/adjustment/transfer)   */}
      {/* ══════════════════════════════════════════════════ */}
      {actionModal && isMounted && createPortal(
        <div style={overlayStyle} onClick={() => setActionModal(null)}>
          <div style={{ ...modalStyle, maxWidth: 440 }} onClick={e => e.stopPropagation()}>

            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ ...modalTitleStyle, marginBottom: 2 }}>
                  {actionModal.type === 'in'         && (ar ? '➕ إضافة مخزون'  : '➕ Stock In')}
                  {actionModal.type === 'out'        && (ar ? '➖ سحب مخزون'    : '➖ Stock Out')}
                  {actionModal.type === 'adjustment' && (ar ? '⚙️ تعديل مخزون' : '⚙️ Adjust Stock')}
                  {actionModal.type === 'transfer'   && (ar ? '🔄 تحويل مخزون' : '🔄 Transfer Stock')}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{actionModal.product.name}</p>
              </div>
              <button type="button" onClick={() => setActionModal(null)} style={closeButtonStyle}>✕</button>
            </div>

            <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* الكمية */}
                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    {actionModal.type === 'adjustment'
                      ? (ar ? 'الكمية الجديدة (الفعلية) *' : 'New Quantity (actual) *')
                      : (ar ? 'الكمية *' : 'Quantity *')}
                  </label>
                  <input
                    type="number" min="0.001" step="0.001"
                    value={actionQty}
                    onChange={e => setActionQty(e.target.value)}
                    required autoFocus
                    style={inputStyle}
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    {ar ? `المخزون الحالي: ${fmt(actionModal.product.qty)}` : `Current stock: ${fmt(actionModal.product.qty)}`}
                    {actionModal.product.unit ? ` (${actionModal.product.unit})` : ''}
                  </small>
                </div>

                {/* المخزن — اختياري للـ adjustment، إجباري للباقي */}
                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    {actionModal.type === 'transfer'
                      ? (ar ? 'من مخزن *' : 'From Warehouse *')
                      : warehouseRequired(actionModal.type)
                        ? (ar ? 'المخزن *' : 'Warehouse *')
                        : (ar ? 'المخزن (اختياري)' : 'Warehouse (optional)')}
                  </label>
                  <select
                    value={actionWarehouse}
                    onChange={e => setActionWarehouse(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                    {activeWarehouses.map(w => {
                      const locQty = actionModal.product.locations?.find(l => l.warehouse_id === w.id)?.qty
                      return (
                        <option key={w.id} value={w.id}>
                          {w.name}{locQty !== undefined ? ` — ${locQty}` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {/* رصيد المخزن المختار */}
                  {actionWarehouse && (() => {
                    const locQty = actionModal.product.locations?.find(l => l.warehouse_id === Number(actionWarehouse))?.qty
                    if (locQty === undefined) return null
                    const enough = locQty >= Number(actionQty || 0)
                    return (
                      <small style={{
                        marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: '0.75rem', fontWeight: 600,
                        color: enough ? '#16a34a' : '#dc2626',
                        background: enough ? '#f0fdf4' : '#fef2f2',
                        padding: '3px 8px', borderRadius: 4,
                      }}>
                        {enough ? '✅' : '⚠️'}
                        {ar
                          ? `الرصيد في هذا الفرع: ${fmt(locQty)}`
                          : `Stock in this branch: ${fmt(locQty)}`}
                        {!enough && actionQty && (
                          <span style={{ fontWeight: 400, marginInlineStart: 4 }}>
                            {ar ? `(المطلوب: ${fmt(Number(actionQty))})` : `(needed: ${fmt(Number(actionQty))})`}
                          </span>
                        )}
                      </small>
                    )
                  })()}
                  {actionModal.type === 'adjustment' && (
                    <small style={{ color: '#6b7280', fontSize: '0.73rem', marginTop: 2 }}>
                      {ar ? 'اختياري للتعديل — اتركه فارغاً لتعديل الكمية الإجمالية' : 'Optional for adjustments — leave empty to adjust total quantity'}
                    </small>
                  )}
                </div>

                {/* المخزن (إلى) — فقط للتحويل */}
                {actionModal.type === 'transfer' && (
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{ar ? 'إلى مخزن *' : 'To Warehouse *'}</label>
                    <select
                      value={actionWarehouseTo}
                      onChange={e => setActionWarehouseTo(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                      {activeWarehouses
                        .filter(w => String(w.id) !== actionWarehouse)
                        .map(w => {
                          const locQty = actionModal.product.locations?.find(l => l.warehouse_id === w.id)?.qty
                          return (
                            <option key={w.id} value={w.id}>
                              {w.name}{locQty !== undefined ? ` — ${locQty}` : ''}
                            </option>
                          )
                        })}
                    </select>
                    {/* رصيد المخزن المستلم */}
                    {actionWarehouseTo && (() => {
                      const locQty = actionModal.product.locations?.find(l => l.warehouse_id === Number(actionWarehouseTo))?.qty ?? 0
                      return (
                        <small style={{
                          marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: '0.75rem', fontWeight: 600,
                          color: '#0284c7', background: '#f0f9ff',
                          padding: '3px 8px', borderRadius: 4,
                        }}>
                          📦 {ar
                            ? `الرصيد الحالي في الفرع المستلم: ${fmt(locQty)}`
                            : `Current stock in destination: ${fmt(locQty)}`}
                          {actionQty && (
                            <span style={{ color: '#16a34a', marginInlineStart: 4 }}>
                              → {fmt(locQty + Number(actionQty))}
                            </span>
                          )}
                        </small>
                      )
                    })()}
                  </div>
                )}

                {/* ملاحظات */}
                <div style={fieldStyle}>
                  <label style={labelStyle}>{t('notes')}</label>
                  <input value={actionNote} onChange={e => setActionNote(e.target.value)} style={inputStyle} placeholder={ar ? 'اختياري...' : 'Optional...'} />
                </div>

              </div>

              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setActionModal(null)} style={cancelBtnStyle}>{t('cancel')}</button>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    !actionQty ||
                    (warehouseRequired(actionModal.type) && !actionWarehouse) ||
                    (actionModal.type === 'transfer' && !actionWarehouseTo)
                  }
                  style={{
                    ...submitBtnStyle,
                    background:
                      actionModal.type === 'in'         ? '#16a34a' :
                      actionModal.type === 'out'        ? '#dc2626' :
                      actionModal.type === 'transfer'   ? '#1d4ed8' :
                      '#7c3aed',
                  }}
                >
                  {saving ? (ar ? 'جاري...' : 'Saving...') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* MODAL: تفاصيل المنتج                              */}
      {/* ══════════════════════════════════════════════════ */}
      {detailModal && isMounted && createPortal(
        <div style={overlayStyle} onClick={() => setDetailModal(null)}>
          <div style={{ ...modalStyle, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>{detailModal.name}</h3>
              <button type="button" onClick={() => setDetailModal(null)} style={closeButtonStyle}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {([
                ['SKU',                                   detailModal.sku],
                [ar ? 'الباركود'   : 'Barcode',          detailModal.barcode],
                [ar ? 'الفئة'      : 'Category',         detailModal.category?.name],
                [ar ? 'الوحدة'     : 'Unit',             detailModal.unit],
                [ar ? 'سعر الشراء' : 'Cost',             detailModal.cost ? fmt(detailModal.cost) : undefined],
                [ar ? 'سعر البيع'  : 'Price',            fmt(detailModal.price)],
                [ar ? 'المخزون الفعلي' : 'On Hand',      fmt(detailModal.qty)],
                [ar ? 'الحد الأدنى' : 'Min Qty',        detailModal.min_qty ? fmt(detailModal.min_qty) : undefined],
                [ar ? 'المخزن'     : 'Warehouse',        detailModal.warehouse?.name],
                [ar ? 'الحالة'     : 'Status',           detailModal.is_active ? (ar ? 'نشط ✅' : 'Active ✅') : (ar ? 'غير نشط ❌' : 'Inactive ❌')],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }}
                  onClick={() => { setDetailModal(null); setActionModal({ product: detailModal, type: 'in' }) }}>
                  ➕ {ar ? 'إضافة مخزون' : 'Stock In'}
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }}
                  onClick={() => { setDetailModal(null); setActiveTab('movements'); setMovFilterProd(String(detailModal.id)) }}>
                  📋 {ar ? 'سجل الحركات' : 'Movements'}
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* MODAL: تأكيد الحذف                                */}
      {/* ══════════════════════════════════════════════════ */}
      {deleteId && isMounted && createPortal(
        <div style={overlayStyle} onClick={() => setDeleteId(null)}>
          <div style={{ ...modalStyle, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>{t('confirm_delete')}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                {ar ? 'سيتم حذف المنتج نهائياً' : 'This product will be permanently deleted.'}
              </p>
            </div>
            <div style={modalFooterStyle}>
              <button type="button" onClick={() => setDeleteId(null)} style={cancelBtnStyle}>{t('cancel')}</button>
              <button type="button" onClick={handleDelete} style={{ ...submitBtnStyle, background: '#dc2626' }}>{t('delete')}</button>
            </div>
          </div>
        </div>, document.body
      )}

    </ERPLayout>
  )
}

// ── Shared inline styles ───────────────────────────────────
const filterSelectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: 'var(--bg-card, #fff)',
  color: 'var(--text-color, #374151)',
  fontSize: '0.85rem',
  cursor: 'pointer',
}
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999999,
}
const modalStyle: React.CSSProperties = {
  width: '95%',
  background: 'var(--bg-card, #fff)',
  color: 'var(--text-color, #000)',
  borderRadius: 10,
  display: 'flex', flexDirection: 'column',
  maxHeight: '90vh',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
}
const modalHeaderStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border-color, #e5e7eb)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
}
const modalTitleStyle: React.CSSProperties = {
  margin: 0, fontSize: '1.1rem', fontWeight: 700,
}
const modalFooterStyle: React.CSSProperties = {
  padding: '1rem 1.5rem',
  borderTop: '1px solid #e5e7eb',
  display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
}
const closeButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#9ca3af', lineHeight: 1,
}
const fieldStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.375rem',
}
const labelStyle: React.CSSProperties = {
  fontWeight: 600, fontSize: '0.875rem',
}
const inputStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  color: '#000',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '0.875rem',
}
const cancelBtnStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  border: '1px solid #d1d5db',
  borderRadius: 6, cursor: 'pointer',
  fontWeight: 500, background: '#fff', color: '#374151',
}
const submitBtnStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  border: 'none', borderRadius: 6,
  background: '#1d4ed8', color: '#fff',
  cursor: 'pointer', fontWeight: 600,
}