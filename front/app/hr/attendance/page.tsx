'use client'

// ══════════════════════════════════════════════════════════
// app/hr/attendance.vue/page.tsx — صفحة الحضور والانصراف
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api, extractArray } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui'
import { useI18n } from '../../../lib/i18n'

type Attendance = {
  id: number
  employee_id?: number
  employee?: { name: string }
  date: string
  check_in?: string
  check_out?: string
  status: string
}
type Employee = { id: number; name: string }

export default function AttendancePage() {
  const { show, toasts, remove } = useToast()
  const { t, lang } = useI18n()

  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [filterEmp, setFilterEmp] = useState('')
  const [checkInEmpId, setCheckInEmpId] = useState('')
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().slice(0, 10))
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState<number | null>(null)

  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const fetchAttendance = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterDate) params.set('date', filterDate)
    if (filterEmp) params.set('employee_id', filterEmp)
    const res = await api.get('/attendance?' + params.toString())
    setAttendance(extractArray(res.data) as Attendance[])
    setLoading(false)
  }

  const fetchEmployees = async () => {
    const res = await api.get('/employees?per_page=100')
    setEmployees(extractArray(res.data) as Employee[])
  }

  useEffect(() => { fetchAttendance(); fetchEmployees() }, [])

  const handleCheckIn = async () => {
    if (!checkInEmpId) { show(ar('اختر موظفاً', 'Select employee'), 'error'); return }
    setCheckingIn(true)
    const res = await api.post('/attendance/check-in', { employee_id: checkInEmpId, date: checkInDate })
    if (res.error) show(res.error, 'error')
    else { show(ar('تم تسجيل الحضور', 'Check-in recorded'), 'success'); fetchAttendance() }
    setCheckingIn(false)
  }

  const handleCheckOut = async (id: number) => {
    setCheckingOut(id)
    const res = await api.post('/attendance/' + id + '/check-out', {})
    if (res.error) show(res.error, 'error')
    else { show(ar('تم تسجيل الانصراف', 'Check-out recorded'), 'success'); fetchAttendance() }
    setCheckingOut(null)
  }

  const statusColor = (s: string) => ({ present: 'badge-success', absent: 'badge-danger', late: 'badge-warning' }[s] ?? 'badge-secondary')
  const statusLabel = (s: string) => ({ present: ar('حاضر', 'Present'), absent: ar('غائب', 'Absent'), late: ar('متأخر', 'Late') }[s] ?? s)

  return (
    <ERPLayout>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">{ar('الحضور والانصراف', 'Attendance')}</h1>
        <p className="page-subtitle">{ar('تسجيل وتتبع حضور الموظفين', 'Track employee attendance')}</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>{ar('تسجيل حضور', 'Record Check-in')}</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="input-label">{ar('الموظف', 'Employee')}</label>
            <select className="input" value={checkInEmpId} onChange={e => setCheckInEmpId(e.target.value)}>
              <option value="">{ar('اختر موظفاً', 'Select employee')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="input-label">{ar('التاريخ', 'Date')}</label>
            <input className="input" type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleCheckIn} disabled={checkingIn}>
            {checkingIn ? ar('جارٍ...', 'Loading...') : ar('✅ تسجيل حضور', '✅ Check In')}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="input-label">{ar('تصفية بالتاريخ', 'Filter by Date')}</label>
            <input className="input" type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); }} />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="input-label">{ar('تصفية بالموظف', 'Filter by Employee')}</label>
            <select className="input" value={filterEmp} onChange={e => { setFilterEmp(e.target.value); }}>
              <option value="">{ar('الكل', 'All')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => { setFilterDate(''); setFilterEmp(''); fetchAttendance() }}>
              {ar('إعادة تعيين', 'Reset')}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : attendance.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">{ar('لا توجد سجلات حضور', 'No attendance records found')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{ar('الموظف', 'Employee')}</th>
                  <th>{ar('التاريخ', 'Date')}</th>
                  <th>{ar('وقت الحضور', 'Check In')}</th>
                  <th>{ar('وقت الانصراف', 'Check Out')}</th>
                  <th>{ar('الحالة', 'Status')}</th>
                  <th>{ar('إجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={a.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="fw-semibold">{a.employee?.name || 'Employee #' + a.employee_id}</td>
                    <td>{a.date}</td>
                    <td>{a.check_in ? <span style={{ color: 'var(--color-success)' }}>🟢 {a.check_in}</span> : <span className="text-muted">—</span>}</td>
                    <td>{a.check_out ? <span style={{ color: 'var(--color-danger)' }}>🔴 {a.check_out}</span> : <span className="text-muted">—</span>}</td>
                    <td><span className={'badge ' + statusColor(a.status)}>{statusLabel(a.status)}</span></td>
                    <td>
                      {a.check_in && !a.check_out && (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleCheckOut(a.id)} disabled={checkingOut === a.id}>
                          {checkingOut === a.id ? ar('جارٍ...', 'Loading...') : ar('📤 انصراف', '📤 Check Out')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}
