'use client'

// ══════════════════════════════════════════════════════════
// app/fixed-assets/page.tsx — الأصول الثابتة
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET    /api/fixed-assets          → قائمة الأصول
//   POST   /api/fixed-assets          → إضافة أصل
//   PUT    /api/fixed-assets/{id}     → تعديل أصل
//   DELETE /api/fixed-assets/{id}     → حذف أصل
//   GET    /api/fixed-assets/{id}/depreciation → حساب الاستهلاك
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type FixedAsset = {
  id: number
  name: string
  purchase_date: string
  purchase_cost: number
  useful_life_years: number
  salvage_value: number | null
  depreciation_method: string | null
  status: string
  book_value?: number
  created_at: string
}

type DepreciationInfo = {
  annual_depreciation: number
  monthly: number
  asset: FixedAsset
}

const STATUSES = ['active', 'disposed', 'under_maintenance']
const DEP_METHODS = ['straight_line', 'declining_balance']

const EMPTY_FORM = {
  name: '',
  purchase_date: '',
  purchase_cost: '',
  useful_life_years: '',
  salvage_value: '',
  depreciation_method: 'straight_line',
  status: 'active',
}

export default function FixedAssetsPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [assets,     setAssets]     = useState<FixedAsset[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)

  const [modal,      setModal]      = useState(false)
  const [editAsset,  setEditAsset]  = useState<FixedAsset | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formErr,    setFormErr]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [deleteId,   setDeleteId]   = useState<number | null>(null)

  const [depModal,   setDepModal]   = useState(false)
  const [depInfo,    setDepInfo]    = useState<DepreciationInfo | null>(null)
  const [depLoading, setDepLoading] = useState(false)

  const fetchAssets = async () => {
    setLoading(true)
    const res = await api.get<{ data: FixedAsset[]; total: number }>(`/fixed-assets?page=${page}&per_page=15`)
    if (res.data) { setAssets(res.data.data || []); setTotal(res.data.total || 0) }
    setLoading(false)
  }

  useEffect(() => { fetchAssets() }, [page])

  const openAdd = () => {
    setEditAsset(null)
    setForm({ ...EMPTY_FORM, purchase_date: new Date().toISOString().split('T')[0] })
    setFormErr('')
    setModal(true)
  }

  const openEdit = (asset: FixedAsset) => {
    setEditAsset(asset)
    setForm({
      name: asset.name,
      purchase_date: asset.purchase_date,
      purchase_cost: String(asset.purchase_cost),
      useful_life_years: String(asset.useful_life_years),
      salvage_value: asset.salvage_value != null ? String(asset.salvage_value) : '',
      depreciation_method: asset.depreciation_method || 'straight_line',
      status: asset.status,
    })
    setFormErr('')
    setModal(true)
  }

  const openDepreciation = async (asset: FixedAsset) => {
    setDepLoading(true)
    setDepModal(true)
    const res = await api.get<DepreciationInfo>(`/fixed-assets/${asset.id}/depreciation`)
    if (res.data) setDepInfo(res.data)
    setDepLoading(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.name.trim())           { setFormErr(ar('الاسم مطلوب',          'Name is required'));           return }
    if (!form.purchase_date)         { setFormErr(ar('تاريخ الشراء مطلوب',  'Purchase date is required'));   return }
    if (!form.purchase_cost)         { setFormErr(ar('تكلفة الشراء مطلوبة', 'Purchase cost is required'));   return }
    if (!form.useful_life_years)     { setFormErr(ar('العمر الافتراضي مطلوب','Useful life is required'));    return }

    setSaving(true)
    const payload = {
      name:                form.name,
      purchase_date:       form.purchase_date,
      purchase_cost:       Number(form.purchase_cost),
      useful_life_years:   Number(form.useful_life_years),
      salvage_value:       form.salvage_value ? Number(form.salvage_value) : null,
      depreciation_method: form.depreciation_method || null,
      status:              form.status,
    }
    const res = editAsset
      ? await api.put(`/fixed-assets/${editAsset.id}`, payload)
      : await api.post('/fixed-assets', payload)

    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    fetchAssets()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/fixed-assets/${deleteId}`)
    setDeleteId(null)
    fetchAssets()
  }

  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : '—'

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  const statusLabel = (s: string) => ({
    active:            ar('نشط',             'Active'),
    disposed:          ar('مُستبعَد',        'Disposed'),
    under_maintenance: ar('تحت الصيانة',    'Under Maintenance'),
  }[s] || s)

  const methodLabel = (m: string | null) => ({
    straight_line:      ar('القسط الثابت',    'Straight Line'),
    declining_balance:  ar('الرصيد المتناقص','Declining Balance'),
  }[m || ''] || '—')

  const statusBadge = (s: string) => ({
    active: 'badge-success', disposed: 'badge-danger', under_maintenance: 'badge-warning',
  }[s] || 'badge-muted')

  return (
    <ERPLayout pageTitle={ar('الأصول الثابتة', 'Fixed Assets')}>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-actions" />
        <button className="btn btn-primary" onClick={openAdd}>
          + {ar('أصل جديد', 'New Asset')}
        </button>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────── */}
      {!loading && assets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: ar('إجمالي الأصول', 'Total Assets'),   value: total,                             icon: '🏢' },
            { label: ar('إجمالي التكلفة', 'Total Cost'),    value: fmt(assets.reduce((s,a) => s + a.purchase_cost, 0)), icon: '💰' },
            { label: ar('الأصول النشطة', 'Active Assets'),  value: assets.filter(a => a.status === 'active').length,   icon: '✅' },
          ].map(card => (
            <div key={card.label} className="stat-card">
              <div className="stat-icon">{card.icon}</div>
              <div>
                <p className="stat-value">{card.value}</p>
                <p className="stat-label">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : assets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p className="empty-state-text">{ar('لا توجد أصول ثابتة', 'No fixed assets found')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{ar('اسم الأصل', 'Asset Name')}</th>
                  <th>{ar('تاريخ الشراء', 'Purchase Date')}</th>
                  <th>{ar('تكلفة الشراء', 'Purchase Cost')}</th>
                  <th>{ar('العمر الافتراضي', 'Useful Life')}</th>
                  <th>{ar('طريقة الاستهلاك', 'Dep. Method')}</th>
                  <th>{ar('الحالة', 'Status')}</th>
                  <th>{ar('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id}>
                    <td className="text-muted">{asset.id}</td>
                    <td className="fw-semibold">{asset.name}</td>
                    <td className="text-muted">{fmtDate(asset.purchase_date)}</td>
                    <td>{fmt(asset.purchase_cost)}</td>
                    <td>{asset.useful_life_years} {ar('سنة', 'years')}</td>
                    <td className="text-muted">{methodLabel(asset.depreciation_method)}</td>
                    <td>
                      <span className={`badge ${statusBadge(asset.status)}`}>
                        {statusLabel(asset.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openDepreciation(asset)}>
                          📊 {ar('الاستهلاك', 'Dep.')}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(asset)}>
                          {t('edit')}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(asset.id)}>
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="sales-pagination">
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              {ar('← السابق', '← Prev')}
            </button>
            <span className="text-muted">{ar(`صفحة ${page}`, `Page ${page}`)}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={assets.length < 15}>
              {ar('التالي →', 'Next →')}
            </button>
          </div>
        )}
      </div>

      {/* ── Modal: إضافة / تعديل ──────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editAsset ? ar('تعديل أصل', 'Edit Asset') : ar('أصل جديد', 'New Asset')}
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('اسم الأصل', 'Asset Name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={ar('مثال: سيارة', 'e.g. Vehicle')} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الشراء', 'Purchase Date')} *</label>
                    <input className="input" type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('تكلفة الشراء', 'Purchase Cost')} *</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.purchase_cost} onChange={e => setForm({ ...form, purchase_cost: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('العمر الافتراضي (سنة)', 'Useful Life (years)')} *</label>
                    <input className="input" type="number" min="1" value={form.useful_life_years} onChange={e => setForm({ ...form, useful_life_years: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('القيمة التخريدية', 'Salvage Value')}</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.salvage_value} onChange={e => setForm({ ...form, salvage_value: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('طريقة الاستهلاك', 'Depreciation Method')}</label>
                    <select className="input" value={form.depreciation_method} onChange={e => setForm({ ...form, depreciation_method: e.target.value })}>
                      {DEP_METHODS.map(m => <option key={m} value={m}>{methodLabel(m)}</option>)}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('الحالة', 'Status')}</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </div>
                </div>

                {formErr && (
                  <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {formErr}</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: الاستهلاك ──────────────────────────────── */}
      {depModal && (
        <div className="modal-overlay" onClick={() => { setDepModal(false); setDepInfo(null) }}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('تفاصيل الاستهلاك', 'Depreciation Details')}</h3>
              <button className="btn-icon" onClick={() => { setDepModal(false); setDepInfo(null) }}>✕</button>
            </div>
            <div className="modal-body">
              {depLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
                </div>
              ) : depInfo ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div>
                      <p className="stat-value">{fmt(depInfo.annual_depreciation)}</p>
                      <p className="stat-label">{ar('الاستهلاك السنوي', 'Annual Depreciation')}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📆</div>
                    <div>
                      <p className="stat-value">{fmt(depInfo.monthly)}</p>
                      <p className="stat-label">{ar('الاستهلاك الشهري', 'Monthly Depreciation')}</p>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <p style={{ margin: '0 0 0.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{depInfo.asset.name}</p>
                    <p style={{ margin: 0 }}>{ar('تكلفة الشراء', 'Purchase Cost')}: {fmt(depInfo.asset.purchase_cost)}</p>
                    <p style={{ margin: '0.2rem 0 0' }}>{ar('العمر الافتراضي', 'Useful Life')}: {depInfo.asset.useful_life_years} {ar('سنة', 'years')}</p>
                    <p style={{ margin: '0.2rem 0 0' }}>{ar('القيمة التخريدية', 'Salvage Value')}: {fmt(depInfo.asset.salvage_value)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted">{ar('لا توجد بيانات', 'No data available')}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setDepModal(false); setDepInfo(null) }}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: تأكيد الحذف ────────────────────────────── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('تأكيد الحذف', 'Confirm Delete')}</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>{ar('هل أنت متأكد من حذف هذا الأصل؟', 'Are you sure you want to delete this asset?')}</p>
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
