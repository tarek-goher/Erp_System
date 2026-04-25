'use client'

// ══════════════════════════════════════════════════════════
// app/pos/page.tsx — نقطة البيع (POS)
// جديد مقارنة بالنسخة القديمة:
//  - barcode scanner (input + GET /api/pos/barcode/{code})
//  - loyalty points (عرض رصيد + استرداد)
//  - payment methods (cash / card / split)
//  - shift management محسّن
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Shift   = { id: number; status: string; opening_balance?: number; total_sales?: number; total_orders?: number; created_at: string }
type Product = { id: number; name: string; barcode?: string; sku?: string; sell_price: number; qty: number; category?: { name: string } }
type CartItem = { product: Product; qty: number; discount: number }
type Customer = { id: number; name: string; loyalty_points?: number }

export default function PosPage() {
  const { lang } = useI18n()

  const [currentShift,  setCurrentShift]  = useState<Shift | null>(null)
  const [shifts,        setShifts]        = useState<Shift[]>([])
  const [products,      setProducts]      = useState<Product[]>([])
  const [customers,     setCustomers]     = useState<Customer[]>([])
  const [cart,          setCart]          = useState<CartItem[]>([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)

  const [search,        setSearch]        = useState('')
  const [barcodeInput,  setBarcodeInput]  = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loyaltyInfo,   setLoyaltyInfo]   = useState<{ loyalty_points: number; redeemable_egp: number } | null>(null)
  const [redeemPoints,  setRedeemPoints]  = useState(0)
  const [payMethod,     setPayMethod]     = useState<'cash' | 'card' | 'split'>('cash')
  const [discount,      setDiscount]      = useState(0)
  const [tax,           setTax]           = useState(0)

  // Modals
  const [openShiftModal,  setOpenShiftModal]  = useState(false)
  const [closeShiftModal, setCloseShiftModal] = useState(false)
  const [openingBalance,  setOpeningBalance]  = useState('')
  const [closingBalance,  setClosingBalance]  = useState('')
  const [orderDone,       setOrderDone]       = useState(false)
  const [lastOrder,       setLastOrder]       = useState<any>(null)

  const barcodeRef = useRef<HTMLInputElement>(null)

  // ── Fetch ─────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true)
    const [shiftRes, prodsRes, custsRes] = await Promise.all([
      api.get<Shift>('/pos/current-shift'),
      api.get<Product[]>('/pos/products'),
      api.get<{ data: Customer[] }>('/customers?per_page=200'),
    ])
    if (shiftRes.data) setCurrentShift(shiftRes.data)
    if (prodsRes.data) setProducts(Array.isArray(prodsRes.data) ? prodsRes.data : (prodsRes.data as any)?.data || [])
    if (custsRes.data) setCustomers((custsRes.data as any).data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (selectedCustomer) {
      api.get(`/pos/loyalty/${selectedCustomer.id}`).then(r => {
        if (r.data) setLoyaltyInfo(r.data as any)
      })
    } else {
      setLoyaltyInfo(null)
      setRedeemPoints(0)
    }
  }, [selectedCustomer])

  // ── Barcode Scanner ───────────────────────────────────────
  const handleBarcodeSearch = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const code = barcodeInput.trim()
    if (!code) return
    const res = await api.get<Product>(`/pos/barcode/${encodeURIComponent(code)}`)
    if (res.data) {
      addToCart(res.data)
      setBarcodeInput('')
    } else {
      alert(lang === 'ar' ? 'لم يتم العثور على المنتج' : 'Product not found')
    }
  }

  // ── Cart ───────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1, discount: 0 }]
    })
  }

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.product.id !== id))
  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i))
  }

  const subtotal     = cart.reduce((s, i) => s + i.product.sell_price * i.qty - i.discount, 0)
  const pointsAmount = Math.min(redeemPoints, loyaltyInfo?.loyalty_points ?? 0) * 0.1
  const total        = Math.max(0, subtotal + tax - discount - pointsAmount)

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Shift ──────────────────────────────────────────────────
  const openShift = async () => {
    if (!openingBalance) return
    setSaving(true)
    const res = await api.post('/pos/open-shift', { opening_balance: Number(openingBalance) })
    setSaving(false)
    if (!res.error) { setCurrentShift(res.data?.data || res.data); setOpenShiftModal(false); setOpeningBalance('') }
  }

  const closeShift = async () => {
    if (!currentShift || !closingBalance) return
    setSaving(true)
    const res = await api.post(`/pos/close-shift/${currentShift.id}`, { closing_balance: Number(closingBalance) })
    setSaving(false)
    if (!res.error) { setCurrentShift(null); setCloseShiftModal(false); setClosingBalance('') }
  }

  // ── Checkout ───────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!currentShift || cart.length === 0) return
    setSaving(true)
    const res = await api.post('/pos/sale', {
      shift_id:       currentShift.id,
      customer_id:    selectedCustomer?.id,
      items:          cart.map(i => ({ product_id: i.product.id, qty: i.qty, price: i.product.sell_price, discount: i.discount })),
      payment_method: payMethod,
      tax,
      discount,
      redeem_points:  redeemPoints > 0 ? redeemPoints : undefined,
    })
    setSaving(false)
    if (!res.error) {
      setLastOrder(res.data)
      setOrderDone(true)
      setCart([])
      setDiscount(0)
      setTax(0)
      setRedeemPoints(0)
      setSelectedCustomer(null)
    }
  }

  return (
    <ERPLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{lang === 'ar' ? 'نقطة البيع (POS)' : 'Point of Sale'}</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!currentShift
              ? <button className="btn btn-success" onClick={() => setOpenShiftModal(true)}>{lang === 'ar' ? 'فتح وردية' : 'Open Shift'}</button>
              : <button className="btn btn-danger"  onClick={() => setCloseShiftModal(true)}>{lang === 'ar' ? 'إغلاق الوردية' : 'Close Shift'}</button>
            }
          </div>
        </div>

        {/* Shift Status */}
        {currentShift && (
          <div style={{ background: 'var(--color-success-light)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓ {lang === 'ar' ? 'وردية مفتوحة' : 'Shift Open'}</span>
            <span className="text-muted">{lang === 'ar' ? 'رصيد الافتتاح:' : 'Opening:'} {Number(currentShift.opening_balance || 0).toLocaleString()} {lang === 'ar' ? 'ج' : 'EGP'}</span>
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

            {/* Left: Products */}
            <div>
              {/* Search + Barcode */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <input className="form-input" placeholder={lang === 'ar' ? '🔍 بحث بالاسم...' : '🔍 Search products...'} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
                <input ref={barcodeRef} className="form-input" placeholder={lang === 'ar' ? '📷 باركود (Enter)' : '📷 Scan barcode (Enter)'} value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeSearch}
                  style={{ width: 220 }}
                />
              </div>

              {/* Products Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {filteredProducts.map(p => (
                  <button key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={!currentShift || p.qty <= 0}
                    style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                      padding: '1rem', textAlign: lang === 'ar' ? 'right' : 'left', cursor: !currentShift || p.qty <= 0 ? 'not-allowed' : 'pointer',
                      opacity: p.qty <= 0 ? 0.5 : 1, transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { if (currentShift && p.qty > 0) (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    {p.barcode && <div className="text-muted" style={{ fontSize: '0.72rem', marginBottom: 4 }}>{p.barcode}</div>}
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{Number(p.sell_price).toLocaleString()} {lang === 'ar' ? 'ج' : 'EGP'}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{lang === 'ar' ? 'مخزون:' : 'Stock:'} {p.qty}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Cart */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '1rem' }}>
                🛒 {lang === 'ar' ? 'الفاتورة' : 'Cart'} ({cart.length})
              </div>

              {/* Customer + Loyalty */}
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                <label className="form-label">{lang === 'ar' ? 'العميل' : 'Customer'}</label>
                <select className="form-select" value={selectedCustomer?.id || ''} onChange={e => {
                  const c = customers.find(c => c.id === Number(e.target.value)) || null
                  setSelectedCustomer(c); setRedeemPoints(0)
                }}>
                  <option value="">{lang === 'ar' ? '— بدون عميل —' : '— No customer —'}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {loyaltyInfo && loyaltyInfo.loyalty_points > 0 && (
                  <div style={{ marginTop: '0.5rem', background: 'var(--color-warning-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>⭐ {loyaltyInfo.loyalty_points} {lang === 'ar' ? 'نقطة' : 'pts'}</span>
                    {' → '}
                    <span>{loyaltyInfo.redeemable_egp.toFixed(2)} {lang === 'ar' ? 'ج' : 'EGP'}</span>
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" min={0} max={loyaltyInfo.loyalty_points} value={redeemPoints}
                        onChange={e => setRedeemPoints(Math.min(Number(e.target.value), loyaltyInfo.loyalty_points))}
                        style={{ width: 80 }} className="form-input"
                        placeholder="0"
                      />
                      <span style={{ fontSize: '0.8rem' }}>{lang === 'ar' ? 'نقطة للاسترداد' : 'pts to redeem'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div style={{ maxHeight: '35vh', overflowY: 'auto' }}>
                {cart.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {lang === 'ar' ? 'الفاتورة فارغة' : 'Cart is empty'}
                  </div>
                ) : cart.map(item => (
                  <div key={item.product.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{Number(item.product.sell_price).toLocaleString()} {lang === 'ar' ? 'ج/وحدة' : 'EGP/unit'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => updateQty(item.product.id, item.qty - 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontWeight: 700 }}>-</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, item.qty + 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontWeight: 700 }}>+</button>
                    </div>
                    <div style={{ fontWeight: 700, minWidth: 70, textAlign: 'end' }}>{(item.product.sell_price * item.qty).toLocaleString()}</div>
                    <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>{lang === 'ar' ? 'خصم' : 'Discount'}</label>
                    <input type="number" className="form-input" min={0} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>{lang === 'ar' ? 'ضريبة' : 'Tax'}</label>
                    <input type="number" className="form-input" min={0} value={tax} onChange={e => setTax(Number(e.target.value))} />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['cash', 'card', 'split'] as const).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className={`btn btn-sm ${payMethod === m ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1 }}
                      >
                        {m === 'cash' ? (lang === 'ar' ? 'كاش' : 'Cash') : m === 'card' ? (lang === 'ar' ? 'كارت' : 'Card') : (lang === 'ar' ? 'مزيج' : 'Split')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {[
                  { label: lang === 'ar' ? 'المجموع' : 'Subtotal',         value: subtotal },
                  ...(discount > 0 ? [{ label: lang === 'ar' ? 'خصم' : 'Discount', value: -discount }] : []),
                  ...(tax > 0      ? [{ label: lang === 'ar' ? 'ضريبة' : 'Tax',    value: tax }] : []),
                  ...(redeemPoints > 0 ? [{ label: lang === 'ar' ? 'نقاط مستردة' : 'Points Redeemed', value: -pointsAmount }] : []),
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4, color: r.value < 0 ? 'var(--color-success)' : 'inherit' }}>
                    <span>{r.label}</span><span>{Number(r.value).toLocaleString()} {lang === 'ar' ? 'ج' : 'EGP'}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid var(--border)' }}>
                  <span>{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span style={{ color: 'var(--color-primary)' }}>{total.toLocaleString()} {lang === 'ar' ? 'ج' : 'EGP'}</span>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.875rem', fontSize: '1rem' }}
                  onClick={handleCheckout}
                  disabled={!currentShift || cart.length === 0 || saving}
                >
                  {saving ? (lang === 'ar' ? 'جاري...' : 'Processing...') : lang === 'ar' ? '✓ تأكيد البيع' : '✓ Confirm Sale'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

        {/* Modal: Open Shift */}
        {openShiftModal && (
          <div className="modal-overlay" onClick={() => setOpenShiftModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modal-header"><h2>{lang === 'ar' ? 'فتح وردية' : 'Open Shift'}</h2><button className="modal-close" onClick={() => setOpenShiftModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'رصيد الافتتاح (ج)' : 'Opening Balance (EGP)'}</label>
                  <input className="form-input" type="number" min={0} value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setOpenShiftModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button className="btn btn-success" onClick={openShift} disabled={!openingBalance || saving}>{lang === 'ar' ? 'فتح' : 'Open'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Close Shift */}
        {closeShiftModal && (
          <div className="modal-overlay" onClick={() => setCloseShiftModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modal-header"><h2>{lang === 'ar' ? 'إغلاق الوردية' : 'Close Shift'}</h2><button className="modal-close" onClick={() => setCloseShiftModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'رصيد الإغلاق (ج)' : 'Closing Balance (EGP)'}</label>
                  <input className="form-input" type="number" min={0} value={closingBalance} onChange={e => setClosingBalance(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setCloseShiftModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button className="btn btn-danger" onClick={closeShift} disabled={!closingBalance || saving}>{lang === 'ar' ? 'إغلاق' : 'Close'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Success */}
        {orderDone && (
          <div className="modal-overlay" onClick={() => setOrderDone(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
              <div className="modal-body" style={{ padding: '2.5rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ marginBottom: '0.5rem' }}>{lang === 'ar' ? 'تم البيع بنجاح!' : 'Sale Completed!'}</h2>
                <p className="text-muted">{lang === 'ar' ? 'تم تسجيل الفاتورة بنجاح' : 'Invoice has been recorded'}</p>
                {redeemPoints > 0 && <p style={{ color: 'var(--color-warning)', fontWeight: 600 }}>⭐ {lang === 'ar' ? `تم خصم ${redeemPoints} نقطة` : `${redeemPoints} pts redeemed`}</p>}
              </div>
              <div className="modal-footer" style={{ justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => setOrderDone(false)}>{lang === 'ar' ? 'فاتورة جديدة' : 'New Sale'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}
