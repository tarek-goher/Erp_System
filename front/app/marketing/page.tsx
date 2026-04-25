'use client'

// ══════════════════════════════════════════════════════════
// app/marketing/page.tsx — صفحة التسويق والحملات
// API: GET/POST /api/marketing/campaigns
//      DELETE /api/marketing/campaigns/{id}
//      GET /api/marketing/contacts
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Campaign = {
  id: number
  name: string
  type?: string
  status: string
  budget?: number
  start_date?: string
  end_date?: string
  description?: string
  created_at: string
}

const CAMPAIGN_TYPES    = ['email', 'sms', 'social', 'ads', 'other']
const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed', 'cancelled']

export default function MarketingPage() {
  const { t, lang } = useI18n()
  const [items,    setItems]    = useState<Campaign[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [modal,    setModal]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')

  const [form, setForm] = useState({
    name: '', type: 'email', status: 'draft',
    budget: '', start_date: '', end_date: '', description: ''
  })

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }), ...(statusF && { status: statusF }) })
    const res = await api.get<{ data: Campaign[] }>(`/marketing/campaigns?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as Campaign[] : []))
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search, statusF])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.name) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/marketing/campaigns', {
      name: form.name, type: form.type, status: form.status,
      subject: form.subject || form.name,
      body: form.body || form.description || form.name,
      budget: form.budget ? Number(form.budget) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      description: form.description,
    })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ name: '', type: 'email', status: 'draft', budget: '', start_date: '', end_date: '', description: '', body: '', subject: '' })
    fetchItems()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/marketing/campaigns/${deleteId}`)
    setDeleteId(null)
    setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const typeLabels: Record<string, { ar: string; en: string }> = {
    email:  { ar: 'بريد إلكتروني', en: 'Email' },
    sms:    { ar: 'رسائل SMS',     en: 'SMS' },
    social: { ar: 'تواصل اجتماعي', en: 'Social' },
    ads:    { ar: 'إعلانات',       en: 'Ads' },
    other:  { ar: 'أخرى',         en: 'Other' },
  }
  const statusLabels: Record<string, { ar: string; en: string }> = {
    draft:     { ar: 'مسودة',  en: 'Draft' },
    active:    { ar: 'نشطة',   en: 'Active' },
    paused:    { ar: 'متوقفة', en: 'Paused' },
    completed: { ar: 'مكتملة', en: 'Completed' },
    cancelled: { ar: 'ملغاة',  en: 'Cancelled' },
  }
  const statusBadge = (s: string) => ({
    draft: 'badge-muted', active: 'badge-success', paused: 'badge-warning',
    completed: 'badge-info', cancelled: 'badge-danger'
  }[s] || 'badge-muted')

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'
  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'التسويق' : 'Marketing'}>

      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder={lang === 'ar' ? 'بحث في الحملات...' : 'Search campaigns...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            {CAMPAIGN_STATUSES.map(s => (
              <option key={s} value={s}>{lang === 'ar' ? statusLabels[s].ar : statusLabels[s].en}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + {lang === 'ar' ? 'حملة جديدة' : 'New Campaign'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📣</div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'اسم الحملة' : 'Campaign'}</th>
                  <th>{lang === 'ar' ? 'النوع' : 'Type'}</th>
                  <th>{lang === 'ar' ? 'الميزانية' : 'Budget'}</th>
                  <th>{lang === 'ar' ? 'تاريخ البدء' : 'Start'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.name}</td>
                    <td>{lang === 'ar' ? typeLabels[item.type || '']?.ar : typeLabels[item.type || '']?.en || item.type || '—'}</td>
                    <td>{item.budget ? fmt(item.budget) : '—'}</td>
                    <td className="text-muted">{fmtDate(item.start_date || '')}</td>
                    <td>
                      <span className={`badge ${statusBadge(item.status)}`}>
                        {lang === 'ar' ? statusLabels[item.status]?.ar : statusLabels[item.status]?.en || item.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: حملة جديدة */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{lang === 'ar' ? 'حملة تسويقية جديدة' : 'New Campaign'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{lang === 'ar' ? 'اسم الحملة' : 'Campaign Name'} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'النوع' : 'Type'}</label>
                    <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {CAMPAIGN_TYPES.map(tp => (
                        <option key={tp} value={tp}>{lang === 'ar' ? typeLabels[tp].ar : typeLabels[tp].en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('status')}</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {CAMPAIGN_STATUSES.map(s => (
                        <option key={s} value={s}>{lang === 'ar' ? statusLabels[s].ar : statusLabels[s].en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الميزانية' : 'Budget'}</label>
                    <input className="input" type="number" min="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                    <input className="input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</label>
                    <input className="input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('description')}</label>
                    <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
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
