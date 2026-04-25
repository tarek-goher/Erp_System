'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type WorkCenter = {
  id: number
  name: string
  code?: string
  capacity?: number
  cost_per_hour?: number
  efficiency?: number
  status: string
  description?: string
  created_at: string
}

const STATUSES = ['active', 'inactive', 'maintenance']

export default function WorkCentersPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  const [items, setItems] = useState<WorkCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<WorkCenter | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  const emptyForm = { name: '', code: '', capacity: '', cost_per_hour: '', efficiency: '100', status: 'active', description: '' }
  const [form, setForm] = useState(emptyForm)

  const fetch = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }) })
    const res = await api.get<{ data: WorkCenter[] }>(`/manufacturing/work-centers?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as WorkCenter[] : []))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [search])

  const openNew = () => { setEditItem(null); setForm(emptyForm); setFormErr(''); setModal(true) }
  const openEdit = (item: WorkCenter) => {
    setEditItem(item)
    setForm({ name: item.name, code: item.code || '', capacity: String(item.capacity || ''), cost_per_hour: String(item.cost_per_hour || ''), efficiency: String(item.efficiency || 100), status: item.status, description: item.description || '' })
    setFormErr(''); setModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.name) { setFormErr(t('required_field')); return }
    setSaving(true)
    const body = { name: form.name, code: form.code, capacity: Number(form.capacity) || null, cost_per_hour: Number(form.cost_per_hour) || null, efficiency: Number(form.efficiency) || 100, status: form.status, description: form.description }
    const res = editItem ? await api.put(`/manufacturing/work-centers/${editItem.id}`, body) : await api.post('/manufacturing/work-centers', body)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false); fetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/manufacturing/work-centers/${deleteId}`)
    setDeleteId(null); setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const statusLabel: Record<string, { ar: string; en: string }> = {
    active:      { ar: 'نشط',     en: 'Active' },
    inactive:    { ar: 'غير نشط', en: 'Inactive' },
    maintenance: { ar: 'صيانة',   en: 'Maintenance' },
  }
  const statusBadge = (s: string) => ({ active: 'badge-success', inactive: 'badge-muted', maintenance: 'badge-warning' }[s] || 'badge-muted')
  const fmt = (n?: number) => n != null ? new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n) : '—'

  return (
    <ERPLayout pageTitle={ar ? 'مراكز العمل' : 'Work Centers'}>
      <div className="toolbar">
        <div className="search-bar">
          <span>🔍</span>
          <input placeholder={ar ? 'بحث في مراكز العمل...' : 'Search work centers...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ {ar ? 'مركز عمل جديد' : 'New Work Center'}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🏭</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>{t('name')}</th>
                <th>{ar ? 'الكود' : 'Code'}</th>
                <th>{ar ? 'الطاقة الإنتاجية' : 'Capacity'}</th>
                <th>{ar ? 'التكلفة/ساعة' : 'Cost/Hour'}</th>
                <th>{ar ? 'الكفاءة %' : 'Efficiency %'}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.name}</td>
                    <td className="text-muted">{item.code || '—'}</td>
                    <td>{item.capacity != null ? item.capacity : '—'}</td>
                    <td>{fmt(item.cost_per_hour)}</td>
                    <td>{item.efficiency != null ? `${item.efficiency}%` : '—'}</td>
                    <td><span className={`badge ${statusBadge(item.status)}`}>{ar ? statusLabel[item.status]?.ar : statusLabel[item.status]?.en || item.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>{t('edit')}</button>
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
              <h3 className="modal-title">{editItem ? (ar ? 'تعديل مركز العمل' : 'Edit Work Center') : (ar ? 'مركز عمل جديد' : 'New Work Center')}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{t('name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الكود' : 'Code'}</label>
                    <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الطاقة الإنتاجية' : 'Capacity'}</label>
                    <input className="input" type="number" min="0" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'التكلفة بالساعة' : 'Cost per Hour'}</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.cost_per_hour} onChange={e => setForm(f => ({ ...f, cost_per_hour: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الكفاءة %' : 'Efficiency %'}</label>
                    <input className="input" type="number" min="1" max="200" value={form.efficiency} onChange={e => setForm(f => ({ ...f, efficiency: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('status')}</label>
                    <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s} value={s}>{ar ? statusLabel[s]?.ar : statusLabel[s]?.en}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('description')}</label>
                    <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
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
