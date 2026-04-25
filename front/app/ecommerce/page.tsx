'use client'

// ══════════════════════════════════════════════════════════
// app/ecommerce/page.tsx — التجارة الإلكترونية المتكاملة
// API endpoints:
//   GET  /api/ecommerce/products       → كتالوج المنتجات
//   GET  /api/ecommerce/orders         → الطلبات
//   POST /api/ecommerce/orders         → إنشاء طلب جديد
//   PUT  /api/ecommerce/orders/{id}/status → تحديث حالة الطلب
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { Modal, ToastContainer, EmptyState, StatCard } from '../../components/ui'

// ── Types ──────────────────────────────────────────────────
type Product = {
  id: number
  name: string
  description?: string
  price: number
  stock_quantity: number
  category?: string
  image_url?: string
  sku?: string
  currency?: string
}

type CartItem = { product: Product; qty: number }

type OrderItem = { product_id: number; product_name: string; quantity: number; unit_price: number; total: number }

type Order = {
  id: number
  reference?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  shipping_address?: string
  channel?: string
  total: number
  currency?: string
  status: string
  notes?: string
  items?: OrderItem[]
  created_at: string
}

// ── Constants ──────────────────────────────────────────────
const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled','returned']
const STATUS_META: Record<string, { ar: string; badge: string; icon: string }> = {
  pending:    { ar:'معلق',         badge:'badge-warning', icon:'⏳' },
  confirmed:  { ar:'مؤكد',         badge:'badge-info',    icon:'✅' },
  processing: { ar:'قيد التجهيز',  badge:'badge-primary', icon:'⚙️' },
  shipped:    { ar:'تم الشحن',     badge:'badge-primary', icon:'🚚' },
  delivered:  { ar:'تم التسليم',   badge:'badge-success', icon:'📦' },
  cancelled:  { ar:'ملغي',          badge:'badge-danger',  icon:'❌' },
  returned:   { ar:'مُرتجع',        badge:'badge-muted',   icon:'↩️' },
}

const EMPTY_CHECKOUT = {
  customer_name: '', customer_email: '', customer_phone: '',
  shipping_address: '', notes: '', currency: 'EGP',
}

const INP: React.CSSProperties = {
  width:'100%', padding:'0.6rem 1rem', background:'var(--bg-input)',
  border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
  color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'inherit', outline:'none',
}

export default function EcommercePage() {
  const { toasts, show, remove } = useToast()

  const [tab, setTab] = useState<'catalog'|'orders'>('catalog')

  // Products
  const [products, setProducts]     = useState<Product[]>([])
  const [prodLoad, setProdLoad]     = useState(true)
  const [prodSearch, setProdSearch] = useState('')
  const [prodCat, setProdCat]       = useState('')

  // Cart
  const [cart, setCart]         = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  // Checkout
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkout, setCheckout]         = useState(EMPTY_CHECKOUT)
  const [placing, setPlacing]           = useState(false)

  // Orders
  const [orders, setOrders]       = useState<Order[]>([])
  const [ordLoad, setOrdLoad]     = useState(true)
  const [ordSearch, setOrdSearch] = useState('')
  const [ordStatus, setOrdStatus] = useState('')
  const [viewOrder, setViewOrder] = useState<Order | null>(null)

  useEffect(() => { loadProducts() }, [prodSearch, prodCat])
  useEffect(() => { loadOrders()   }, [ordSearch, ordStatus])

  const loadProducts = async () => {
    setProdLoad(true)
    const p = new URLSearchParams({ per_page:'50' })
    if (prodSearch) p.set('search', prodSearch)
    if (prodCat)    p.set('category', prodCat)
    const res = await api.get(`/ecommerce/products?${p}`)
    if (res.data) setProducts(Array.isArray(res.data) ? res.data : (res.data.data ?? []))
    setProdLoad(false)
  }

  const loadOrders = async () => {
    setOrdLoad(true)
    const p = new URLSearchParams({ per_page:'50' })
    if (ordSearch) p.set('search', ordSearch)
    if (ordStatus) p.set('status', ordStatus)
    const res = await api.get(`/ecommerce/orders?${p}`)
    if (res.data) setOrders(Array.isArray(res.data) ? res.data : (res.data.data ?? []))
    setOrdLoad(false)
  }

  // Cart helpers
  const addToCart = (p: Product) => {
    if (p.stock_quantity <= 0) { show('المنتج غير متوفر في المخزون', 'error'); return }
    setCart(prev => {
      const ex = prev.find(c => c.product.id === p.id)
      if (ex) {
        if (ex.qty >= p.stock_quantity) { show('وصلت للحد الأقصى المتاح: ' + p.stock_quantity, 'error'); return prev }
        return prev.map(c => c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { product: p, qty: 1 }]
    })
    show(`✅ تمت إضافة "${p.name}" للسلة`)
  }

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, qty } : c))
  }

  const removeFromCart = (productId: number) =>
    setCart(prev => prev.filter(c => c.product.id !== productId))

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.qty, 0)
  const cartCount = cart.reduce((s, c) => s + c.qty, 0)

  const handlePlaceOrder = async () => {
    if (!checkout.customer_name || !checkout.shipping_address) {
      show('اسم العميل والعنوان مطلوبان', 'error'); return
    }
    if (cart.length === 0) { show('السلة فارغة', 'error'); return }
    setPlacing(true)
    const res = await api.post('/ecommerce/orders', {
      ...checkout,
      items: cart.map(c => ({ product_id: c.product.id, quantity: c.qty, unit_price: c.product.price })),
      total: cartTotal,
      channel: 'website',
    })
    setPlacing(false)
    if (res.error) { show(res.error, 'error'); return }
    show('✅ تم إنشاء الطلب بنجاح!')
    setCart([]); setShowCheckout(false); setShowCart(false); setCheckout(EMPTY_CHECKOUT)
    loadOrders(); setTab('orders')
  }

  const updateStatus = async (order: Order, status: string) => {
    const res = await api.put(`/ecommerce/orders/${order.id}/status`, { status })
    if (res.error) { show(res.error, 'error'); return }
    show(`✅ تم تحديث الحالة إلى ${STATUS_META[status]?.ar || status}`)
    loadOrders()
    if (viewOrder?.id === order.id) setViewOrder({ ...viewOrder, status })
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
  const fmt = (n: number, cur = 'EGP') =>
    new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n) + ' ' + cur

  return (
    <ERPLayout pageTitle="التجارة الإلكترونية">
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🛍️ التجارة الإلكترونية</h1>
          <p className="page-subtitle">إدارة المنتجات والطلبات ومتابعة المخزون</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCart(true)} style={{ position:'relative' }}>
          🛒 السلة
          {cartCount > 0 && (
            <span style={{ position:'absolute', top:-8, right:-8, background:'var(--color-danger)', color:'#fff', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800 }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:'1.25rem' }}>
        <StatCard icon="📦" label="إجمالي المنتجات"  value={products.length} />
        <StatCard icon="🛒" label="إجمالي الطلبات"   value={orders.length} />
        <StatCard icon="⏳" label="طلبات معلقة"       value={orders.filter(o => o.status==='pending').length}   accent="var(--color-warning)" />
        <StatCard icon="✅" label="تم التسليم"         value={orders.filter(o => o.status==='delivered').length} accent="var(--color-success)" />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:'1.25rem', borderBottom:'1px solid var(--border)' }}>
        {(['catalog','orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'0.6rem 1.25rem', border:'none', cursor:'pointer', fontWeight: tab===t ? 700 : 400,
            background: tab===t ? 'var(--bg-card)' : 'transparent',
            color: tab===t ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: tab===t ? '2px solid var(--color-primary)' : '2px solid transparent',
            fontFamily:'inherit', fontSize:'0.9rem', borderRadius:'var(--radius-md) var(--radius-md) 0 0',
          }}>
            {t==='catalog' ? '🏪 كتالوج المنتجات' : `📋 الطلبات (${orders.length})`}
          </button>
        ))}
      </div>

      {/* ── CATALOG ── */}
      {tab === 'catalog' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:'1rem', flexWrap:'wrap' }}>
            <div className="search-bar" style={{ flex:1, minWidth:200 }}>
              <span>🔍</span>
              <input placeholder="بحث في المنتجات..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
            </div>
            <select className="input" style={{ width:'auto', minWidth:160 }} value={prodCat} onChange={e => setProdCat(e.target.value)}>
              <option value="">كل الفئات</option>
              {categories.map(c => <option key={c} value={c!}>{c}</option>)}
            </select>
          </div>

          {prodLoad ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:16 }}>
              {Array(8).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:280, borderRadius:'var(--radius-lg)' }} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState icon="🛍️" title="لا توجد منتجات" description="أضف منتجات من نظام المخزون لتظهر هنا" />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:16 }}>
              {products.map(p => (
                <div key={p.id} className="card" style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <div style={{ height:150, background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', position:'relative' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '📦'}
                    {p.stock_quantity <= 0 && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ color:'#fff', fontWeight:800 }}>نفدت الكمية</span>
                      </div>
                    )}
                    {p.stock_quantity > 0 && p.stock_quantity <= 5 && (
                      <span style={{ position:'absolute', top:8, right:8, background:'var(--color-warning)', color:'#fff', fontSize:'0.7rem', padding:'2px 6px', borderRadius:'var(--radius-full)', fontWeight:700 }}>آخر {p.stock_quantity}</span>
                    )}
                  </div>
                  <div style={{ padding:'0.875rem', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                    {p.category && <span style={{ fontSize:'0.7rem', color:'var(--color-primary)', fontWeight:700 }}>{p.category}</span>}
                    <h4 style={{ margin:0, fontSize:'0.9rem', fontWeight:700 }}>{p.name}</h4>
                    {p.description && <p style={{ margin:0, fontSize:'0.78rem', color:'var(--text-muted)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.description}</p>}
                    {p.sku && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'monospace' }}>SKU: {p.sku}</span>}
                  </div>
                  <div style={{ padding:'0.75rem 0.875rem', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--color-primary)' }}>{fmt(p.price, p.currency || 'EGP')}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>مخزون: {p.stock_quantity}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => addToCart(p)} disabled={p.stock_quantity <= 0}>+ أضف</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS ── */}
      {tab === 'orders' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:'1rem', flexWrap:'wrap' }}>
            <div className="search-bar" style={{ flex:1, minWidth:200 }}>
              <span>🔍</span>
              <input placeholder="بحث برقم الطلب أو اسم العميل..." value={ordSearch} onChange={e => setOrdSearch(e.target.value)} />
            </div>
            <select className="input" style={{ width:'auto', minWidth:160 }} value={ordStatus} onChange={e => setOrdStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.icon} {STATUS_META[s]?.ar}</option>)}
            </select>
          </div>

          <div className="card" style={{ padding:0 }}>
            {ordLoad ? (
              <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:12 }}>
                {Array(6).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:44 }} />)}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState icon="🛒" title="لا توجد طلبات" description="لم يتم تسجيل أي طلبات بعد" />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>رقم الطلب</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr>
                  </thead>
                  <tbody>
                    {orders.map(o => {
                      const sm = STATUS_META[o.status] || { ar:o.status, badge:'badge-muted', icon:'?' }
                      return (
                        <tr key={o.id}>
                          <td style={{ fontWeight:700, fontFamily:'monospace' }}>{o.reference || `ORD-${String(o.id).padStart(5,'0')}`}</td>
                          <td>
                            <div style={{ fontWeight:600 }}>{o.customer_name || '—'}</div>
                            {o.customer_email && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', direction:'ltr' }}>{o.customer_email}</div>}
                          </td>
                          <td style={{ fontWeight:700, color:'var(--color-primary)' }}>{fmt(o.total, o.currency || 'EGP')}</td>
                          <td><span className={`badge ${sm.badge}`}>{sm.icon} {sm.ar}</span></td>
                          <td style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
                          <td>
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => setViewOrder(o)}>👁 عرض</button>
                              {o.status === 'pending'   && <button className="btn btn-sm" style={{ background:'var(--color-success-light)', color:'var(--color-success)' }} onClick={() => updateStatus(o,'confirmed')}>✅ تأكيد</button>}
                              {o.status === 'confirmed' && <button className="btn btn-sm" style={{ background:'var(--color-primary-light)', color:'var(--color-primary)' }} onClick={() => updateStatus(o,'shipped')}>🚚 شحن</button>}
                              {o.status === 'shipped'   && <button className="btn btn-sm" style={{ background:'var(--color-success-light)', color:'var(--color-success)' }} onClick={() => updateStatus(o,'delivered')}>📦 تسليم</button>}
                              {!['delivered','cancelled','returned'].includes(o.status) && (
                                <button className="btn btn-sm" style={{ background:'var(--color-danger-light)', color:'var(--color-danger)' }} onClick={() => updateStatus(o,'cancelled')}>❌ إلغاء</button>
                              )}
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
        </div>
      )}

      {/* ── CART MODAL ── */}
      <Modal open={showCart} onClose={() => setShowCart(false)} title={`🛒 السلة (${cartCount} منتج)`} size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCart(false)}>متابعة التسوق</button>
            {cart.length > 0 && (
              <button className="btn btn-primary" onClick={() => { setShowCart(false); setShowCheckout(true) }}>
                إتمام الشراء — {fmt(cartTotal)}
              </button>
            )}
          </>
        }
      >
        {cart.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>🛒</div>
            <p>السلة فارغة</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {cart.map(c => (
              <div key={c.product.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'0.75rem', background:'var(--bg-hover)', borderRadius:'var(--radius-md)' }}>
                <div style={{ width:40, height:40, background:'var(--bg-card)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
                  {c.product.image_url ? <img src={c.product.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--radius-sm)' }} /> : '📦'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{c.product.name}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--color-primary)', fontWeight:700 }}>{fmt(c.product.price, c.product.currency || 'EGP')}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button className="btn btn-secondary btn-sm" style={{ width:28, height:28, padding:0 }} onClick={() => updateQty(c.product.id, c.qty-1)}>−</button>
                  <span style={{ minWidth:24, textAlign:'center', fontWeight:700 }}>{c.qty}</span>
                  <button className="btn btn-secondary btn-sm" style={{ width:28, height:28, padding:0 }} onClick={() => updateQty(c.product.id, c.qty+1)}>+</button>
                </div>
                <div style={{ fontWeight:700, minWidth:80, textAlign:'end', fontSize:'0.875rem' }}>{fmt(c.product.price * c.qty)}</div>
                <button className="btn btn-danger btn-sm" style={{ width:28, height:28, padding:0 }} onClick={() => removeFromCart(c.product.id)}>✕</button>
              </div>
            ))}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'1.1rem' }}>
              <span>الإجمالي:</span>
              <span style={{ color:'var(--color-primary)' }}>{fmt(cartTotal)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* ── CHECKOUT MODAL ── */}
      <Modal open={showCheckout} onClose={() => setShowCheckout(false)} title="🏷️ إتمام الطلب" size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowCheckout(false); setShowCart(true) }}>← السلة</button>
            <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={placing}>
              {placing ? '⏳ جارٍ الإرسال...' : `✅ تأكيد الطلب — ${fmt(cartTotal)}`}
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2">
          <div className="input-group">
            <label className="input-label">اسم العميل *</label>
            <input style={INP} value={checkout.customer_name} onChange={e => setCheckout(f => ({ ...f, customer_name: e.target.value }))} placeholder="محمد أحمد" />
          </div>
          <div className="input-group">
            <label className="input-label">البريد الإلكتروني</label>
            <input style={INP} type="email" value={checkout.customer_email} onChange={e => setCheckout(f => ({ ...f, customer_email: e.target.value }))} dir="ltr" />
          </div>
          <div className="input-group">
            <label className="input-label">رقم الهاتف</label>
            <input style={INP} value={checkout.customer_phone} onChange={e => setCheckout(f => ({ ...f, customer_phone: e.target.value }))} dir="ltr" />
          </div>
          <div className="input-group">
            <label className="input-label">العملة</label>
            <select style={INP} value={checkout.currency} onChange={e => setCheckout(f => ({ ...f, currency: e.target.value }))}>
              {['EGP','USD','EUR','SAR','AED'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ gridColumn:'1/-1' }}>
            <label className="input-label">عنوان الشحن *</label>
            <input style={INP} value={checkout.shipping_address} onChange={e => setCheckout(f => ({ ...f, shipping_address: e.target.value }))} placeholder="القاهرة، شارع..." />
          </div>
          <div className="input-group" style={{ gridColumn:'1/-1' }}>
            <label className="input-label">ملاحظات</label>
            <textarea style={{ ...INP, resize:'vertical', minHeight:64 }} value={checkout.notes} onChange={e => setCheckout(f => ({ ...f, notes: e.target.value }))} placeholder="تعليمات إضافية..." />
          </div>
        </div>
        <div style={{ marginTop:'1rem', padding:'0.875rem', background:'var(--bg-hover)', borderRadius:'var(--radius-md)' }}>
          <div style={{ fontWeight:700, marginBottom:8, fontSize:'0.875rem' }}>📋 ملخص الطلب</div>
          {cart.map(c => (
            <div key={c.product.id} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:4 }}>
              <span>{c.product.name} × {c.qty}</span>
              <span>{fmt(c.product.price * c.qty, checkout.currency)}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:800, color:'var(--color-primary)' }}>
            <span>الإجمالي</span>
            <span>{fmt(cartTotal, checkout.currency)}</span>
          </div>
        </div>
      </Modal>

      {/* ── VIEW ORDER MODAL ── */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)}
        title={`📦 الطلب: ${viewOrder?.reference || `ORD-${String(viewOrder?.id).padStart(5,'0')}`}`}
        size="md"
        footer={
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {viewOrder?.status === 'pending'   && <button className="btn btn-sm" style={{ background:'var(--color-success-light)', color:'var(--color-success)' }} onClick={() => updateStatus(viewOrder,'confirmed')}>✅ تأكيد</button>}
            {viewOrder?.status === 'confirmed' && <button className="btn btn-sm" style={{ background:'var(--color-primary-light)', color:'var(--color-primary)' }} onClick={() => updateStatus(viewOrder,'shipped')}>🚚 شحن</button>}
            {viewOrder?.status === 'shipped'   && <button className="btn btn-sm" style={{ background:'var(--color-success-light)', color:'var(--color-success)' }} onClick={() => updateStatus(viewOrder,'delivered')}>📦 تسليم</button>}
            <button className="btn btn-secondary" onClick={() => setViewOrder(null)}>إغلاق</button>
          </div>
        }
      >
        {viewOrder && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'0.875rem' }}>الحالة:</span>
              <span className={`badge ${STATUS_META[viewOrder.status]?.badge || 'badge-muted'}`}>
                {STATUS_META[viewOrder.status]?.icon} {STATUS_META[viewOrder.status]?.ar || viewOrder.status}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'العميل', val: viewOrder.customer_name || '—' },
                { label:'الإيميل', val: viewOrder.customer_email || '—' },
                { label:'الهاتف', val: viewOrder.customer_phone || '—' },
                { label:'تاريخ الطلب', val: new Date(viewOrder.created_at).toLocaleDateString('ar-EG') },
              ].map(item => (
                <div key={item.label} style={{ padding:'8px 12px', background:'var(--bg-hover)', borderRadius:'var(--radius-sm)' }}>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:2 }}>{item.label}</div>
                  <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{item.val}</div>
                </div>
              ))}
              {viewOrder.shipping_address && (
                <div style={{ gridColumn:'1/-1', padding:'8px 12px', background:'var(--bg-hover)', borderRadius:'var(--radius-sm)' }}>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:2 }}>عنوان الشحن</div>
                  <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{viewOrder.shipping_address}</div>
                </div>
              )}
            </div>
            {viewOrder.items && viewOrder.items.length > 0 && (
              <div>
                <div style={{ fontWeight:700, marginBottom:8, fontSize:'0.875rem' }}>📋 المنتجات</div>
                {viewOrder.items.map((item, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'var(--bg-hover)', borderRadius:'var(--radius-sm)', marginBottom:6, fontSize:'0.85rem' }}>
                    <span>{item.product_name} × {item.quantity}</span>
                    <span style={{ fontWeight:700, color:'var(--color-primary)' }}>{fmt(item.total, viewOrder.currency || 'EGP')}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', fontWeight:800, fontSize:'1rem', color:'var(--color-primary)' }}>
                  <span>الإجمالي</span>
                  <span>{fmt(viewOrder.total, viewOrder.currency || 'EGP')}</span>
                </div>
              </div>
            )}
            {viewOrder.notes && (
              <div style={{ padding:'8px 12px', background:'var(--color-warning-light)', borderRadius:'var(--radius-sm)', fontSize:'0.85rem' }}>
                📝 {viewOrder.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </ERPLayout>
  )
}
