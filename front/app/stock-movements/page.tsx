'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { StatCard, Badge, EmptyState, SearchInput, Modal, ToastContainer } from '../../components/ui'

// الـ product بييجي كـ object من الـ API وليس string
type ProductObj = { id: number; name: string; name_en?: string; sku?: string }
type WarehouseObj = { id: number; name: string }

type Movement = {
  id: number
  type: 'in' | 'out' | 'transfer' | 'transfer_in' | 'transfer_out' | 'adjustment'
  product: ProductObj | null
  warehouse: WarehouseObj | null
  qty: number          // ← الـ backend بيبعت qty مش quantity
  qty_before?: number
  qty_after?: number
  notes?: string       // ← الـ backend بيبعت notes مش reason
  user?: { id: number; name: string } | null
  created_at: string
}
type Warehouse = { id: number; name: string }
type Product   = { id: number; name: string }

const TYPE_META: Record<string, { ar: string; color: any; icon: string }> = {
  in:           { ar: 'وارد',        color: 'success', icon: '⬆️' },
  out:          { ar: 'صادر',       color: 'danger',  icon: '⬇️' },
  transfer:     { ar: 'تحويل',      color: 'warning', icon: '🔄' },
  transfer_in:  { ar: 'تحويل وارد', color: 'success', icon: '🔄' },
  transfer_out: { ar: 'تحويل صادر', color: 'danger',  icon: '🔄' },
  adjustment:   { ar: 'تسوية',      color: 'gray',    icon: '⚖️' },
}

// helper: يطلع اسم المنتج سواء object أو string
const getProductName = (product: any): string => {
  if (!product) return '—'
  if (typeof product === 'object') return product.name ?? product.name_en ?? '—'
  return product
}

// helper: يطلع اسم المخزن سواء object أو string
const getWarehouseName = (warehouse: any): string => {
  if (!warehouse) return '—'
  if (typeof warehouse === 'object') return warehouse.name ?? '—'
  return warehouse
}

export default function StockMovementPage() {
  const { toasts, show, remove } = useToast()
  const [movements,    setMovements]    = useState<Movement[]>([])
  const [warehouses,   setWarehouses]   = useState<Warehouse[]>([])
  const [products,     setProducts]     = useState<Product[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [showAdd,      setShowAdd]      = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [saving,       setSaving]       = useState(false)

  // الـ backend بيستخدم qty و notes (مش quantity و reason)
  const [form, setForm] = useState({
    product_id: '', qty: '', warehouse_id: '', type: 'in', notes: ''
  })
  const [transfer, setTransfer] = useState({
    product_id: '', qty: '', from_warehouse_id: '', to_warehouse_id: '', notes: ''
  })

  const load = async () => {
    setLoading(true)
    const [mRes, wRes, pRes] = await Promise.all([
      api.get('/stock-movements?per_page=100'),
      api.get('/warehouses'),
      api.get('/products?per_page=200'),
    ])

    // الـ API بيرجع paginate → الداتا في mRaw.data
    const mRaw = mRes.data
    const mArr = Array.isArray(mRaw) ? mRaw : (Array.isArray(mRaw?.data) ? mRaw.data : [])
    setMovements(mArr)

    const wRaw = wRes.data
    setWarehouses(Array.isArray(wRaw) ? wRaw : (Array.isArray(wRaw?.data) ? wRaw.data : []))

    const pRaw = pRes.data
    setProducts(Array.isArray(pRaw) ? pRaw : (Array.isArray(pRaw?.data) ? pRaw.data : []))

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = movements.filter(m => {
    const productName = getProductName(m.product)
    const ms = !search || productName.toLowerCase().includes(search.toLowerCase())
    const mt = typeFilter === 'all' || m.type === typeFilter
    return ms && mt
  })

  const handleAdd = async () => {
    if (!form.product_id || !form.qty) { show('المنتج والكمية مطلوبان', 'error'); return }
    setSaving(true)
    const res = await api.post('/stock-movements', { ...form, qty: Number(form.qty) })
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show('تمت العملية ✅'); setShowAdd(false); load()
  }

  const handleTransfer = async () => {
    if (!transfer.product_id || !transfer.qty || !transfer.from_warehouse_id || !transfer.to_warehouse_id) {
      show('كل الحقول مطلوبة', 'error'); return
    }
    setSaving(true)
    const res = await api.post('/stock-movements/transfer', { ...transfer, qty: Number(transfer.qty) })
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show('تم التحويل ✅'); setShowTransfer(false); load()
  }

  const INP: React.CSSProperties = {
    width: '100%', padding: '0.6rem 1rem', background: 'var(--bg-input)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <ERPLayout pageTitle="حركة المخزون">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 حركة المخزون</h1>
          <p className="page-subtitle">متابعة الوارد والصادر والتحويلات</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTransfer(true)}>🔄 تحويل</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ حركة جديدة</button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
        <StatCard icon="⬆️" label="وارد"  value={movements.filter(m => m.type === 'in').length}       accent="var(--color-success)" />
        <StatCard icon="⬇️" label="صادر"  value={movements.filter(m => m.type === 'out').length}      accent="var(--color-danger)" />
        <StatCard icon="🔄" label="تحويل" value={movements.filter(m => m.type.includes('transfer')).length} accent="var(--color-warning)" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالمنتج..." />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...INP, width: 'auto', minWidth: 130 }}>
          <option value="all">كل الأنواع</option>
          <option value="in">وارد</option>
          <option value="out">صادر</option>
          <option value="transfer_in">تحويل وارد</option>
          <option value="transfer_out">تحويل صادر</option>
          <option value="adjustment">تسوية</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : filtered.length === 0 ? <EmptyState icon="📦" title="لا توجد حركات" /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>المخزن</th>
                <th>قبل</th>
                <th>بعد</th>
                <th>ملاحظات</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <Badge color={TYPE_META[m.type]?.color ?? 'gray'}>
                      {TYPE_META[m.type]?.icon} {TYPE_META[m.type]?.ar ?? m.type}
                    </Badge>
                  </td>
                  {/* ✅ استخدام helper عشان product object */}
                  <td style={{ fontWeight: 600 }}>{getProductName(m.product)}</td>
                  <td style={{ fontWeight: 700 }}>{m.qty}</td>
                  {/* ✅ warehouse كمان object */}
                  <td style={{ fontSize: '0.8rem' }}>{getWarehouseName(m.warehouse)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.qty_before ?? '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.qty_after ?? '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.notes || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(m.created_at).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal إضافة حركة */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة حركة مخزون"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? '⏳...' : 'حفظ'}</button>
          </>
        }>
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">المنتج *</label>
            <select style={INP} value={form.product_id} onChange={e => setForm(p => ({ ...p, product_id: e.target.value }))}>
              <option value="">اختر منتج</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-grid form-grid-2">
            <div className="input-group">
              <label className="input-label">النوع</label>
              <select style={INP} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="in">وارد ⬆️</option>
                <option value="out">صادر ⬇️</option>
                <option value="adjustment">تسوية ⚖️</option>
              </select>
            </div>
            <div className="input-group">
              {/* ✅ qty مش quantity */}
              <label className="input-label">الكمية *</label>
              <input style={INP} type="number" min="1" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">المخزن</label>
            <select style={INP} value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))}>
              <option value="">اختر مخزن</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            {/* ✅ notes مش reason */}
            <label className="input-label">ملاحظات</label>
            <input style={INP} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Modal تحويل */}
      <Modal open={showTransfer} onClose={() => setShowTransfer(false)} title="تحويل بين مخازن"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowTransfer(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={handleTransfer} disabled={saving}>{saving ? '⏳...' : 'تحويل'}</button>
          </>
        }>
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">المنتج *</label>
            <select style={INP} value={transfer.product_id} onChange={e => setTransfer(p => ({ ...p, product_id: e.target.value }))}>
              <option value="">اختر منتج</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            {/* ✅ qty مش quantity */}
            <label className="input-label">الكمية *</label>
            <input style={INP} type="number" min="1" value={transfer.qty} onChange={e => setTransfer(p => ({ ...p, qty: e.target.value }))} />
          </div>
          <div className="form-grid form-grid-2">
            <div className="input-group">
              <label className="input-label">من مخزن *</label>
              <select style={INP} value={transfer.from_warehouse_id} onChange={e => setTransfer(p => ({ ...p, from_warehouse_id: e.target.value }))}>
                <option value="">اختر</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">إلى مخزن *</label>
              <select style={INP} value={transfer.to_warehouse_id} onChange={e => setTransfer(p => ({ ...p, to_warehouse_id: e.target.value }))}>
                <option value="">اختر</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="input-group">
            {/* ✅ notes مش reason */}
            <label className="input-label">سبب التحويل</label>
            <input style={INP} value={transfer.notes} onChange={e => setTransfer(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </ERPLayout>
  )
}