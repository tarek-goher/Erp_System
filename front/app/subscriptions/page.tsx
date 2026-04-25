'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Subscription = {
  id: number
  reference?: string
  customer_name?: string
  plan_name?: string
  price?: number
  currency?: string
  billing_cycle?: string
  start_date?: string
  renewal_date?: string
  status: string
  created_at: string
}

type Plan = { id: number; name: string; price: number; billing_cycle: string; features?: string[] }

const STATUSES = ['active', 'trial', 'expired', 'cancelled', 'pending']

export default function SubscriptionsPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  const [items, setItems] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  const [form, setForm] = useState({ customer_name: '', plan_id: '', start_date: new Date().toISOString().split('T')[0], billing_cycle: 'monthly' })

  const fetch = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }), ...(statusF && { status: statusF }) })
    const res = await api.get<{ data: Subscription[] }>(`/subscriptions?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as Subscription[] : []))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [search, statusF])
  useEffect(() => {
    api.get<{ data: Plan[] }>('/subscription-plans?per_page=50').then(r => {
      if (r.data) setPlans(r.data.data || (Array.isArray(r.data) ? r.data as Plan[] : []))
    })
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.customer_name) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/subscriptions', { ...form, plan_id: form.plan_id ? Number(form.plan_id) : null })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ customer_name: '', plan_id: '', start_date: new Date().toISOString().split('T')[0], billing_cycle: 'monthly' })
    fetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/subscriptions/${deleteId}`)
    setDeleteId(null); setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const handleCancel = async (id: number) => {
    await api.put(`/subscriptions/${id}`, { status: 'cancelled' })
    fetch()
  }

  const statusLabel: Record<string, { ar: string; en: string }> = {
    active:    { ar: 'نشط',           en: 'Active' },
    trial:     { ar: 'تجريبي',        en: 'Trial' },
    expired:   { ar: 'منتهي',         en: 'Expired' },
    cancelled: { ar: 'ملغي',          en: 'Cancelled' },
    pending:   { ar: 'في الانتظار',   en: 'Pending' },
  }
  const statusBadge = (s: string) => ({
    active: 'badge-success', trial: 'badge-info', expired: 'badge-warning', cancelled: 'badge-danger', pending: 'badge-muted'
  }[s] || 'badge-muted')

  const cycleLabel: Record<string, { ar: string; en: string }> = {
    monthly:  { ar: 'شهري',   en: 'Monthly' },
    quarterly: { ar: 'ربع سنوي', en: 'Quarterly' },
    yearly:   { ar: 'سنوي',    en: 'Yearly' },
  }

  const fmt = (n?: number) => n != null ? new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n) : '—'
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'

  const activeCount = items.filter(i => i.status === 'active').length
  const mrr = items.filter(i => i.status === 'active').reduce((s, i) => {
    const price = i.price || 0
    if (i.billing_cycle === 'yearly') return s + price / 12
    if (i.billing_cycle === 'quarterly') return s + price / 3
    return s + price
  }, 0)

  return (
    <ERPLayout pageTitle={ar ? 'الاشتراكات' : 'Subscriptions'}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: ar ? 'إجمالي الاشتراكات' : 'Total Subscriptions', value: items.length, icon: '📋' },
          { label: ar ? 'نشطة' : 'Active', value: activeCount, icon: '✅' },
          { label: ar ? 'تجريبية' : 'Trial', value: items.filter(i => i.status === 'trial').length, icon: '🔬' },
          { label: ar ? 'الإيراد الشهري (MRR)' : 'MRR', value: fmt(mrr), icon: '💰' },
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

      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder={ar ? 'بحث في الاشتراكات...' : 'Search subscriptions...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{ar ? statusLabel[s]?.ar : statusLabel[s]?.en}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {ar ? 'اشتراك جديد' : 'New Subscription'}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>#</th>
                <th>{t('customer')}</th>
                <th>{ar ? 'الخطة' : 'Plan'}</th>
                <th>{ar ? 'السعر' : 'Price'}</th>
                <th>{ar ? 'دورة الفوترة' : 'Billing Cycle'}</th>
                <th>{ar ? 'تاريخ التجديد' : 'Renewal Date'}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="text-muted">{item.reference || `SUB-${item.id}`}</td>
                    <td className="fw-semibold">{item.customer_name || '—'}</td>
                    <td>{item.plan_name || '—'}</td>
                    <td>{fmt(item.price)} {item.currency || ''}</td>
                    <td>{item.billing_cycle ? (ar ? cycleLabel[item.billing_cycle]?.ar : cycleLabel[item.billing_cycle]?.en) || item.billing_cycle : '—'}</td>
                    <td className="text-muted">{fmtDate(item.renewal_date)}</td>
                    <td><span className={`badge ${statusBadge(item.status)}`}>{ar ? statusLabel[item.status]?.ar : statusLabel[item.status]?.en || item.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {item.status === 'active' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleCancel(item.id)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar ? 'اشتراك جديد' : 'New Subscription'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('customer')} *</label>
                    <input className="input" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الخطة' : 'Plan'}</label>
                    <select className="input" value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}>
                      <option value="">{ar ? '-- اختر خطة --' : '-- Select Plan --'}</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'دورة الفوترة' : 'Billing Cycle'}</label>
                    <select className="input" value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))}>
                      <option value="monthly">{ar ? 'شهري' : 'Monthly'}</option>
                      <option value="quarterly">{ar ? 'ربع سنوي' : 'Quarterly'}</option>
                      <option value="yearly">{ar ? 'سنوي' : 'Yearly'}</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'تاريخ البداية' : 'Start Date'}</label>
                    <input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
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
