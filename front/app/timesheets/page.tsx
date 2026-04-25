'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui'
import { useI18n } from '../../lib/i18n'

type Timesheet = {
  id: number
  employee_id?: number
  employee?: { name: string } | string
  date: string
  clock_in: string
  clock_out?: string
  hours?: number
  notes?: string
}
type Employee = { id: number; name: string; department?: string }

export default function TimesheetsPage() {
  const { toasts, show, remove } = useToast()
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [sheets, setSheets] = useState<Timesheet[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEmp, setFilterEmp] = useState('')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ employee_id: '', date: new Date().toISOString().slice(0, 10), clock_in: '', clock_out: '', notes: '' })

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams({ per_page: '100' })
    if (filterEmp) params.set('employee_id', filterEmp)
    const [sRes, eRes] = await Promise.all([
      api.get('/timesheets?' + params),
      api.get('/employees?per_page=200'),
    ])
    setSheets(extractArray(sRes.data) as Timesheet[])
    setEmployees(extractArray(eRes.data) as Employee[])
    setLoading(false)
  }

  useEffect(() => { load() }, [filterEmp])

  const empName = (s: Timesheet) => {
    if (typeof s.employee === 'object' && s.employee?.name) return s.employee.name
    if (typeof s.employee === 'string') return s.employee
    const found = employees.find(e => e.id === s.employee_id)
    return found?.name || ('Employee #' + s.employee_id)
  }

  const filtered = sheets.filter(s => {
    if (!search) return true
    return empName(s).toLowerCase().includes(search.toLowerCase()) || s.date.includes(search)
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee_id || !form.date || !form.clock_in) {
      show(ar('الموظف والتاريخ ووقت الحضور مطلوبة', 'Employee, date and clock-in are required'), 'error')
      return
    }
    setSaving(true)
    const res = await api.post('/timesheets', { ...form, employee_id: Number(form.employee_id) })
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(ar('تم التسجيل ✅', 'Recorded ✅'), 'success')
    setModal(false)
    setForm({ employee_id: '', date: new Date().toISOString().slice(0, 10), clock_in: '', clock_out: '', notes: '' })
    load()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await api.delete('/timesheets/' + deleteId)
    if (res.error) { show(res.error, 'error'); return }
    show(ar('تم الحذف ✅', 'Deleted ✅'), 'success')
    setDeleteId(null)
    setSheets(p => p.filter(s => s.id !== deleteId))
  }

  const totalHours = sheets.reduce((sum, s) => sum + (s.hours ?? 0), 0)

  const calcHours = (ci: string, co: string) => {
    if (!ci || !co) return null
    const [h1, m1] = ci.split(':').map(Number)
    const [h2, m2] = co.split(':').map(Number)
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    return diff > 0 ? (diff / 60).toFixed(1) + 'h' : null
  }

  return (
    <ERPLayout>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">⏱️ {ar('كشف الوقت', 'Timesheets')}</h1>
          <p className="page-subtitle">{ar('متابعة ساعات العمل والحضور', 'Track working hours and attendance')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {ar('تسجيل حضور', 'Log Time')}</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: '1.5rem' }}>
        {[
          { icon: '📋', label: ar('إجمالي السجلات', 'Total Records'), value: sheets.length, color: 'var(--color-primary)' },
          { icon: '⏰', label: ar('ساعات العمل', 'Total Hours'), value: totalHours.toFixed(1) + 'h', color: 'var(--color-info)' },
          { icon: '✅', label: ar('مكتملة', 'Completed'), value: sheets.filter(s => s.clock_out).length, color: 'var(--color-success)' },
          { icon: '🕐', label: ar('جارية', 'In Progress'), value: sheets.filter(s => !s.clock_out).length, color: 'var(--color-warning)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '1.5rem' }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder={ar('بحث بالاسم أو التاريخ...', 'Search by name or date...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input" style={{ minWidth: 180 }} value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
            <option value="">{ar('كل الموظفين', 'All Employees')}</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {filterEmp && (
            <button className="btn btn-secondary" onClick={() => setFilterEmp('')}>{ar('إعادة تعيين', 'Reset')}</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏱️</div>
            <p className="empty-state-text">{ar('لا توجد سجلات', 'No timesheets found')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar('الموظف', 'Employee')}</th>
                  <th>{ar('التاريخ', 'Date')}</th>
                  <th>{ar('وقت الحضور', 'Clock In')}</th>
                  <th>{ar('وقت الانصراف', 'Clock Out')}</th>
                  <th>{ar('الساعات', 'Hours')}</th>
                  <th>{ar('ملاحظات', 'Notes')}</th>
                  <th>{ar('إجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="fw-semibold">{empName(s)}</td>
                    <td>{s.date}</td>
                    <td style={{ direction: 'ltr' }}>{s.clock_in}</td>
                    <td style={{ direction: 'ltr' }}>
                      {s.clock_out
                        ? s.clock_out
                        : <span style={{ color: 'var(--color-warning)', fontSize: '0.8rem' }}>⏳ {ar('جارٍ', 'In progress')}</span>}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {s.hours ? s.hours.toFixed(1) + 'h' : calcHours(s.clock_in, s.clock_out || '') || '—'}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{s.notes || '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(s.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">⏱️ {ar('تسجيل وقت عمل', 'Log Work Time')}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="input-grid">
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('الموظف *', 'Employee *')}</label>
                    <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
                      <option value="">{ar('اختر موظفاً', 'Select employee')}</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}{e.department ? ' — ' + e.department : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('التاريخ *', 'Date *')}</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('وقت الحضور *', 'Clock In *')}</label>
                    <input className="input" type="time" value={form.clock_in} onChange={e => setForm({ ...form, clock_in: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('وقت الانصراف', 'Clock Out')}</label>
                    <input className="input" type="time" value={form.clock_out} onChange={e => setForm({ ...form, clock_out: e.target.value })} />
                  </div>
                  {form.clock_in && form.clock_out && (
                    <div style={{ gridColumn: '1 / -1', padding: '0.5rem 0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: '0.875rem' }}>
                      ⏱️ {ar('إجمالي الساعات:', 'Total hours:')} <strong>{calcHours(form.clock_in, form.clock_out) || '—'}</strong>
                    </div>
                  )}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('ملاحظات', 'Notes')}</label>
                    <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={ar('مثال: اجتماع عميل', 'e.g. Client meeting')} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3>{ar('حذف السجل؟', 'Delete this record?')}</h3>
              <p className="text-muted" style={{ marginTop: 8 }}>{ar('لا يمكن التراجع عن هذا الإجراء.', 'This action cannot be undone.')}</p>
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
