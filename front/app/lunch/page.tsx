'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type LunchOrder = {
  id: number
  employee_name?: string
  product_name?: string
  date?: string
  quantity?: number
  price?: number
  status: string
  created_at: string
}

type LunchProduct = { id: number; name: string; price: number; available: boolean; category?: string }

export default function LunchPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  const [orders, setOrders] = useState<LunchOrder[]>([])
  const [products, setProducts] = useState<LunchProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'orders' | 'menu'>('orders')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [today] = useState(new Date().toISOString().split('T')[0])

  const [form, setForm] = useState({ employee_name: '', product_id: '', quantity: '1', date: today })

  const fetchOrders = async () => {
    setLoading(true)
    const res = await api.get<{ data: LunchOrder[] }>(`/lunch/orders?per_page=30&date=${today}`)
    if (res.data) setOrders(res.data.data || (Array.isArray(res.data) ? res.data as LunchOrder[] : []))
    setLoading(false)
  }

  const fetchProducts = async () => {
    const res = await api.get<{ data: LunchProduct[] }>('/lunch/products?per_page=50')
    if (res.data) setProducts(res.data.data || (Array.isArray(res.data) ? res.data as LunchProduct[] : []))
  }

  useEffect(() => { fetchOrders(); fetchProducts() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.employee_name || !form.product_id) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/lunch/orders', { ...form, product_id: Number(form.product_id), quantity: Number(form.quantity) || 1 })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ employee_name: '', product_id: '', quantity: '1', date: today })
    fetchOrders()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/lunch/orders/${deleteId}`)
    setDeleteId(null); setOrders(prev => prev.filter(i => i.id !== deleteId))
  }

  const fmt = (n?: number) => n != null ? new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n) : '—'
  const statusBadge = (s: string) => ({ pending: 'badge-warning', confirmed: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger' }[s] || 'badge-muted')
  const statusLabel: Record<string, { ar: string; en: string }> = {
    pending:   { ar: 'معلق',    en: 'Pending' },
    confirmed: { ar: 'مؤكد',    en: 'Confirmed' },
    delivered: { ar: 'مُسلَّم', en: 'Delivered' },
    cancelled: { ar: 'ملغي',    en: 'Cancelled' },
  }

  const todayTotal = orders.reduce((s, o) => s + (o.price || 0) * (o.quantity || 1), 0)

  return (
    <ERPLayout pageTitle={ar ? 'إدارة وجبات الغداء' : 'Lunch Management'}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: ar ? 'طلبات اليوم' : "Today's Orders", value: orders.length, icon: '🍽️' },
          { label: ar ? 'معلقة' : 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: '⏳' },
          { label: ar ? 'مُسلَّمة' : 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: '✅' },
          { label: ar ? 'إجمالي اليوم' : "Today's Total", value: fmt(todayTotal), icon: '💰' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '2rem' }}>{c.icon}</span>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>{c.label}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid var(--color-border)' }}>
        {(['orders', 'menu'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            style={{ padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: tab === tabKey ? 700 : 400, borderBottom: tab === tabKey ? '2px solid var(--color-primary)' : '2px solid transparent', color: tab === tabKey ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: -2 }}>
            {tabKey === 'orders' ? (ar ? 'الطلبات' : 'Orders') : (ar ? 'قائمة الطعام' : 'Menu')}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {tab === 'orders' && <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ {ar ? 'طلب جديد' : 'New Order'}</button>}
      </div>

      {tab === 'orders' ? (
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🍱</div><p className="empty-state-text">{ar ? 'لا توجد طلبات اليوم' : 'No orders today'}</p></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr>
                  <th>#</th>
                  <th>{t('employee')}</th>
                  <th>{ar ? 'الوجبة' : 'Meal'}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('price')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr></thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="text-muted">#{order.id}</td>
                      <td className="fw-semibold">{order.employee_name || '—'}</td>
                      <td>{order.product_name || '—'}</td>
                      <td>{order.quantity || 1}</td>
                      <td>{fmt((order.price || 0) * (order.quantity || 1))}</td>
                      <td><span className={`badge ${statusBadge(order.status)}`}>{ar ? statusLabel[order.status]?.ar : statusLabel[order.status]?.en || order.status}</span></td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => setDeleteId(order.id)}>{t('delete')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {products.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}><div className="empty-state-icon">🍽️</div><p className="empty-state-text">{t('no_data')}</p></div>
          ) : products.map(p => (
            <div key={p.id} className="card" style={{ opacity: p.available ? 1 : 0.5 }}>
              <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 8 }}>🍱</div>
              <h4 style={{ margin: '0 0 4px', textAlign: 'center' }}>{p.name}</h4>
              {p.category && <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.8rem', margin: '0 0 8px' }}>{p.category}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{fmt(p.price)}</strong>
                <span className={`badge ${p.available ? 'badge-success' : 'badge-muted'}`}>{ar ? (p.available ? 'متاح' : 'غير متاح') : (p.available ? 'Available' : 'Unavailable')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar ? 'طلب وجبة جديد' : 'New Lunch Order'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{t('employee')} *</label>
                    <input className="input" value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الوجبة' : 'Meal'} *</label>
                    <select className="input" value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} required>
                      <option value="">{ar ? '-- اختر وجبة --' : '-- Select Meal --'}</option>
                      {products.filter(p => p.available).map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('quantity')}</label>
                    <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('date')}</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
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
