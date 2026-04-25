'use client'

// ══════════════════════════════════════════════════════════
// app/hr/leave-requests.vue/page.tsx — صفحة طلبات الإجازة
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api, extractArray } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui'
import { useI18n } from '../../../lib/i18n'

type LeaveRequest = {
  id: number
  employee?: { name: string }
  employee_id?: number
  type: string
  start_date: string
  end_date: string
  status: string
  reason?: string
}
type Employee = { id: number; name: string }

const LEAVE_TYPES = ['annual', 'sick', 'emergency', 'unpaid', 'maternity']

export default function LeaveRequestsPage() {
  const { show, toasts, remove } = useToast()
  const { t, lang } = useI18n()

  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' })

  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const fetchLeaves = async () => {
    setLoading(true)
    const params = filterStatus ? '?status=' + filterStatus : ''
    const res = await api.get('/leave-requests' + params)
    setLeaves(extractArray(res.data) as LeaveRequest[])
    setLoading(false)
  }

  const fetchEmployees = async () => {
    const res = await api.get('/employees?per_page=100')
    setEmployees(extractArray(res.data) as Employee[])
  }

  useEffect(() => { fetchLeaves(); fetchEmployees() }, [])
  useEffect(() => { fetchLeaves() }, [filterStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee_id || !form.start_date || !form.end_date) {
      show(ar('يرجى ملء الحقول المطلوبة', 'Please fill required fields'), 'error')
      return
    }
    setSaving(true)
    const res = await api.post('/leave-requests', form)
    if (res.error) show(res.error, 'error')
    else {
      show(ar('تم إرسال طلب الإجازة', 'Leave request submitted'), 'success')
      setModal(false)
      setForm({ employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' })
      fetchLeaves()
    }
    setSaving(false)
  }

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const res = await api.post('/leave-requests/' + id + '/' + action, {})
    if (res.error) show(res.error, 'error')
    else { show(action === 'approve' ? ar('تمت الموافقة', 'Approved') : ar('تم الرفض', 'Rejected'), 'success'); fetchLeaves() }
  }

  const statusBadge = (s: string) => ({ approved: 'badge-success', rejected: 'badge-danger', pending: 'badge-warning' }[s] ?? 'badge-secondary')
  const statusLabel = (s: string) => ({ approved: ar('موافق', 'Approved'), rejected: ar('مرفوض', 'Rejected'), pending: ar('معلق', 'Pending') }[s] ?? s)
  const typeLabel = (t: string) => ({
    annual: ar('سنوية', 'Annual'), sick: ar('مرضية', 'Sick'), emergency: ar('طارئة', 'Emergency'),
    unpaid: ar('بدون راتب', 'Unpaid'), maternity: ar('أمومة', 'Maternity')
  }[t] ?? t)

  const days = (s: string, e: string) => {
    if (!s || !e) return 0
    return Math.max(1, Math.floor((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1)
  }

  return (
    <ERPLayout>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">{ar('طلبات الإجازة', 'Leave Requests')}</h1>
          <p className="page-subtitle">{ar('إدارة طلبات الإجازة وموافقاتها', 'Manage leave requests and approvals')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {ar('طلب إجازة', 'New Request')}</button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div className="input-group" style={{ minWidth: 160 }}>
            <label className="input-label">{ar('تصفية بالحالة', 'Filter by Status')}</label>
            <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{ar('الكل', 'All')}</option>
              <option value="pending">{ar('معلق', 'Pending')}</option>
              <option value="approved">{ar('موافق', 'Approved')}</option>
              <option value="rejected">{ar('مرفوض', 'Rejected')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : leaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏖️</div>
            <p className="empty-state-text">{ar('لا توجد طلبات إجازة', 'No leave requests')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{ar('الموظف', 'Employee')}</th>
                  <th>{ar('النوع', 'Type')}</th>
                  <th>{ar('من', 'From')}</th>
                  <th>{ar('إلى', 'To')}</th>
                  <th>{ar('الأيام', 'Days')}</th>
                  <th>{ar('الحالة', 'Status')}</th>
                  <th>{ar('إجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l, i) => (
                  <tr key={l.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="fw-semibold">{l.employee?.name || 'Employee #' + l.employee_id}</td>
                    <td>{typeLabel(l.type)}</td>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td className="fw-semibold">{days(l.start_date, l.end_date)}</td>
                    <td><span className={'badge ' + statusBadge(l.status)}>{statusLabel(l.status)}</span></td>
                    <td>
                      {l.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-success" onClick={() => handleAction(l.id, 'approve')}>✅ {ar('موافقة', 'Approve')}</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleAction(l.id, 'reject')}>❌ {ar('رفض', 'Reject')}</button>
                        </div>
                      )}
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">{ar('طلب إجازة جديد', 'New Leave Request')}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-grid">
                  <div className="input-group">
                    <label className="input-label">{ar('الموظف *', 'Employee *')}</label>
                    <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
                      <option value="">{ar('اختر موظفاً', 'Select employee')}</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('نوع الإجازة *', 'Leave Type *')}</label>
                    <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {LEAVE_TYPES.map(lt => <option key={lt} value={lt}>{typeLabel(lt)}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ البداية *', 'Start Date *')}</label>
                    <input className="input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ النهاية *', 'End Date *')}</label>
                    <input className="input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                  </div>
                  {form.start_date && form.end_date && (
                    <div style={{ gridColumn: '1 / -1', padding: '0.5rem 0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 6, fontSize: '0.875rem' }}>
                      📅 {ar('عدد الأيام:', 'Days:')} <strong>{days(form.start_date, form.end_date)}</strong>
                    </div>
                  )}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('السبب', 'Reason')}</label>
                    <textarea className="input" rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={{ resize: 'vertical' }} />
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
    </ERPLayout>
  )
}
