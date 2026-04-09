'use client'

// ══════════════════════════════════════════════════════════
// app/super-admin/subscriptions/page.tsx — إدارة الاشتراكات
// API: GET    /api/super-admin/subscriptions
//      POST   /api/super-admin/subscriptions
//      PUT    /api/super-admin/subscriptions/{id}
//      POST   /api/super-admin/subscriptions/{id}/renew
//      POST   /api/super-admin/subscriptions/{id}/cancel
//      GET    /api/super-admin/subscriptions/stats
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import { api, extractArray } from '../../../lib/api'
import { StatCard, Modal, Badge, ToastContainer, ConfirmDialog } from '../../../components/ui'
import { useToast } from '../../../hooks/useToast'

type PlanType = 'starter' | 'professional' | 'enterprise'
type CycleType = 'monthly' | 'quarterly' | 'yearly'

type Sub = {
  id: number
  company?: { id: number; name: string }
  plan: PlanType
  billing_cycle: CycleType
  status: 'active' | 'expired' | 'cancelled' | 'suspended'
  amount: number
  starts_at: string
  ends_at: string
  auto_renew: boolean
  notes?: string
}

type Stats = {
  active: number
  expired: number
  cancelled: number
  expiring_soon: number
  monthly_revenue: number
  plans: { plan: string; count: number }[]
}

type Company = { id: number; name: string }

const PLAN_COLOR: Record<string, string> = {
  starter:      '#06b6d4',
  professional: '#7c3aed',
  enterprise:   '#f59e0b',
}
const STATUS_COLOR: Record<string, string> = {
  active:    '#16a34a',
  expired:   '#d97706',
  cancelled: '#dc2626',
  suspended: '#94a3b8',
}
const PLAN_PRICE: Record<PlanType, Record<string, number>> = {
  starter:      { monthly: 299,  quarterly: 799,  yearly: 2999  },
  professional: { monthly: 799,  quarterly: 2199, yearly: 7999  },
  enterprise:   { monthly: 1999, quarterly: 5499, yearly: 19999 },
}

export default function SubscriptionsPage() {
  const { toasts, show, remove } = useToast()
  const [subs,      setSubs]      = useState<Sub[]>([])
  const [stats,     setStats]     = useState<any>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [statusF,   setStatusF]   = useState('')
  const [planF,     setPlanF]     = useState('')
  const [modal,     setModal]     = useState(false)
  const [editSub,   setEditSub]   = useState<Sub | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [confirm,   setConfirm]   = useState<{ id: number; action: 'renew' | 'cancel' } | null>(null)

  const [form, setForm] = useState({
    company_id:    '',
    plan:          'professional' as PlanType,
    billing_cycle: 'monthly' as CycleType,
    starts_at:     new Date().toISOString().split('T')[0],
    auto_renew:    true,
    notes:         '',
  })

  const fetchAll = async () => {
    setLoading(true)
    const params = new URLSearchParams({ per_page: '100', ...(statusF && { status: statusF }), ...(planF && { plan: planF }), ...(search && { search }) })
    const [sRes, stRes, cRes] = await Promise.all([
      api.get<{ data: Sub[] }>(`/super-admin/subscriptions?${params}`),
      api.get<Stats>('/super-admin/subscriptions/stats'),
      api.get<{ data: Company[] }>('/super-admin/companies?per_page=500'),
    ])
    // دايمًا سيّب subs مصفوفة حتى لو فيه خطأ
    setSubs(Array.isArray(extractArray(sRes.data)) ? extractArray(sRes.data) : [])
    if (stRes.data && !stRes.error) setStats(stRes.data)
    if (cRes?.data)  setCompanies(prev => prev.length > 0 ? prev : extractArray(cRes.data))
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [search, statusF, planF])

  const openAdd = () => {
    setEditSub(null)
    setForm({ company_id: '', plan: 'professional' as PlanType, billing_cycle: 'monthly' as CycleType, starts_at: new Date().toISOString().split('T')[0], auto_renew: true, notes: '' })
    setModal(true)
  }

  const openEdit = (s: Sub) => {
    setEditSub(s)
    setForm({ company_id: String(s.company?.id || ''), plan: s.plan, billing_cycle: s.billing_cycle, starts_at: s.starts_at, auto_renew: s.auto_renew, notes: s.notes || '' })
    setModal(true)
  }

  const handleSave = async (e: FormEvent | React.MouseEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...form, company_id: Number(form.company_id), amount: PLAN_PRICE[form.plan][form.billing_cycle] }
    const res = editSub
      ? await api.put(`/super-admin/subscriptions/${editSub.id}`, body)
      : await api.post('/super-admin/subscriptions', body)
    setSaving(false)
    if (!res.error) { setModal(false); fetchAll() }
  }

  const doAction = async () => {
    if (!confirm) return
    setSaving(true)
    await api.post(`/super-admin/subscriptions/${confirm.id}/${confirm.action}`)
    setSaving(false)
    setConfirm(null)
    fetchAll()
  }

  const fmt = (n: number) => Number(n || 0).toLocaleString('ar-EG')
  const daysLeft = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
    return diff
  }

  const filtered = subs.filter(s => {
    const name = s.company?.name?.toLowerCase() || ''
    return (!search || name.includes(search.toLowerCase())) &&
           (!statusF || s.status === statusF) &&
           (!planF   || s.plan   === planF)
  })

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Cairo, sans-serif' }}>
      <ToastContainer toasts={toasts} remove={remove} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>إدارة الاشتراكات</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ اشتراك جديد</button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'نشط', value: stats.active, color: '#16a34a' },
            { label: 'منتهي', value: stats.expired, color: '#d97706' },
            { label: 'ملغي', value: stats.cancelled, color: '#dc2626' },
            { label: 'ينتهي قريباً', value: stats.expiring_soon, color: '#ea580c' },
            { label: 'إيراد شهري', value: `${fmt(stats.monthly_revenue)} ج`, color: '#7c3aed' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: s.color }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="بحث باسم الشركة..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
        <select className="form-select" value={statusF} onChange={e => setStatusF(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">كل الحالات</option>
          {['active', 'expired', 'cancelled', 'suspended'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-select" value={planF} onChange={e => setPlanF(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">كل الخطط</option>
          {['starter', 'professional', 'enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>الشركة</th>
                <th>الخطة</th>
                <th>الفوترة</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>تنتهي في</th>
                <th>تجديد تلقائي</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const days = daysLeft(s.ends_at)
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.company?.name || '—'}</td>
                    <td>
                      <span style={{ background: PLAN_COLOR[s.plan] + '22', color: PLAN_COLOR[s.plan], padding: '3px 12px', borderRadius: 999, fontWeight: 700, fontSize: '0.82rem' }}>
                        {s.plan}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{s.billing_cycle === 'monthly' ? 'شهري' : s.billing_cycle === 'quarterly' ? 'ربع سنوي' : 'سنوي'}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(s.amount)} ج</td>
                    <td>
                      <span style={{ background: STATUS_COLOR[s.status] + '22', color: STATUS_COLOR[s.status], padding: '3px 12px', borderRadius: 999, fontWeight: 700, fontSize: '0.82rem' }}>
                        {s.status === 'active' ? 'نشط' : s.status === 'expired' ? 'منتهي' : s.status === 'cancelled' ? 'ملغي' : 'موقوف'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: days <= 7 ? '#dc2626' : days <= 30 ? '#d97706' : '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>
                        {days < 0 ? 'منتهي' : `${days} يوم`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{s.auto_renew ? '✅' : '❌'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>تعديل</button>
                        {s.status === 'active' && (
                          <button className="btn btn-sm btn-danger" onClick={() => setConfirm({ id: s.id, action: 'cancel' })}>إلغاء</button>
                        )}
                        {(s.status === 'expired' || s.status === 'cancelled') && (
                          <button className="btn btn-sm btn-success" onClick={() => setConfirm({ id: s.id, action: 'renew' })}>تجديد</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>لا توجد اشتراكات</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Add/Edit */}
      <Modal open={modal} onClose={() => setModal(false)} title={editSub ? 'تعديل اشتراك' : 'اشتراك جديد'} size="md"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'جاري...' : 'حفظ'}</button></>}>
        <div className="form-grid">
          {!editSub && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">الشركة *</label>
              <select className="form-select" value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} required>
                <option value="">— اختر شركة —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">الخطة *</label>
            <select className="form-select" value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value as PlanType }))}>
              <option value="starter">Starter — {fmt(PLAN_PRICE.starter[form.billing_cycle])} ج</option>
              <option value="professional">Professional — {fmt(PLAN_PRICE.professional[form.billing_cycle])} ج</option>
              <option value="enterprise">Enterprise — {fmt(PLAN_PRICE.enterprise[form.billing_cycle])} ج</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">دورة الفوترة *</label>
            <select className="form-select" value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value as CycleType }))}>
              <option value="monthly">شهري</option>
              <option value="quarterly">ربع سنوي</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">تاريخ البداية *</label>
            <input className="form-input" type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} required />
          </div>
        </div>

        <div style={{ background: 'var(--color-primary-light)', borderRadius: 10, padding: '0.875rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>المبلغ المحسوب:</span>
          <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
            {fmt(PLAN_PRICE[form.plan]?.[form.billing_cycle] ?? 0)} ج
          </span>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={form.auto_renew} onChange={e => setForm(f => ({ ...f, auto_renew: e.target.checked }))} />
            تجديد تلقائي عند الانتهاء
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">ملاحظات</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
        </div>
      </Modal>

      {/* Confirm Action */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doAction}
        title={confirm?.action === 'cancel' ? 'تأكيد إلغاء الاشتراك' : 'تأكيد تجديد الاشتراك'}
        message={confirm?.action === 'cancel' ? 'سيتم إيقاف الشركة فوراً. هل أنت متأكد؟' : 'سيتم إنشاء اشتراك جديد من اليوم. هل تريد المتابعة؟'}
        danger={confirm?.action === 'cancel'}
      />
    </div>
  )
}