'use client'

// ══════════════════════════════════════════════════════════
// app/loyalty/page.tsx — Loyalty Points & Vouchers (Enhanced)
// NEW: Point Expiration, Tiers, Referral System, Triggers, POS/CRM Link
// API: GET  /api/loyalty/customers
//      POST /api/loyalty/award
//      POST /api/loyalty/redeem
//      GET/POST/PUT/DELETE /api/loyalty/vouchers
//      GET/POST/PUT/DELETE /api/loyalty/triggers
//      GET  /api/loyalty/referrals
//      POST /api/loyalty/referrals
//      GET  /api/loyalty/stats
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../hooks/useToast'

type LoyaltyCustomer = {
  id: number; name: string; email?: string; phone?: string
  loyalty_points: number; expiring_points?: number; expiry_date?: string
  total_spent: number; tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  referral_code?: string; referred_by?: string; crm_lead_id?: number
}
type Voucher = {
  id: number; code: string; type: 'percentage' | 'fixed'; value: number
  min_order?: number; max_uses?: number; uses_count: number; expires_at?: string; is_active: boolean
}
type Trigger = {
  id: number; name: string; name_ar: string; event: string
  points_awarded: number; is_active: boolean; conditions?: string
}
type Referral = {
  id: number; referrer_name: string; referee_name: string
  referrer_points: number; referee_points: number; status: 'pending' | 'completed'; created_at: string
}
type LoyaltyStats = { total_customers: number; points_issued: number; points_redeemed: number; active_vouchers: number; referrals_count: number }

const TIER_CFG = {
  bronze:   { ar: 'برونز',   en: 'Bronze',   color: '#92400e', bg: '#fef3c7', icon: '🥉', min: 0,     max: 999 },
  silver:   { ar: 'فضة',     en: 'Silver',   color: '#64748b', bg: '#f1f5f9', icon: '🥈', min: 1000,  max: 4999 },
  gold:     { ar: 'ذهب',     en: 'Gold',     color: '#b45309', bg: '#fef9c3', icon: '🥇', min: 5000,  max: 14999 },
  platinum: { ar: 'بلاتين', en: 'Platinum', color: '#7c3aed', bg: '#ede9fe', icon: '💎', min: 15000, max: Infinity },
}

const TRIGGER_EVENTS = [
  { key: 'purchase',        ar: 'عند الشراء',             en: 'On Purchase' },
  { key: 'birthday',        ar: 'يوم الميلاد',            en: 'Birthday' },
  { key: 'registration',    ar: 'عند التسجيل',            en: 'Registration' },
  { key: 'referral',        ar: 'عند الإحالة الناجحة',    en: 'Successful Referral' },
  { key: 'review',          ar: 'عند كتابة مراجعة',       en: 'Write a Review' },
  { key: 'first_purchase',  ar: 'أول عملية شراء',         en: 'First Purchase' },
  { key: 'anniversary',     ar: 'ذكرى تسجيل',             en: 'Registration Anniversary' },
]

function tierFromPoints(pts: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (pts >= 15000) return 'platinum'
  if (pts >= 5000)  return 'gold'
  if (pts >= 1000)  return 'silver'
  return 'bronze'
}

export default function LoyaltyPage() {
  const { lang } = useI18n()
  const { show: toast } = useToast?.() ?? { show: () => {} }
  const ar = lang === 'ar'

  const [tab, setTab] = useState<'customers' | 'vouchers' | 'triggers' | 'referrals'>('customers')

  const [customers,  setCustomers]  = useState<LoyaltyCustomer[]>([])
  const [vouchers,   setVouchers]   = useState<Voucher[]>([])
  const [triggers,   setTriggers]   = useState<Trigger[]>([])
  const [referrals,  setReferrals]  = useState<Referral[]>([])
  const [stats,      setStats]      = useState<LoyaltyStats | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [saving,     setSaving]     = useState(false)

  const [awardModal,    setAwardModal]    = useState(false)
  const [redeemModal,   setRedeemModal]   = useState(false)
  const [voucherModal,  setVoucherModal]  = useState(false)
  const [triggerModal,  setTriggerModal]  = useState(false)
  const [referralModal, setReferralModal] = useState(false)

  const [selectedCust,  setSelectedCust]  = useState<LoyaltyCustomer | null>(null)
  const [editVoucher,   setEditVoucher]   = useState<Voucher | null>(null)
  const [editTrigger,   setEditTrigger]   = useState<Trigger | null>(null)

  const [awardForm,  setAwardForm]  = useState({ customer_id: '', points: '', reason: '', expires_in_days: '' })
  const [redeemForm, setRedeemForm] = useState({ customer_id: '', points: '' })
  const [voucherForm, setVoucherForm] = useState({ code: '', type: 'percentage', value: '', min_order: '', max_uses: '', expires_at: '', is_active: true })
  const [triggerForm, setTriggerForm] = useState({ name: '', name_ar: '', event: 'purchase', points_awarded: '', is_active: true, conditions: '' })
  const [referralForm, setReferralForm] = useState({ referrer_customer_id: '', referee_email: '' })

  const fmt = (n: number) => Number(n || 0).toLocaleString(ar ? 'ar-EG' : 'en-US')

  const fetchAll = async () => {
    setLoading(true)
    const [cRes, vRes, tRes, rRes, sRes] = await Promise.all([
      api.get<LoyaltyCustomer[]>('/loyalty/customers'),
      api.get<Voucher[]>('/loyalty/vouchers'),
      api.get<Trigger[]>('/loyalty/triggers'),
      api.get<Referral[]>('/loyalty/referrals'),
      api.get<LoyaltyStats>('/loyalty/stats'),
    ])
    if (cRes.data) setCustomers(Array.isArray(cRes.data) ? cRes.data : [])
    if (vRes.data) setVouchers(Array.isArray(vRes.data) ? vRes.data : [])
    if (tRes.data) setTriggers(Array.isArray(tRes.data) ? tRes.data : [])
    if (rRes.data) setReferrals(Array.isArray(rRes.data) ? rRes.data : [])
    if (sRes.data) setStats(sRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleAward = async (e: FormEvent) => {
    e.preventDefault(); if (!awardForm.points) return; setSaving(true)
    const res = await api.post('/loyalty/award', {
      customer_id: Number(awardForm.customer_id), points: Number(awardForm.points),
      reason: awardForm.reason, expires_in_days: awardForm.expires_in_days ? Number(awardForm.expires_in_days) : null,
    })
    setSaving(false)
    if (!res.error) { toast?.(ar ? 'تم منح النقاط ✓' : 'Points awarded ✓', 'success'); setAwardModal(false); fetchAll() }
  }

  const handleRedeem = async (e: FormEvent) => {
    e.preventDefault(); if (!redeemForm.points) return; setSaving(true)
    const res = await api.post('/loyalty/redeem', { customer_id: Number(redeemForm.customer_id), points: Number(redeemForm.points) })
    setSaving(false)
    if (!res.error) { toast?.(ar ? 'تم الاسترداد ✓' : 'Points redeemed ✓', 'success'); setRedeemModal(false); fetchAll() }
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    setVoucherForm(f => ({ ...f, code: Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') }))
  }

  const handleSaveVoucher = async (e: FormEvent) => {
    e.preventDefault(); if (!voucherForm.code || !voucherForm.value) return; setSaving(true)
    const body = { code: voucherForm.code.toUpperCase(), type: voucherForm.type, value: Number(voucherForm.value), min_order: voucherForm.min_order ? Number(voucherForm.min_order) : null, max_uses: voucherForm.max_uses ? Number(voucherForm.max_uses) : null, expires_at: voucherForm.expires_at || null, is_active: voucherForm.is_active }
    const res = editVoucher ? await api.put(`/loyalty/vouchers/${editVoucher.id}`, body) : await api.post('/loyalty/vouchers', body)
    setSaving(false)
    if (!res.error) { setVoucherModal(false); fetchAll() }
  }

  const handleSaveTrigger = async (e: FormEvent) => {
    e.preventDefault(); if (!triggerForm.name || !triggerForm.points_awarded) return; setSaving(true)
    const body = { ...triggerForm, points_awarded: Number(triggerForm.points_awarded) }
    const res = editTrigger ? await api.put(`/loyalty/triggers/${editTrigger.id}`, body) : await api.post('/loyalty/triggers', body)
    setSaving(false)
    if (!res.error) { setTriggerModal(false); fetchAll() }
  }

  const handleReferral = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await api.post('/loyalty/referrals', { referrer_customer_id: Number(referralForm.referrer_customer_id), referee_email: referralForm.referee_email })
    setSaving(false)
    if (!res.error) { setReferralModal(false); fetchAll() }
  }

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.email ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <ERPLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🎁 {ar ? 'النقاط والقسائم' : 'Loyalty & Vouchers'}</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {tab === 'vouchers'  && <button className="btn btn-primary" onClick={() => { setEditVoucher(null); setVoucherForm({ code: '', type: 'percentage', value: '', min_order: '', max_uses: '', expires_at: '', is_active: true }); setVoucherModal(true) }}>+ {ar ? 'قسيمة جديدة' : 'New Voucher'}</button>}
            {tab === 'triggers'  && <button className="btn btn-primary" onClick={() => { setEditTrigger(null); setTriggerForm({ name: '', name_ar: '', event: 'purchase', points_awarded: '', is_active: true, conditions: '' }); setTriggerModal(true) }}>+ {ar ? 'محفز جديد' : 'New Trigger'}</button>}
            {tab === 'referrals' && <button className="btn btn-primary" onClick={() => setReferralModal(true)}>+ {ar ? 'إحالة جديدة' : 'New Referral'}</button>}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: ar ? 'العملاء' : 'Customers',          value: stats.total_customers, color: '#2563eb' },
              { label: ar ? 'نقاط ممنوحة' : 'Points Issued',  value: fmt(stats.points_issued), color: '#16a34a' },
              { label: ar ? 'نقاط مُستردة' : 'Redeemed',      value: fmt(stats.points_redeemed), color: '#d97706' },
              { label: ar ? 'قسائم نشطة' : 'Active Vouchers', value: stats.active_vouchers, color: '#7c3aed' },
              { label: ar ? 'الإحالات' : 'Referrals',          value: stats.referrals_count, color: '#dc2626' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tier legend */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {Object.entries(TIER_CFG).map(([key, cfg]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: cfg.bg, borderRadius: 999, border: `1px solid ${cfg.color}30` }}>
              <span>{cfg.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: cfg.color }}>{ar ? cfg.ar : cfg.en}</span>
              <span style={{ fontSize: '0.72rem', color: cfg.color }}>
                {cfg.max === Infinity ? `${fmt(cfg.min)}+` : `${fmt(cfg.min)}–${fmt(cfg.max)}`} {ar ? 'نقطة' : 'pts'}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
          {([
            ['customers', ar ? '👤 نقاط العملاء' : '👤 Customer Points'],
            ['vouchers',  ar ? '🎟️ القسائم' : '🎟️ Vouchers'],
            ['triggers',  ar ? '⚡ المحفزات' : '⚡ Triggers'],
            ['referrals', ar ? '🔗 الإحالات' : '🔗 Referrals'],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.75rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600,
              color: tab === t ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>

        {/* ══ Tab: Customers ══ */}
        {tab === 'customers' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? '🔍 ابحث عن عميل...' : '🔍 Search customer...'} style={{ maxWidth: 320 }} />
            </div>
            <div className="card">
              {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div> : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{ar ? 'العميل' : 'Customer'}</th>
                      <th>{ar ? 'المستوى' : 'Tier'}</th>
                      <th>{ar ? 'النقاط' : 'Points'}</th>
                      <th>{ar ? 'نقاط تنتهي' : 'Expiring'}</th>
                      <th>{ar ? 'كود الإحالة' : 'Referral Code'}</th>
                      <th>{ar ? 'CRM' : 'CRM'}</th>
                      <th>{ar ? 'إجمالي المشتريات' : 'Total Spent'}</th>
                      <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const tier = tierFromPoints(c.loyalty_points)
                      const cfg  = TIER_CFG[tier]
                      const next = Object.values(TIER_CFG).find(t => t.min > c.loyalty_points)
                      const pct  = next ? Math.min(100, Math.round(((c.loyalty_points - cfg.min) / (next.min - cfg.min)) * 100)) : 100
                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                            {c.email && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.email}</div>}
                          </td>
                          <td>
                            <div>
                              <span style={{ padding: '2px 10px', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem', background: cfg.bg, color: cfg.color }}>
                                {cfg.icon} {ar ? cfg.ar : cfg.en}
                              </span>
                              {next && (
                                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <div style={{ width: 60, height: 4, background: 'var(--bg-page)', borderRadius: 999 }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 999 }} />
                                  </div>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{pct}%</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)' }}>{fmt(c.loyalty_points)} {ar ? 'نقطة' : 'pts'}</span>
                          </td>
                          <td>
                            {c.expiring_points ? (
                              <div>
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{fmt(c.expiring_points)} {ar ? 'نقطة' : 'pts'}</span>
                                {c.expiry_date && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(c.expiry_date).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</div>}
                              </div>
                            ) : <span className="text-muted">—</span>}
                          </td>
                          <td>
                            {c.referral_code
                              ? <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1, fontSize: '0.85rem' }}>{c.referral_code}</span>
                              : <span className="text-muted">—</span>}
                          </td>
                          <td>
                            {c.crm_lead_id
                              ? <a href={`/crm?lead=${c.crm_lead_id}`} style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>#{c.crm_lead_id}</a>
                              : <span className="text-muted">—</span>}
                          </td>
                          <td>{fmt(c.total_spent)} {ar ? 'ج' : 'EGP'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-sm btn-primary" onClick={() => { setSelectedCust(c); setAwardForm({ customer_id: String(c.id), points: '', reason: '', expires_in_days: '' }); setAwardModal(true) }}>+ {ar ? 'منح' : 'Award'}</button>
                              <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedCust(c); setRedeemForm({ customer_id: String(c.id), points: '' }); setRedeemModal(true) }} disabled={c.loyalty_points <= 0}>↩ {ar ? 'استرداد' : 'Redeem'}</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا يوجد عملاء' : 'No customers'}</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ══ Tab: Vouchers ══ */}
        {tab === 'vouchers' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'الكود' : 'Code'}</th>
                  <th>{ar ? 'النوع' : 'Type'}</th>
                  <th>{ar ? 'القيمة' : 'Value'}</th>
                  <th>{ar ? 'الحد الأدنى' : 'Min Order'}</th>
                  <th>{ar ? 'الاستخدام' : 'Usage'}</th>
                  <th>{ar ? 'انتهاء الصلاحية' : 'Expires'}</th>
                  <th>{ar ? 'الحالة' : 'Status'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map(v => (
                  <tr key={v.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>{v.code}</span></td>
                    <td><span className={`badge ${v.type === 'percentage' ? 'badge-info' : 'badge-warning'}`}>{v.type === 'percentage' ? (ar ? 'نسبة %' : 'Percentage') : (ar ? 'مبلغ ثابت' : 'Fixed')}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{v.type === 'percentage' ? `${v.value}%` : `${v.value} ${ar ? 'ج' : 'EGP'}`}</td>
                    <td>{v.min_order ? `${fmt(v.min_order)} ${ar ? 'ج' : 'EGP'}` : '—'}</td>
                    <td>{v.uses_count}{v.max_uses ? ` / ${v.max_uses}` : ''}</td>
                    <td>{v.expires_at ? new Date(v.expires_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                    <td><span className={`badge ${v.is_active ? 'badge-success' : 'badge-muted'}`}>{v.is_active ? (ar ? 'فعّال' : 'Active') : (ar ? 'متوقف' : 'Inactive')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setEditVoucher(v); setVoucherForm({ code: v.code, type: v.type, value: String(v.value), min_order: String(v.min_order ?? ''), max_uses: String(v.max_uses ?? ''), expires_at: v.expires_at ? v.expires_at.slice(0, 10) : '', is_active: v.is_active }); setVoucherModal(true) }}>{ar ? 'تعديل' : 'Edit'}</button>
                        <button className="btn btn-sm btn-danger" onClick={async () => { if (confirm(ar ? 'حذف؟' : 'Delete?')) { await api.delete(`/loyalty/vouchers/${v.id}`); fetchAll() } }}>{ar ? 'حذف' : 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد قسائم' : 'No vouchers'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ Tab: Triggers ══ */}
        {tab === 'triggers' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'اسم المحفز' : 'Trigger Name'}</th>
                  <th>{ar ? 'الحدث' : 'Event'}</th>
                  <th>{ar ? 'النقاط الممنوحة' : 'Points Awarded'}</th>
                  <th>{ar ? 'الشروط' : 'Conditions'}</th>
                  <th>{ar ? 'الحالة' : 'Status'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {triggers.map(t => {
                  const evt = TRIGGER_EVENTS.find(e => e.key === t.event)
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{ar ? t.name_ar : t.name}</td>
                      <td><span className="badge badge-info">{ar ? evt?.ar : evt?.en || t.event}</span></td>
                      <td><span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.05rem' }}>+{t.points_awarded} {ar ? 'نقطة' : 'pts'}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.conditions || '—'}</td>
                      <td>
                        <span className={`badge ${t.is_active ? 'badge-success' : 'badge-muted'}`}>{t.is_active ? (ar ? 'فعّال' : 'Active') : (ar ? 'متوقف' : 'Inactive')}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => { setEditTrigger(t); setTriggerForm({ name: t.name, name_ar: t.name_ar, event: t.event, points_awarded: String(t.points_awarded), is_active: t.is_active, conditions: t.conditions || '' }); setTriggerModal(true) }}>{ar ? 'تعديل' : 'Edit'}</button>
                          <button className="btn btn-sm btn-danger" onClick={async () => { if (confirm(ar ? 'حذف؟' : 'Delete?')) { await api.delete(`/loyalty/triggers/${t.id}`); fetchAll() } }}>{ar ? 'حذف' : 'Delete'}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {triggers.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد محفزات' : 'No triggers defined'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ Tab: Referrals ══ */}
        {tab === 'referrals' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'المُحيل' : 'Referrer'}</th>
                  <th>{ar ? 'المُحال' : 'Referee'}</th>
                  <th>{ar ? 'نقاط المُحيل' : 'Referrer Pts'}</th>
                  <th>{ar ? 'نقاط المُحال' : 'Referee Pts'}</th>
                  <th>{ar ? 'الحالة' : 'Status'}</th>
                  <th>{ar ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.referrer_name}</td>
                    <td>{r.referee_name}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>+{fmt(r.referrer_points)}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>+{fmt(r.referee_points)}</td>
                    <td><span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{r.status === 'completed' ? (ar ? 'مكتمل' : 'Completed') : (ar ? 'معلق' : 'Pending')}</span></td>
                    <td>{new Date(r.created_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</td>
                  </tr>
                ))}
                {referrals.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد إحالات' : 'No referrals'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ Modal: Award ══ */}
        {awardModal && selectedCust && (
          <div className="modal-overlay" onClick={() => setAwardModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header"><h2>{ar ? 'منح نقاط' : 'Award Points'} — {selectedCust.name}</h2><button className="modal-close" onClick={() => setAwardModal(false)}>×</button></div>
              <form onSubmit={handleAward}>
                <div className="modal-body">
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(selectedCust.loyalty_points)} {ar ? 'نقطة حالياً' : 'current points'}</div>
                  </div>
                  <div className="form-group"><label className="form-label">{ar ? 'عدد النقاط *' : 'Points *'}</label><input className="form-input" type="number" min={1} value={awardForm.points} onChange={e => setAwardForm(f => ({ ...f, points: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">{ar ? 'السبب' : 'Reason'}</label><input className="form-input" value={awardForm.reason} onChange={e => setAwardForm(f => ({ ...f, reason: e.target.value }))} /></div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'تنتهي بعد (أيام)' : 'Expires in (days)'}</label>
                    <input className="form-input" type="number" min={1} value={awardForm.expires_in_days} onChange={e => setAwardForm(f => ({ ...f, expires_in_days: e.target.value }))} placeholder={ar ? 'اختياري' : 'Optional'} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{ar ? 'اتركه فارغاً إذا لا تنتهي النقاط' : 'Leave empty for non-expiring points'}</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setAwardModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? '✓ منح النقاط' : '✓ Award Points'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: Redeem ══ */}
        {redeemModal && selectedCust && (
          <div className="modal-overlay" onClick={() => setRedeemModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header"><h2>{ar ? 'استرداد نقاط' : 'Redeem Points'} — {selectedCust.name}</h2><button className="modal-close" onClick={() => setRedeemModal(false)}>×</button></div>
              <form onSubmit={handleRedeem}>
                <div className="modal-body">
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>{fmt(selectedCust.loyalty_points)} {ar ? 'نقطة متاحة' : 'points available'}</div>
                  </div>
                  <div className="form-group"><label className="form-label">{ar ? 'نقاط للاسترداد *' : 'Points to Redeem *'}</label><input className="form-input" type="number" min={1} max={selectedCust.loyalty_points} value={redeemForm.points} onChange={e => setRedeemForm(f => ({ ...f, points: e.target.value }))} required /></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setRedeemModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? '↩ استرداد' : '↩ Redeem'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: Voucher ══ */}
        {voucherModal && (
          <div className="modal-overlay" onClick={() => setVoucherModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="modal-header"><h2>{editVoucher ? (ar ? 'تعديل قسيمة' : 'Edit Voucher') : (ar ? 'قسيمة جديدة' : 'New Voucher')}</h2><button className="modal-close" onClick={() => setVoucherModal(false)}>×</button></div>
              <form onSubmit={handleSaveVoucher}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">{ar ? 'كود القسيمة *' : 'Voucher Code *'}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="form-input" value={voucherForm.code} onChange={e => setVoucherForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} style={{ fontFamily: 'monospace', letterSpacing: 2 }} required />
                      <button type="button" className="btn btn-secondary" onClick={generateCode}>{ar ? 'توليد' : 'Generate'}</button>
                    </div>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group"><label className="form-label">{ar ? 'نوع الخصم *' : 'Discount Type *'}</label>
                      <select className="form-select" value={voucherForm.type} onChange={e => setVoucherForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="percentage">{ar ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                        <option value="fixed">{ar ? 'مبلغ ثابت' : 'Fixed Amount'}</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">{ar ? 'القيمة *' : 'Value *'}</label><input className="form-input" type="number" min={0.01} step={0.01} value={voucherForm.value} onChange={e => setVoucherForm(f => ({ ...f, value: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">{ar ? 'الحد الأدنى للطلب' : 'Min Order'}</label><input className="form-input" type="number" min={0} value={voucherForm.min_order} onChange={e => setVoucherForm(f => ({ ...f, min_order: e.target.value }))} placeholder={ar ? 'اختياري' : 'Optional'} /></div>
                    <div className="form-group"><label className="form-label">{ar ? 'الحد الأقصى للاستخدام' : 'Max Uses'}</label><input className="form-input" type="number" min={1} value={voucherForm.max_uses} onChange={e => setVoucherForm(f => ({ ...f, max_uses: e.target.value }))} placeholder={ar ? 'اختياري' : 'Optional'} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">{ar ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</label><input className="form-input" type="date" value={voucherForm.expires_at} onChange={e => setVoucherForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={voucherForm.is_active} onChange={e => setVoucherForm(f => ({ ...f, is_active: e.target.checked }))} />
                    {ar ? 'القسيمة فعّالة' : 'Voucher is active'}
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setVoucherModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: Trigger ══ */}
        {triggerModal && (
          <div className="modal-overlay" onClick={() => setTriggerModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header"><h2>⚡ {editTrigger ? (ar ? 'تعديل محفز' : 'Edit Trigger') : (ar ? 'محفز جديد' : 'New Trigger')}</h2><button className="modal-close" onClick={() => setTriggerModal(false)}>×</button></div>
              <form onSubmit={handleSaveTrigger}>
                <div className="modal-body">
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group"><label className="form-label">{ar ? 'الاسم بالعربية *' : 'Arabic Name *'}</label><input className="form-input" value={triggerForm.name_ar} onChange={e => setTriggerForm(f => ({ ...f, name_ar: e.target.value }))} required={ar} /></div>
                    <div className="form-group"><label className="form-label">{ar ? 'الاسم بالإنجليزية *' : 'English Name *'}</label><input className="form-input" value={triggerForm.name} onChange={e => setTriggerForm(f => ({ ...f, name: e.target.value }))} required /></div>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الحدث المُشغِّل *' : 'Trigger Event *'}</label>
                      <select className="form-select" value={triggerForm.event} onChange={e => setTriggerForm(f => ({ ...f, event: e.target.value }))}>
                        {TRIGGER_EVENTS.map(ev => <option key={ev.key} value={ev.key}>{ar ? ev.ar : ev.en}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">{ar ? 'النقاط الممنوحة *' : 'Points to Award *'}</label><input className="form-input" type="number" min={1} value={triggerForm.points_awarded} onChange={e => setTriggerForm(f => ({ ...f, points_awarded: e.target.value }))} required /></div>
                  </div>
                  <div className="form-group"><label className="form-label">{ar ? 'شروط إضافية (اختياري)' : 'Additional Conditions (optional)'}</label><textarea className="form-textarea" rows={2} value={triggerForm.conditions} onChange={e => setTriggerForm(f => ({ ...f, conditions: e.target.value }))} placeholder={ar ? 'مثال: min_purchase=500' : 'e.g. min_purchase=500'} /></div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={triggerForm.is_active} onChange={e => setTriggerForm(f => ({ ...f, is_active: e.target.checked }))} />
                    {ar ? 'المحفز فعّال' : 'Trigger is active'}
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setTriggerModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: Referral ══ */}
        {referralModal && (
          <div className="modal-overlay" onClick={() => setReferralModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header"><h2>🔗 {ar ? 'إحالة جديدة' : 'New Referral'}</h2><button className="modal-close" onClick={() => setReferralModal(false)}>×</button></div>
              <form onSubmit={handleReferral}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">{ar ? 'العميل المُحيل *' : 'Referrer Customer *'}</label>
                    <select className="form-select" value={referralForm.referrer_customer_id} onChange={e => setReferralForm(f => ({ ...f, referrer_customer_id: e.target.value }))} required>
                      <option value="">{ar ? 'اختر' : 'Select'}</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'بريد العميل الجديد *' : 'New Customer Email *'}</label>
                    <input className="form-input" type="email" value={referralForm.referee_email} onChange={e => setReferralForm(f => ({ ...f, referee_email: e.target.value }))} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setReferralModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'إرسال الإحالة' : 'Send Referral'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}