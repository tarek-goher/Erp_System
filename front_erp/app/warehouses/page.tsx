'use client'

// ══════════════════════════════════════════════════════════
// app/warehouses/page.tsx — صفحة المخازن
// API:
//   GET    /api/warehouses          → قائمة المخازن
//   POST   /api/warehouses          → إضافة مخزن
//   PUT    /api/warehouses/{id}     → تعديل
//   DELETE /api/warehouses/{id}     → حذف
//   POST   /api/warehouses/transfer → نقل بين مخازن
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Warehouse = {
  id: number
  name: string
  location?: string
  is_active: boolean
  stock_movements_count?: number
}
type Product = { id: number; name: string }

const EMPTY_FORM = { name: '', location: '', is_active: true, notes: '' }
const EMPTY_TRANSFER = { product_id: '', from_id: '', to_id: '', qty: '', notes: '' }

export default function WarehousesPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [warehouses,  setWarehouses]  = useState<Warehouse[]>([])
  const [products,    setProducts]    = useState<Product[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [tab,         setTab]         = useState<'list' | 'transfer'>('list')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editing,     setEditing]     = useState<Warehouse | null>(null)
  const [form,        setForm]        = useState({ ...EMPTY_FORM })
  const [transfer,    setTransfer]    = useState({ ...EMPTY_TRANSFER })
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [wRes, pRes] = await Promise.all([
      api.get('/warehouses'),
      api.get('/products?per_page=300'),
    ])
    if (wRes.data) setWarehouses(wRes.data.data ?? wRes.data)
    if (pRes.data) setProducts(pRes.data.data ?? pRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // ── Warehouse CRUD ────────────────────────────────────
  const openAdd = () => {
    setEditing(null); setForm({ ...EMPTY_FORM }); setErrors({}); setModalOpen(true)
  }
  const openEdit = (w: Warehouse) => {
    setEditing(w)
    setForm({ name: w.name, location: w.location ?? '', is_active: w.is_active, notes: '' })
    setErrors({}); setModalOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!form.name.trim()) err.name = ar ? 'الاسم مطلوب' : 'Name required'
    setErrors(err)
    if (Object.keys(err).length) return

    setSaving(true)
    const res = editing
      ? await api.put(`/warehouses/${editing.id}`, form)
      : await api.post('/warehouses', form)
    setSaving(false)

    if (res.error) { flash(res.error, false); return }
    flash(ar ? (editing ? 'تم تحديث المخزن ✓' : 'تم إضافة المخزن ✓') : (editing ? 'Warehouse updated ✓' : 'Warehouse added ✓'))
    setModalOpen(false)
    fetchAll()
  }

  const handleDelete = async (w: Warehouse) => {
    if (!confirm(ar ? `حذف "${w.name}"؟` : `Delete "${w.name}"?`)) return
    const res = await api.delete(`/warehouses/${w.id}`)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? 'تم الحذف' : 'Deleted')
    fetchAll()
  }

  // ── Transfer ─────────────────────────────────────────
  const handleTransfer = async (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!transfer.product_id) err.product_id = ar ? 'اختر منتج' : 'Select product'
    if (!transfer.from_id)    err.from_id    = ar ? 'اختر مخزن المصدر' : 'Select source'
    if (!transfer.to_id)      err.to_id      = ar ? 'اختر مخزن الوجهة' : 'Select destination'
    if (transfer.from_id && transfer.from_id === transfer.to_id)
      err.to_id = ar ? 'المخزنان يجب أن يختلفا' : 'Must differ'
    if (!transfer.qty || Number(transfer.qty) <= 0) err.qty = ar ? 'كمية غير صحيحة' : 'Invalid qty'
    setErrors(err)
    if (Object.keys(err).length) return

    setSaving(true)
    const res = await api.post('/warehouses/transfer', {
      product_id: Number(transfer.product_id),
      from_id:    Number(transfer.from_id),
      to_id:      Number(transfer.to_id),
      qty:        Number(transfer.qty),
      notes:      transfer.notes,
    })
    setSaving(false)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? '✅ تم النقل بنجاح' : '✅ Transfer completed')
    setTransfer({ ...EMPTY_TRANSFER })
    fetchAll()
  }

  const inp = (style?: object) => ({
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const, ...style,
  })

  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: toast.ok ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '12px 22px', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontWeight: 600, fontSize: 14,
          }}>{toast.msg}</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {ar ? '🏪 المخازن' : '🏪 Warehouses'}
          </h1>
          <button onClick={openAdd} style={{
            background: '#1a56db', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600,
          }}>
            {ar ? '+ إضافة مخزن' : '+ Add Warehouse'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['list', 'transfer'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#1a56db' : '#6b7280',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>
              {t === 'list' ? (ar ? '📋 قائمة المخازن' : '📋 List') : (ar ? '🔄 نقل المخزون' : '🔄 Transfer Stock')}
            </button>
          ))}
        </div>

        {/* ── Tab: List ─────────────────────────────────── */}
        {tab === 'list' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
              <div style={{ fontSize: 40 }}>⏳</div>
              <div style={{ marginTop: 8 }}>{ar ? 'جاري التحميل...' : 'Loading...'}</div>
            </div>
          ) : warehouses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
              <div style={{ fontSize: 48 }}>🏪</div>
              <div style={{ marginTop: 8, fontSize: 16 }}>{ar ? 'لا توجد مخازن' : 'No warehouses yet'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {warehouses.map(w => (
                <div key={w.id} style={{
                  background: '#fff', borderRadius: 12, padding: 20,
                  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                  borderTop: `3px solid ${w.is_active ? '#1a56db' : '#9ca3af'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{w.name}</div>
                      {w.location && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>📍 {w.location}</div>}
                    </div>
                    <span style={{
                      background: w.is_active ? '#d1fae5' : '#f3f4f6',
                      color: w.is_active ? '#065f46' : '#6b7280',
                      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    }}>
                      {w.is_active ? (ar ? 'نشط' : 'Active') : (ar ? 'موقوف' : 'Inactive')}
                    </span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
                    {ar ? `حركات المخزون: ${w.stock_movements_count ?? 0}` : `Movements: ${w.stock_movements_count ?? 0}`}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button onClick={() => openEdit(w)} style={{
                      flex: 1, padding: '7px', border: '1px solid #e5e7eb', borderRadius: 7,
                      background: '#f9fafb', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>
                      {ar ? '✏️ تعديل' : '✏️ Edit'}
                    </button>
                    <button onClick={() => handleDelete(w)} style={{
                      flex: 1, padding: '7px', border: '1px solid #fee2e2', borderRadius: 7,
                      background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>
                      {ar ? '🗑️ حذف' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Tab: Transfer ──────────────────────────────── */}
        {tab === 'transfer' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,.08)', maxWidth: 560 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
              {ar ? '🔄 نقل مخزون بين مخزنين' : '🔄 Transfer Stock Between Warehouses'}
            </h2>
            <form onSubmit={handleTransfer}>
              {/* Product */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  {ar ? 'المنتج *' : 'Product *'}
                </label>
                <select
                  value={transfer.product_id}
                  onChange={e => setTransfer(p => ({ ...p, product_id: e.target.value }))}
                  style={{ ...inp(), borderColor: errors.product_id ? '#ef4444' : '#d1d5db' }}
                >
                  <option value="">{ar ? '-- اختر منتج --' : '-- Select product --'}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.product_id && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.product_id}</p>}
              </div>

              {/* From */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  {ar ? 'من مخزن *' : 'From Warehouse *'}
                </label>
                <select
                  value={transfer.from_id}
                  onChange={e => setTransfer(p => ({ ...p, from_id: e.target.value }))}
                  style={{ ...inp(), borderColor: errors.from_id ? '#ef4444' : '#d1d5db' }}
                >
                  <option value="">{ar ? '-- مخزن المصدر --' : '-- Source --'}</option>
                  {warehouses.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {errors.from_id && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.from_id}</p>}
              </div>

              {/* To */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  {ar ? 'إلى مخزن *' : 'To Warehouse *'}
                </label>
                <select
                  value={transfer.to_id}
                  onChange={e => setTransfer(p => ({ ...p, to_id: e.target.value }))}
                  style={{ ...inp(), borderColor: errors.to_id ? '#ef4444' : '#d1d5db' }}
                >
                  <option value="">{ar ? '-- مخزن الوجهة --' : '-- Destination --'}</option>
                  {warehouses.filter(w => w.is_active && String(w.id) !== transfer.from_id).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {errors.to_id && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.to_id}</p>}
              </div>

              {/* Qty */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  {ar ? 'الكمية *' : 'Quantity *'}
                </label>
                <input
                  type="number" min="0.001" step="0.001"
                  value={transfer.qty}
                  onChange={e => setTransfer(p => ({ ...p, qty: e.target.value }))}
                  style={{ ...inp(), borderColor: errors.qty ? '#ef4444' : '#d1d5db' }}
                />
                {errors.qty && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.qty}</p>}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  {ar ? 'ملاحظات' : 'Notes'}
                </label>
                <input
                  value={transfer.notes}
                  onChange={e => setTransfer(p => ({ ...p, notes: e.target.value }))}
                  style={inp()}
                  placeholder={ar ? 'اختياري' : 'Optional'}
                />
              </div>

              <button type="submit" disabled={saving} style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: 8,
                background: saving ? '#93c5fd' : '#1a56db', color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {saving && <Spinner />}
                {saving ? (ar ? 'جاري التنفيذ...' : 'Processing...') : (ar ? '🔄 تنفيذ النقل' : '🔄 Execute Transfer')}
              </button>
            </form>
          </div>
        )}

        {/* ── Modal: Add / Edit Warehouse ─────────────────── */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 480 }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>
                {editing ? (ar ? '✏️ تعديل المخزن' : '✏️ Edit Warehouse') : (ar ? '+ إضافة مخزن' : '+ Add Warehouse')}
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'اسم المخزن *' : 'Warehouse Name *'}
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    style={{ ...inp(), borderColor: errors.name ? '#ef4444' : '#d1d5db' }}
                  />
                  {errors.name && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.name}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'الموقع' : 'Location'}
                  </label>
                  <input
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    style={inp()}
                    placeholder={ar ? 'مثال: القاهرة، المنطقة الصناعية' : 'e.g. Cairo, Industrial Zone'}
                  />
                </div>

                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox" id="wh_active"
                    checked={form.is_active}
                    onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="wh_active" style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    {ar ? 'مخزن نشط' : 'Active'}
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{
                    flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8,
                    background: '#fff', cursor: 'pointer', fontWeight: 600,
                  }}>
                    {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={saving} style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: 8,
                    background: saving ? '#93c5fd' : '#1a56db', color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    {saving && <Spinner />}
                    {saving ? (ar ? 'حفظ...' : 'Saving...') : (ar ? 'حفظ' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff',
      borderRadius: '50%', animation: 'spin .7s linear infinite',
    }} />
  )
}
