'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type SignRequest = {
  id: number
  title: string
  reference?: string
  requester_name?: string
  signer_name?: string
  signer_email?: string
  document_url?: string
  status: string
  signed_at?: string
  expires_at?: string
  created_at: string
}

const STATUSES = ['draft', 'sent', 'signed', 'declined', 'expired', 'cancelled']

export default function SignPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  const [items, setItems] = useState<SignRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  const [form, setForm] = useState({ title: '', signer_name: '', signer_email: '', expires_at: '' })

  const fetch = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }), ...(statusF && { status: statusF }) })
    const res = await api.get<{ data: SignRequest[] }>(`/sign/requests?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as SignRequest[] : []))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [search, statusF])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.title || !form.signer_email) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/sign/requests', form)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ title: '', signer_name: '', signer_email: '', expires_at: '' })
    fetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/sign/requests/${deleteId}`)
    setDeleteId(null); setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const statusLabel: Record<string, { ar: string; en: string }> = {
    draft:     { ar: 'مسودة',       en: 'Draft' },
    sent:      { ar: 'تم الإرسال',  en: 'Sent' },
    signed:    { ar: 'موقّع',        en: 'Signed' },
    declined:  { ar: 'مرفوض',       en: 'Declined' },
    expired:   { ar: 'منتهي',       en: 'Expired' },
    cancelled: { ar: 'ملغي',        en: 'Cancelled' },
  }
  const statusBadge = (s: string) => ({
    draft: 'badge-muted', sent: 'badge-info', signed: 'badge-success',
    declined: 'badge-danger', expired: 'badge-warning', cancelled: 'badge-muted'
  }[s] || 'badge-muted')
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'

  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'sent').length,
    signed: items.filter(i => i.status === 'signed').length,
    declined: items.filter(i => ['declined', 'expired'].includes(i.status)).length,
  }

  return (
    <ERPLayout pageTitle={ar ? 'التوقيع الإلكتروني' : 'Electronic Signatures'}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: ar ? 'إجمالي' : 'Total', value: stats.total, icon: '📄' },
          { label: ar ? 'في الانتظار' : 'Pending', value: stats.pending, icon: '⏳' },
          { label: ar ? 'موقّعة' : 'Signed', value: stats.signed, icon: '✍️' },
          { label: ar ? 'مرفوضة/منتهية' : 'Declined/Expired', value: stats.declined, icon: '❌' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '2rem' }}>{c.icon}</span>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>{c.label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder={ar ? 'بحث في الطلبات...' : 'Search requests...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{ar ? statusLabel[s]?.ar : statusLabel[s]?.en}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {ar ? 'طلب توقيع جديد' : 'New Signature Request'}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">✍️</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>#</th>
                <th>{ar ? 'العنوان' : 'Title'}</th>
                <th>{ar ? 'المُوقِّع' : 'Signer'}</th>
                <th>{ar ? 'البريد الإلكتروني' : 'Email'}</th>
                <th>{t('status')}</th>
                <th>{ar ? 'تاريخ التوقيع' : 'Signed At'}</th>
                <th>{ar ? 'تاريخ الانتهاء' : 'Expires At'}</th>
                <th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="text-muted">{item.reference || `SGN-${item.id}`}</td>
                    <td className="fw-semibold">{item.title}</td>
                    <td>{item.signer_name || '—'}</td>
                    <td className="text-muted">{item.signer_email || '—'}</td>
                    <td><span className={`badge ${statusBadge(item.status)}`}>{ar ? statusLabel[item.status]?.ar : statusLabel[item.status]?.en || item.status}</span></td>
                    <td className="text-muted">{fmtDate(item.signed_at)}</td>
                    <td className="text-muted">{fmtDate(item.expires_at)}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button></td>
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
              <h3 className="modal-title">{ar ? 'طلب توقيع جديد' : 'New Signature Request'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar ? 'عنوان المستند' : 'Document Title'} *</label>
                    <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'اسم المُوقِّع' : 'Signer Name'}</label>
                    <input className="input" value={form.signer_name} onChange={e => setForm(f => ({ ...f, signer_name: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'بريد المُوقِّع' : 'Signer Email'} *</label>
                    <input className="input" type="email" value={form.signer_email} onChange={e => setForm(f => ({ ...f, signer_email: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                    <input className="input" type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                  </div>
                </div>
                {formErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {formErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : (ar ? 'إرسال للتوقيع' : 'Send for Signature')}</button>
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
