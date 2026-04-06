'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { StatCard, Badge, EmptyState, SearchInput, Modal, ToastContainer } from '../../components/ui'

type Movement = {
  id: number; type: 'in'|'out'|'transfer'; product: string; quantity: number
  warehouse_from?: string; warehouse_to?: string; reason?: string
  user?: string; created_at: string
}
type Warehouse = { id: number; name: string }
type Product   = { id: number; name: string }

const TYPE_META: Record<string, { ar: string; color: any; icon: string }> = {
  in:       { ar: 'وارد',   color: 'success', icon: '⬆️' },
  out:      { ar: 'صادر',  color: 'danger',  icon: '⬇️' },
  transfer: { ar: 'تحويل', color: 'warning', icon: '🔄' },
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
  const [form,     setForm]     = useState({ product_id:'', quantity:'', warehouse_id:'', type:'in', reason:'' })
  const [transfer, setTransfer] = useState({ product_id:'', quantity:'', from_warehouse_id:'', to_warehouse_id:'', reason:'' })

  const load = async () => {
    setLoading(true)
    const [mRes, wRes, pRes] = await Promise.all([
      api.get('/stock-movements?per_page=100'),
      api.get('/warehouses'),
      api.get('/products?per_page=200'),
    ])
    const mRaw = mRes.data; setMovements(Array.isArray(mRaw)?mRaw:(Array.isArray(mRaw?.data)?mRaw.data:[]))
    const wRaw = wRes.data; setWarehouses(Array.isArray(wRaw)?wRaw:(Array.isArray(wRaw?.data)?wRaw.data:[]))
    const pRaw = pRes.data; setProducts(Array.isArray(pRaw)?pRaw:(Array.isArray(pRaw?.data)?pRaw.data:[]))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = movements.filter(m => {
    const ms = !search || m.product?.toLowerCase().includes(search.toLowerCase())
    const mt = typeFilter==='all' || m.type===typeFilter
    return ms && mt
  })

  const handleAdd = async () => {
    if (!form.product_id || !form.quantity) { show('المنتج والكمية مطلوبان', 'error'); return }
    setSaving(true)
    const res = await api.post('/stock-movements', { ...form, quantity: Number(form.quantity) })
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show('تمت العملية ✅'); setShowAdd(false); load()
  }

  const handleTransfer = async () => {
    if (!transfer.product_id || !transfer.quantity || !transfer.from_warehouse_id || !transfer.to_warehouse_id) {
      show('كل الحقول مطلوبة', 'error'); return
    }
    setSaving(true)
    const res = await api.post('/stock-movements/transfer', { ...transfer, quantity: Number(transfer.quantity) })
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show('تم التحويل ✅'); setShowTransfer(false); load()
  }

  const INP: React.CSSProperties = {
    width:'100%', padding:'0.6rem 1rem', background:'var(--bg-input)',
    border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
    color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'inherit', outline:'none',
  }

  return (
    <ERPLayout pageTitle="حركة المخزون">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div><h1 className="page-title">📦 حركة المخزون</h1><p className="page-subtitle">متابعة الوارد والصادر والتحويلات</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTransfer(true)}>🔄 تحويل</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ حركة جديدة</button>
        </div>
      </div>
      <div className="grid-3" style={{marginBottom:'1.25rem'}}>
        <StatCard icon="⬆️" label="وارد"  value={movements.filter(m=>m.type==='in').length}       accent="var(--color-success)" />
        <StatCard icon="⬇️" label="صادر"  value={movements.filter(m=>m.type==='out').length}      accent="var(--color-danger)" />
        <StatCard icon="🔄" label="تحويل" value={movements.filter(m=>m.type==='transfer').length} accent="var(--color-warning)" />
      </div>
      <div style={{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}}>
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالمنتج..." />
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{...INP,width:'auto',minWidth:130}}>
          <option value="all">كل الأنواع</option>
          <option value="in">وارد</option><option value="out">صادر</option><option value="transfer">تحويل</option>
        </select>
      </div>
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {Array(5).fill(0).map((_,i) => <div key={i} className="skeleton" style={{height:52}} />)}
        </div>
      ) : filtered.length===0 ? <EmptyState icon="📦" title="لا توجد حركات" /> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>النوع</th><th>المنتج</th><th>الكمية</th><th>من</th><th>إلى</th><th>السبب</th><th>التاريخ</th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td><Badge color={TYPE_META[m.type]?.color??'gray'}>{TYPE_META[m.type]?.icon} {TYPE_META[m.type]?.ar}</Badge></td>
                  <td style={{fontWeight:600}}>{m.product}</td>
                  <td style={{fontWeight:700}}>{m.quantity}</td>
                  <td style={{fontSize:'0.8rem'}}>{m.warehouse_from||'—'}</td>
                  <td style={{fontSize:'0.8rem'}}>{m.warehouse_to||'—'}</td>
                  <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{m.reason||'—'}</td>
                  <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{new Date(m.created_at).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="إضافة حركة مخزون"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowAdd(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving?'⏳...':'حفظ'}</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">المنتج *</label>
            <select style={INP} value={form.product_id} onChange={e=>setForm(p=>({...p,product_id:e.target.value}))}>
              <option value="">اختر منتج</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-grid form-grid-2">
            <div className="input-group"><label className="input-label">النوع</label>
              <select style={INP} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                <option value="in">وارد ⬆️</option><option value="out">صادر ⬇️</option>
              </select></div>
            <div className="input-group"><label className="input-label">الكمية *</label>
              <input style={INP} type="number" min="1" value={form.quantity} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))} /></div>
          </div>
          <div className="input-group"><label className="input-label">المخزن</label>
            <select style={INP} value={form.warehouse_id} onChange={e=>setForm(p=>({...p,warehouse_id:e.target.value}))}>
              <option value="">اختر مخزن</option>
              {warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">السبب</label>
            <input style={INP} value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} /></div>
        </div>
      </Modal>
      <Modal open={showTransfer} onClose={()=>setShowTransfer(false)} title="تحويل بين مخازن"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowTransfer(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleTransfer} disabled={saving}>{saving?'⏳...':'تحويل'}</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">المنتج *</label>
            <select style={INP} value={transfer.product_id} onChange={e=>setTransfer(p=>({...p,product_id:e.target.value}))}>
              <option value="">اختر منتج</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">الكمية *</label>
            <input style={INP} type="number" min="1" value={transfer.quantity} onChange={e=>setTransfer(p=>({...p,quantity:e.target.value}))} /></div>
          <div className="form-grid form-grid-2">
            <div className="input-group"><label className="input-label">من مخزن *</label>
              <select style={INP} value={transfer.from_warehouse_id} onChange={e=>setTransfer(p=>({...p,from_warehouse_id:e.target.value}))}>
                <option value="">اختر</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
              </select></div>
            <div className="input-group"><label className="input-label">إلى مخزن *</label>
              <select style={INP} value={transfer.to_warehouse_id} onChange={e=>setTransfer(p=>({...p,to_warehouse_id:e.target.value}))}>
                <option value="">اختر</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
              </select></div>
          </div>
          <div className="input-group"><label className="input-label">سبب التحويل</label>
            <input style={INP} value={transfer.reason} onChange={e=>setTransfer(p=>({...p,reason:e.target.value}))} /></div>
        </div>
      </Modal>
    </ERPLayout>
  )
}
