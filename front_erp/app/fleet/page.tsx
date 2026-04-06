'use client'

// ══════════════════════════════════════════════════════════
// app/fleet/page.tsx — صفحة إدارة الأسطول
// API: GET/POST /api/fleet/vehicles
//      PATCH /api/fleet/vehicles/{id}/status
//      DELETE /api/fleet/vehicles/{id}
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Vehicle = {
  id: number
  plate_number: string
  model: string
  brand?: string
  year?: number
  color?: string
  status: string
  mileage?: number
  assigned_driver?: string
  created_at: string
}

const STATUSES = ['available', 'in_use', 'maintenance', 'retired']

export default function FleetPage() {
  const { t, lang } = useI18n()
  const [items,    setItems]    = useState<Vehicle[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [modal,    setModal]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')

  const [form, setForm] = useState({
    plate_number: '', model: '', brand: '', year: '', color: '', mileage: '', assigned_driver: '', status: 'available'
  })

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }) })
    const res = await api.get<{ data: Vehicle[] }>(`/fleet/vehicles?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as Vehicle[] : []))
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.plate_number || !form.model) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/fleet/vehicles', {
      name: (form.brand ? form.brand + ' ' + form.model : form.model).trim() || form.model,  // backend requires 'name'
      plate: form.plate_number,      // backend requires 'plate'
      model: form.model,
      brand: form.brand,
      year: form.year ? Number(form.year) : null,
      color: form.color,
      odometer: form.mileage ? Number(form.mileage) : 0,
      assigned_to: form.assigned_driver,
      status: form.status,
    })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ plate_number: '', model: '', brand: '', year: '', color: '', mileage: '', assigned_driver: '', status: 'available' })
    fetchItems()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/fleet/vehicles/${deleteId}`)
    setDeleteId(null)
    setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const statusLabels: Record<string, { ar: string; en: string }> = {
    available:   { ar: 'متاح',         en: 'Available' },
    in_use:      { ar: 'قيد الاستخدام', en: 'In Use' },
    maintenance: { ar: 'صيانة',        en: 'Maintenance' },
    retired:     { ar: 'متقاعد',       en: 'Retired' },
  }
  const statusBadge = (s: string) => ({
    available: 'badge-success', in_use: 'badge-warning',
    maintenance: 'badge-danger', retired: 'badge-muted'
  }[s] || 'badge-muted')

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'
  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'إدارة الأسطول' : 'Fleet Management'}>

      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder={lang === 'ar' ? 'بحث في المركبات...' : 'Search vehicles...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + {lang === 'ar' ? 'مركبة جديدة' : 'New Vehicle'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'رقم اللوحة' : 'Plate'}</th>
                  <th>{lang === 'ar' ? 'الموديل' : 'Model'}</th>
                  <th>{lang === 'ar' ? 'الماركة' : 'Brand'}</th>
                  <th>{lang === 'ar' ? 'السائق' : 'Driver'}</th>
                  <th>{lang === 'ar' ? 'الكيلومترات' : 'Mileage'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.plate_number}</td>
                    <td>{item.model}</td>
                    <td className="text-muted">{item.brand || '—'}</td>
                    <td>{item.assigned_driver || '—'}</td>
                    <td>{item.mileage ? fmt(item.mileage) : '—'}</td>
                    <td>
                      <span className={`badge ${statusBadge(item.status)}`}>
                        {lang === 'ar' ? statusLabels[item.status]?.ar : statusLabels[item.status]?.en || item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: إضافة مركبة */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{lang === 'ar' ? 'مركبة جديدة' : 'New Vehicle'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'رقم اللوحة' : 'Plate Number'} *</label>
                    <input className="input" value={form.plate_number} onChange={e => setForm({ ...form, plate_number: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الموديل' : 'Model'} *</label>
                    <input className="input" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الماركة' : 'Brand'}</label>
                    <input className="input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'سنة الصنع' : 'Year'}</label>
                    <input className="input" type="number" min="1990" max="2030" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'اللون' : 'Color'}</label>
                    <input className="input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الكيلومترات' : 'Mileage'}</label>
                    <input className="input" type="number" min="0" value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'السائق المعين' : 'Assigned Driver'}</label>
                    <input className="input" value={form.assigned_driver} onChange={e => setForm({ ...form, assigned_driver: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('status')}</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{lang === 'ar' ? statusLabels[s].ar : statusLabels[s].en}</option>
                      ))}
                    </select>
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

      {/* تأكيد الحذف */}
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
