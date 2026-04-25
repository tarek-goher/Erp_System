'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type PLMItem = {
  id: number
  name: string
  reference?: string
  product_name?: string
  stage?: string
  phase?: string
  version?: string
  responsible?: string
  start_date?: string
  end_date?: string
  status: string
  created_at: string
}

const STAGES = ['concept', 'design', 'prototype', 'testing', 'production', 'end_of_life']

export default function PLMPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  const [items, setItems] = useState<PLMItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageF, setStageF] = useState('')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  const [form, setForm] = useState({ name: '', product_name: '', stage: 'concept', version: '', responsible: '', start_date: '', end_date: '' })

  const fetch = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }), ...(stageF && { stage: stageF }) })
    const res = await api.get<{ data: PLMItem[] }>(`/plm/products?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as PLMItem[] : []))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [search, stageF])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.name) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/plm/products', form)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ name: '', product_name: '', stage: 'concept', version: '', responsible: '', start_date: '', end_date: '' })
    fetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/plm/products/${deleteId}`)
    setDeleteId(null); setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const stageLabel: Record<string, { ar: string; en: string; color: string }> = {
    concept:     { ar: 'فكرة',          en: 'Concept',      color: 'badge-muted' },
    design:      { ar: 'تصميم',          en: 'Design',       color: 'badge-info' },
    prototype:   { ar: 'نموذج أولي',    en: 'Prototype',    color: 'badge-warning' },
    testing:     { ar: 'اختبار',         en: 'Testing',      color: 'badge-primary' },
    production:  { ar: 'إنتاج',          en: 'Production',   color: 'badge-success' },
    end_of_life: { ar: 'نهاية الحياة',  en: 'End of Life',  color: 'badge-danger' },
  }
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'

  return (
    <ERPLayout pageTitle={ar ? 'إدارة دورة حياة المنتج' : 'Product Lifecycle Management'}>
      {/* Stage Pipeline */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
        {STAGES.map(s => {
          const count = items.filter(i => i.stage === s).length
          const info = stageLabel[s]
          return (
            <div key={s} className="card" style={{ minWidth: 130, textAlign: 'center', cursor: 'pointer', border: stageF === s ? '2px solid var(--color-primary)' : undefined }} onClick={() => setStageF(stageF === s ? '' : s)}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{count}</div>
              <div style={{ fontSize: '0.8rem' }}><span className={`badge ${info.color}`}>{ar ? info.ar : info.en}</span></div>
            </div>
          )
        })}
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <span>🔍</span>
          <input placeholder={ar ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {ar ? 'منتج جديد' : 'New Product'}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔬</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>{t('name')}</th>
                <th>{t('product')}</th>
                <th>{ar ? 'الإصدار' : 'Version'}</th>
                <th>{ar ? 'المرحلة' : 'Stage'}</th>
                <th>{ar ? 'المسؤول' : 'Responsible'}</th>
                <th>{ar ? 'تاريخ البداية' : 'Start Date'}</th>
                <th>{ar ? 'تاريخ النهاية' : 'End Date'}</th>
                <th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.name}</td>
                    <td>{item.product_name || '—'}</td>
                    <td><span className="badge badge-muted">{item.version || 'v1.0'}</span></td>
                    <td><span className={`badge ${stageLabel[item.stage || '']?.color || 'badge-muted'}`}>{ar ? stageLabel[item.stage || '']?.ar : stageLabel[item.stage || '']?.en || item.stage}</span></td>
                    <td>{item.responsible || '—'}</td>
                    <td className="text-muted">{fmtDate(item.start_date)}</td>
                    <td className="text-muted">{fmtDate(item.end_date)}</td>
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
              <h3 className="modal-title">{ar ? 'منتج جديد - PLM' : 'New Product - PLM'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{ar ? 'اسم المشروع' : 'Project Name'} *</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('product')}</label>
                    <input className="input" value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'المرحلة' : 'Stage'}</label>
                    <select className="input" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                      {STAGES.map(s => <option key={s} value={s}>{ar ? stageLabel[s]?.ar : stageLabel[s]?.en}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الإصدار' : 'Version'}</label>
                    <input className="input" placeholder="v1.0" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'المسؤول' : 'Responsible'}</label>
                    <input className="input" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'تاريخ البداية' : 'Start Date'}</label>
                    <input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'تاريخ النهاية' : 'End Date'}</label>
                    <input className="input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
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
