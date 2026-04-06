'use client'

// ══════════════════════════════════════════════════════════
// app/loyalty/page.tsx — Loyalty Points & Vouchers
// Missing Feature: كانت مش موجودة خالص
// API: GET  /api/loyalty/customers        → عملاء + نقاطهم
//      POST /api/loyalty/award            → منح نقاط
//      POST /api/loyalty/redeem           → استرداد نقاط
//      GET  /api/loyalty/vouchers         → قسائم الخصم
//      POST /api/loyalty/vouchers         → إنشاء قسيمة
//      PUT  /api/loyalty/vouchers/{id}    → تعديل
//      DELETE /api/loyalty/vouchers/{id}  → حذف
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../hooks/useToast'

type LoyaltyCustomer = {
  id: number
  name: string
  email?: string
  phone?: string
  loyalty_points: number
  total_spent: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

type Voucher = {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order?: number
  max_uses?: number
  uses_count: number
  expires_at?: string
  is_active: boolean
}

type AwardForm = { customer_id: string; points: string; reason: string }
type RedeemForm = { customer_id: string; points: string }
type VoucherForm = { code: string; type: string; value: string; min_order: string; max_uses: string; expires_at: string; is_active: boolean }

const TIER_CFG = {
  bronze:   { ar: 'برونز',   en: 'Bronze',   color: '#92400e', bg: '#fef3c7', min: 0 },
  silver:   { ar: 'فضة',     en: 'Silver',   color: '#64748b', bg: '#f1f5f9', min: 1000 },
  gold:     { ar: 'ذهب',     en: 'Gold',     color: '#b45309', bg: '#fef9c3', min: 5000 },
  platinum: { ar: 'بلاتين', en: 'Platinum', color: '#7c3aed', bg: '#ede9fe', min: 15000 },
}

function tierFromPoints(pts: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (pts >= 15000) return 'platinum'
  if (pts >= 5000)  return 'gold'
  if (pts >= 1000)  return 'silver'
  return 'bronze'
}

export default function LoyaltyPage() {
  const { lang } = useI18n()
  const { showToast } = useToast()
  const ar = lang === 'ar'

  const [tab, setTab] = useState<'customers' | 'vouchers'>('customers')

  // Customers / Points
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [awardModal,  setAwardModal]  = useState(false)
  const [redeemModal, setRedeemModal] = useState(false)
  const [selectedCust, setSelectedCust] = useState<LoyaltyCustomer | null>(null)
  const [awardForm,  setAwardForm]  = useState<AwardForm>({ customer_id: '', points: '', reason: '' })
  const [redeemForm, setRedeemForm] = useState<RedeemForm>({ customer_id: '', points: '' })
  const [saving, setSaving] = useState(false)

  // Vouchers
  const [vouchers,      setVouchers]      = useState<Voucher[]>([])
  const [voucherModal,  setVoucherModal]  = useState(false)
  const [editVoucher,   setEditVoucher]   = useState<Voucher | null>(null)
  const [voucherForm,   setVoucherForm]   = useState<VoucherForm>({
    code: '', type: 'percentage', value: '', min_order: '', max_uses: '', expires_at: '', is_active: true,
  })

  const fmt = (n: number) => Number(n || 0).toLocaleString(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 0 })

  // ── Fetch ──────────────────────────────────────────────
  const fetchCustomers = async () => {
    setLoading(true)
    const res = await api.get<LoyaltyCustomer[]>('/loyalty/customers')
    if (res.data) setCustomers(Array.isArray(res.data) ? res.data : [])
    setLoading(false)
  }

  const fetchVouchers = async () => {
    const res = await api.get<Voucher[]>('/loyalty/vouchers')
    if (res.data) setVouchers(Array.isArray(res.data) ? res.data : [])
  }

  useEffect(() => { fetchCustomers(); fetchVouchers() }, [])

  // ── Award Points ───────────────────────────────────────
  const openAward = (c: LoyaltyCustomer) => {
    setSelectedCust(c)
    setAwardForm({ customer_id: String(c.id), points: '', reason: '' })
    setAwardModal(true)
  }

  const handleAward = async (e: FormEvent) => {
    e.preventDefault()
    if (!awardForm.points || Number(awardForm.points) <= 0) return
    setSaving(true)
    const res = await api.post('/loyalty/award', {
      customer_id: Number(awardForm.customer_id),
      points:      Number(awardForm.points),
      reason:      awardForm.reason,
    })
    setSaving(false)
    if (!res.error) {
      showToast(ar ? 'تم منح النقاط ✓' : 'Points awarded ✓', 'success')
      setAwardModal(false)
      fetchCustomers()
    } else {
      showToast(res.error, 'error')
    }
  }

  // ── Redeem Points ──────────────────────────────────────
  const openRedeem = (c: LoyaltyCustomer) => {
    setSelectedCust(c)
    setRedeemForm({ customer_id: String(c.id), points: '' })
    setRedeemModal(true)
  }

  const handleRedeem = async (e: FormEvent) => {
    e.preventDefault()
    if (!redeemForm.points || Number(redeemForm.points) <= 0) return
    setSaving(true)
    const res = await api.post('/loyalty/redeem', {
      customer_id: Number(redeemForm.customer_id),
      points:      Number(redeemForm.points),
    })
    setSaving(false)
    if (!res.error) {
      showToast(ar ? 'تم استرداد النقاط ✓' : 'Points redeemed ✓', 'success')
      setRedeemModal(false)
      fetchCustomers()
    } else {
      showToast(res.error, 'error')
    }
  }

  // ── Vouchers CRUD ──────────────────────────────────────
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setVoucherForm(f => ({ ...f, code }))
  }

  const openAddVoucher = () => {
    setEditVoucher(null)
    setVoucherForm({ code: '', type: 'percentage', value: '', min_order: '', max_uses: '', expires_at: '', is_active: true })
    setVoucherModal(true)
  }

  const openEditVoucher = (v: Voucher) => {
    setEditVoucher(v)
    setVoucherForm({
      code:       v.code,
      type:       v.type,
      value:      String(v.value),
      min_order:  String(v.min_order ?? ''),
      max_uses:   String(v.max_uses ?? ''),
      expires_at: v.expires_at ? v.expires_at.slice(0, 10) : '',
      is_active:  v.is_active,
    })
    setVoucherModal(true)
  }

  const handleSaveVoucher = async (e: FormEvent) => {
    e.preventDefault()
    if (!voucherForm.code || !voucherForm.value) return
    setSaving(true)
    const body = {
      code:       voucherForm.code.toUpperCase(),
      type:       voucherForm.type,
      value:      Number(voucherForm.value),
      min_order:  voucherForm.min_order ? Number(voucherForm.min_order) : null,
      max_uses:   voucherForm.max_uses  ? Number(voucherForm.max_uses)  : null,
      expires_at: voucherForm.expires_at || null,
      is_active:  voucherForm.is_active,
    }
    const res = editVoucher
      ? await api.put(`/loyalty/vouchers/${editVoucher.id}`, body)
      : await api.post('/loyalty/vouchers', body)
    setSaving(false)
    if (!res.error) {
      showToast(ar ? 'تم الحفظ ✓' : 'Saved ✓', 'success')
      setVoucherModal(false)
      fetchVouchers()
    } else {
      showToast(res.error, 'error')
    }
  }

  const handleDeleteVoucher = async (id: number) => {
    if (!confirm(ar ? 'حذف هذه القسيمة؟' : 'Delete this voucher?')) return
    const res = await api.delete(`/loyalty/vouchers/${id}`)
    if (!res.error) { showToast(ar ? 'تم الحذف' : 'Deleted', 'success'); fetchVouchers() }
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ERPLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{ar ? '🎁 النقاط والقسائم' : '🎁 Loyalty & Vouchers'}</h1>
          {tab === 'vouchers' && (
            <button className="btn btn-primary" onClick={openAddVoucher}>
              + {ar ? 'قسيمة جديدة' : 'New Voucher'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
          {([['customers', ar ? '👤 نقاط العملاء' : '👤 Customer Points'],
             ['vouchers',  ar ? '🎟️ القسائم' : '🎟️ Vouchers']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600,
              color: tab === t ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>

        {/* ── Tab: Customers ── */}
        {tab === 'customers' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <input className="form-input" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={ar ? '🔍 ابحث عن عميل...' : '🔍 Search customer...'}
                style={{ maxWidth: 320 }}
              />
            </div>
            <div className="card">
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{ar ? 'العميل' : 'Customer'}</th>
                      <th>{ar ? 'المستوى' : 'Tier'}</th>
                      <th>{ar ? 'النقاط' : 'Points'}</th>
                      <th>{ar ? 'إجمالي المشتريات' : 'Total Spent'}</th>
                      <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const tier = tierFromPoints(c.loyalty_points)
                      const cfg  = TIER_CFG[tier]
                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                            {c.email && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.email}</div>}
                          </td>
                          <td>
                            <span style={{ padding: '2px 10px', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem',
                              background: cfg.bg, color: cfg.color }}>
                              {ar ? cfg.ar : cfg.en}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                              {fmt(c.loyalty_points)} {ar ? 'نقطة' : 'pts'}
                            </span>
                          </td>
                          <td>{fmt(c.total_spent)} {ar ? 'ج' : 'EGP'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-sm btn-primary" onClick={() => openAward(c)}>
                                {ar ? '+ منح نقاط' : '+ Award'}
                              </button>
                              <button className="btn btn-sm btn-secondary" onClick={() => openRedeem(c)}
                                disabled={c.loyalty_points <= 0}>
                                {ar ? '↩ استرداد' : '↩ Redeem'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        {ar ? 'لا يوجد عملاء' : 'No customers found'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── Tab: Vouchers ── */}
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
                    <td>
                      <span className={`badge ${v.type === 'percentage' ? 'badge-info' : 'badge-warning'}`}>
                        {v.type === 'percentage' ? (ar ? 'نسبة %' : 'Percentage') : (ar ? 'مبلغ ثابت' : 'Fixed')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                      {v.type === 'percentage' ? `${v.value}%` : `${v.value} ${ar ? 'ج' : 'EGP'}`}
                    </td>
                    <td>{v.min_order ? `${fmt(v.min_order)} ${ar ? 'ج' : 'EGP'}` : '—'}</td>
                    <td>{v.uses_count}{v.max_uses ? ` / ${v.max_uses}` : ''}</td>
                    <td>{v.expires_at ? new Date(v.expires_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                    <td>
                      <span className={`badge ${v.is_active ? 'badge-success' : 'badge-muted'}`}>
                        {v.is_active ? (ar ? 'فعّال' : 'Active') : (ar ? 'متوقف' : 'Inactive')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEditVoucher(v)}>{ar ? 'تعديل' : 'Edit'}</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteVoucher(v.id)}>{ar ? 'حذف' : 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {ar ? 'لا توجد قسائم' : 'No vouchers yet'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Modal: Award Points ── */}
        {awardModal && selectedCust && (
          <div className="modal-overlay" onClick={() => setAwardModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header">
                <h2>{ar ? 'منح نقاط' : 'Award Points'} — {selectedCust.name}</h2>
                <button className="modal-close" onClick={() => setAwardModal(false)}>×</button>
              </div>
              <form onSubmit={handleAward}>
                <div className="modal-body">
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {fmt(selectedCust.loyalty_points)} {ar ? 'نقطة حالياً' : 'current points'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'عدد النقاط *' : 'Points to Award *'}</label>
                    <input className="form-input" type="number" min={1} value={awardForm.points}
                      onChange={e => setAwardForm(f => ({ ...f, points: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'السبب' : 'Reason'}</label>
                    <input className="form-input" value={awardForm.reason}
                      onChange={e => setAwardForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder={ar ? 'مثال: مكافأة شراء، يوم ميلاد...' : 'e.g. Purchase reward, birthday...'} />
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

        {/* ── Modal: Redeem Points ── */}
        {redeemModal && selectedCust && (
          <div className="modal-overlay" onClick={() => setRedeemModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header">
                <h2>{ar ? 'استرداد نقاط' : 'Redeem Points'} — {selectedCust.name}</h2>
                <button className="modal-close" onClick={() => setRedeemModal(false)}>×</button>
              </div>
              <form onSubmit={handleRedeem}>
                <div className="modal-body">
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                      {fmt(selectedCust.loyalty_points)} {ar ? 'نقطة متاحة' : 'points available'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'نقاط للاسترداد *' : 'Points to Redeem *'}</label>
                    <input className="form-input" type="number" min={1} max={selectedCust.loyalty_points}
                      value={redeemForm.points}
                      onChange={e => setRedeemForm(f => ({ ...f, points: e.target.value }))} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setRedeemModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? '↩ استرداد' : '↩ Redeem'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Voucher ── */}
        {voucherModal && (
          <div className="modal-overlay" onClick={() => setVoucherModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h2>{editVoucher ? (ar ? 'تعديل قسيمة' : 'Edit Voucher') : (ar ? 'قسيمة جديدة' : 'New Voucher')}</h2>
                <button className="modal-close" onClick={() => setVoucherModal(false)}>×</button>
              </div>
              <form onSubmit={handleSaveVoucher}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">{ar ? 'كود القسيمة *' : 'Voucher Code *'}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="form-input" value={voucherForm.code}
                        onChange={e => setVoucherForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        style={{ fontFamily: 'monospace', letterSpacing: 2 }} required />
                      <button type="button" className="btn btn-secondary" onClick={generateCode}>
                        {ar ? 'توليد' : 'Generate'}
                      </button>
                    </div>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'نوع الخصم *' : 'Discount Type *'}</label>
                      <select className="form-select" value={voucherForm.type}
                        onChange={e => setVoucherForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="percentage">{ar ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                        <option value="fixed">{ar ? 'مبلغ ثابت' : 'Fixed Amount'}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        {ar ? 'القيمة *' : 'Value *'}
                        {voucherForm.type === 'percentage' ? ' (%)' : ` (${ar ? 'ج' : 'EGP'})`}
                      </label>
                      <input className="form-input" type="number" min={0.01} step={0.01} value={voucherForm.value}
                        onChange={e => setVoucherForm(f => ({ ...f, value: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الحد الأدنى للطلب' : 'Min Order'}</label>
                      <input className="form-input" type="number" min={0} value={voucherForm.min_order}
                        onChange={e => setVoucherForm(f => ({ ...f, min_order: e.target.value }))}
                        placeholder={ar ? 'اختياري' : 'Optional'} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الحد الأقصى للاستخدام' : 'Max Uses'}</label>
                      <input className="form-input" type="number" min={1} value={voucherForm.max_uses}
                        onChange={e => setVoucherForm(f => ({ ...f, max_uses: e.target.value }))}
                        placeholder={ar ? 'اختياري (بلا حد)' : 'Optional (unlimited)'} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</label>
                    <input className="form-input" type="date" value={voucherForm.expires_at}
                      onChange={e => setVoucherForm(f => ({ ...f, expires_at: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={voucherForm.is_active}
                        onChange={e => setVoucherForm(f => ({ ...f, is_active: e.target.checked }))} />
                      {ar ? 'القسيمة فعّالة' : 'Voucher is active'}
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setVoucherModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}
