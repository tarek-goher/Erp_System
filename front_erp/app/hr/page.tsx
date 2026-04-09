'use client'

// ══════════════════════════════════════════════════════════
// app/hr/page.tsx — صفحة الموارد البشرية
// API: GET/POST /api/employees | DELETE /api/employees/{id}
//      GET /api/attendance
//      GET/POST /api/leave-requests | PATCH /api/leave-requests/{id}/status
//      GET /api/payroll
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { StatCard, Badge, EmptyState, SearchInput, Modal, ToastContainer } from '../../components/ui'
import { useI18n } from '../../lib/i18n'

type Employee    = { id: number; name: string; email: string; department?: string; position?: string; status: string; hire_date: string; salary?: number }
type Attendance  = { id: number; employee?: { name: string }; date: string; check_in?: string; check_out?: string; status: string }
type LeaveRequest = { id: number; employee?: { name: string }; type: string; start_date: string; end_date: string; status: string; reason?: string }
type Payroll     = { id: number; employee?: { name: string }; month: string; basic_salary: number; total_deductions: number; net_salary: number; status: string }

const TABS = ['employees', 'attendance', 'leaves', 'payroll']

export default function HRPage() {
  const { show, toasts, remove } = useToast()
  const { t, lang } = useI18n()
  const [activeTab, setActiveTab] = useState('employees')

  // ── Employees ──────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [empLoading, setEmpLoading] = useState(true)
  const [empSearch, setEmpSearch] = useState('')
  const [empModal, setEmpModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [empSaving, setEmpSaving] = useState(false)
  const [empErr, setEmpErr] = useState('')
  const [empForm, setEmpForm] = useState({ name: '', email: '', phone: '', department: '', role: '', position: '', hire_date: '', salary: '' })

  // ── Attendance ─────────────────────────────────────────
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [attLoading, setAttLoading] = useState(true)
  const [attDate, setAttDate] = useState('')
  const [checkInEmpId, setCheckInEmpId] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [attMsg, setAttMsg] = useState('')

  // ── Leave Requests ─────────────────────────────────────
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [leaveLoading, setLeaveLoading] = useState(true)
  const [leaveModal, setLeaveModal] = useState(false)
  const [leaveSaving, setLeaveSaving] = useState(false)
  const [leaveErr, setLeaveErr] = useState('')
  const [leaveForm, setLeaveForm] = useState({ employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' })

  // ── Payroll ────────────────────────────────────────────
  const [payroll, setPayroll] = useState<Payroll[]>([])
  const [payLoading, setPayLoading] = useState(true)

  // ─── Fetch Employees ───────────────────────────────────
  const fetchEmployees = async () => {
    setEmpLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(empSearch && { search: empSearch }) })
    const res = await api.get<{ data: Employee[] }>(`/employees?${p}`)
    if (res.data) setEmployees(extractArray(res.data))
    setEmpLoading(false)
  }

  // ─── Fetch Attendance ──────────────────────────────────
  const fetchAttendance = async () => {
    setAttLoading(true)
    const p = new URLSearchParams({ per_page: '30', ...(attDate && { date: attDate }) })
    const res = await api.get<{ data: Attendance[] }>(`/attendance?${p}`)
    if (res.data) setAttendance(extractArray(res.data))
    setAttLoading(false)
  }

  // ─── Fetch Leaves ──────────────────────────────────────
  const fetchLeaves = async () => {
    setLeaveLoading(true)
    const res = await api.get<{ data: LeaveRequest[] }>('/leave-requests?per_page=20')
    if (res.data) setLeaves(extractArray(res.data))
    setLeaveLoading(false)
  }

  // ─── Fetch Payroll ─────────────────────────────────────
  const fetchPayroll = async () => {
    setPayLoading(true)
    const res = await api.get<{ data: Payroll[] }>('/payrolls?per_page=20')
    if (res.data) setPayroll(extractArray(res.data))
    setPayLoading(false)
  }

  // ── تسجيل حضور ────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!checkInEmpId) { setAttMsg(lang === 'ar' ? 'اختر موظف أولاً' : 'Select employee first'); return }
    setCheckingIn(true); setAttMsg('')
    const res = await api.post('/attendance/check-in', { employee_id: Number(checkInEmpId) })
    setCheckingIn(false)
    if (res.error) { setAttMsg(res.error); return }
    setAttMsg(lang === 'ar' ? '✅ تم تسجيل الحضور' : '✅ Checked in')
    fetchAttendance()
  }

  // ── تسجيل انصراف ───────────────────────────────────────
  const handleCheckOut = async () => {
    if (!checkInEmpId) { setAttMsg(lang === 'ar' ? 'اختر موظف أولاً' : 'Select employee first'); return }
    setCheckingOut(true); setAttMsg('')
    const res = await api.post('/attendance/check-out', { employee_id: Number(checkInEmpId) })
    setCheckingOut(false)
    if (res.error) { setAttMsg(res.error); return }
    setAttMsg(lang === 'ar' ? '✅ تم تسجيل الانصراف' : '✅ Checked out')
    fetchAttendance()
  }

  useEffect(() => {
    if (activeTab === 'employees')  fetchEmployees()
    if (activeTab === 'attendance') fetchAttendance()
    if (activeTab === 'leaves')     fetchLeaves()
    if (activeTab === 'payroll')    fetchPayroll()
  }, [activeTab])

  useEffect(() => { if (activeTab === 'employees')  fetchEmployees()  }, [empSearch])
  useEffect(() => { if (activeTab === 'attendance') fetchAttendance() }, [attDate])

  // ── إضافة موظف ─────────────────────────────────────────
  const handleEmpSubmit = async (e: FormEvent) => {
    e.preventDefault(); setEmpErr('')
    if (!empForm.name || !empForm.email) { setEmpErr(t('required_field')); return }
    setEmpSaving(true)
    const res = await api.post('/employees', {
      name: empForm.name, email: empForm.email, phone: empForm.phone,
      department: empForm.department,
      role: empForm.role || empForm.position || 'موظف',
      hire_date: empForm.hire_date, salary: Number(empForm.salary) || 0,
    })
    setEmpSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(lang === 'ar' ? 'تم إضافة الموظف ✅' : 'Employee added ✅')
    setEmpModal(false)
    setEmpForm({ name: '', email: '', phone: '', department: '', role: '', position: '', hire_date: '', salary: '' })
    fetchEmployees()
  }

  const handleEmpDelete = async () => {
    if (!deleteId) return
    await api.delete(`/employees/${deleteId}`)
    setDeleteId(null)
    setEmployees(prev => prev.filter(e => e.id !== deleteId))
  }

  // ── طلب إجازة ──────────────────────────────────────────
  const handleLeaveSubmit = async (e: FormEvent) => {
    e.preventDefault(); setLeaveErr('')
    if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date) {
      setLeaveErr(t('required_field')); return
    }
    setLeaveSaving(true)
    const res = await api.post('/leave-requests', {
      employee_id: Number(leaveForm.employee_id), type: leaveForm.type,
      start_date: leaveForm.start_date, end_date: leaveForm.end_date, reason: leaveForm.reason,
    })
    setLeaveSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(lang === 'ar' ? 'تم تقديم طلب الإجازة ✅' : 'Leave request submitted ✅')
    setLeaveModal(false)
    setLeaveForm({ employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' })
    fetchLeaves()
  }

  // ── تحديث حالة الإجازة ────────────────────────────────
  const handleLeaveStatus = async (id: number, status: string) => {
    await api.patch(`/leave-requests/${id}/status`, { status })
    fetchLeaves()
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'
  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  const leaveTypeLabels: Record<string, { ar: string; en: string }> = {
    annual:   { ar: 'سنوية',   en: 'Annual' },
    sick:     { ar: 'مرضية',   en: 'Sick' },
    emergency:{ ar: 'طارئة',   en: 'Emergency' },
    unpaid:   { ar: 'بدون راتب', en: 'Unpaid' },
  }
  const leaveStatusBadge = (s: string) => ({ approved: 'badge-success', rejected: 'badge-danger', pending: 'badge-warning' }[s] || 'badge-muted')
  const attStatusBadge   = (s: string) => ({ present: 'badge-success', absent: 'badge-danger', late: 'badge-warning', half_day: 'badge-info' }[s] || 'badge-muted')
  const payStatusBadge   = (s: string) => ({ paid: 'badge-success', pending: 'badge-warning', processing: 'badge-info' }[s] || 'badge-muted')

  const tabLabels: Record<string, { ar: string; en: string }> = {
    employees:  { ar: 'الموظفون', en: 'Employees' },
    attendance: { ar: 'الحضور',   en: 'Attendance' },
    leaves:     { ar: 'الإجازات', en: 'Leaves' },
    payroll:    { ar: 'الرواتب',  en: 'Payroll' },
  }

  return (
    <ERPLayout pageTitle={t('hr')}>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {lang === 'ar' ? tabLabels[tab].ar : tabLabels[tab].en}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          تاب: الموظفون
      ══════════════════════════════════════════════════ */}
      {activeTab === 'employees' && (
        <>
          <div className="toolbar">
            <div className="search-bar">
              <span>🔍</span>
              <input
                placeholder={lang === 'ar' ? 'بحث في الموظفين...' : 'Search employees...'}
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setEmpModal(true)}>
              + {lang === 'ar' ? 'موظف جديد' : 'New Employee'}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {empLoading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : employees.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">👥</div><p className="empty-state-text">{t('no_data')}</p></div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('name')}</th>
                      <th>{t('email')}</th>
                      <th>{lang === 'ar' ? 'القسم' : 'Dept'}</th>
                      <th>{lang === 'ar' ? 'المنصب' : 'Position'}</th>
                      <th>{lang === 'ar' ? 'الراتب' : 'Salary'}</th>
                      <th>{lang === 'ar' ? 'تاريخ التعيين' : 'Hire Date'}</th>
                      <th>{t('status')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id}>
                        <td className="fw-semibold">{emp.name}</td>
                        <td className="text-muted">{emp.email}</td>
                        <td>{emp.department || '—'}</td>
                        <td>{emp.position || '—'}</td>
                        <td>{emp.salary ? fmt(emp.salary) : '—'}</td>
                        <td className="text-muted">{fmtDate(emp.hire_date)}</td>
                        <td>
                          <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                            {emp.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(emp.id)}>{t('delete')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal: إضافة موظف */}
          {empModal && (
            <div className="modal-overlay" onClick={() => setEmpModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">{lang === 'ar' ? 'موظف جديد' : 'New Employee'}</h3>
                  <button className="btn-icon" onClick={() => setEmpModal(false)}>✕</button>
                </div>
                <form onSubmit={handleEmpSubmit}>
                  <div className="modal-body">
                    <div className="form-grid form-grid-2">
                      <div className="input-group">
                        <label className="input-label">{t('name')} *</label>
                        <input className="input" value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">{t('email')} *</label>
                        <input className="input" type="email" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">{t('phone')}</label>
                        <input className="input" value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'الراتب' : 'Salary'}</label>
                        <input className="input" type="number" min="0" value={empForm.salary} onChange={e => setEmpForm({ ...empForm, salary: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'القسم' : 'Department'}</label>
                        <input className="input" value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'المنصب' : 'Position'}</label>
                        <input className="input" value={empForm.role || empForm.position} onChange={e => setEmpForm({ ...empForm, role: e.target.value, position: e.target.value })} required />
                      </div>
                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">{lang === 'ar' ? 'تاريخ التعيين' : 'Hire Date'}</label>
                        <input className="input" type="date" value={empForm.hire_date} onChange={e => setEmpForm({ ...empForm, hire_date: e.target.value })} />
                      </div>
                    </div>
                    {empErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {empErr}</div>}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setEmpModal(false)}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={empSaving}>{empSaving ? t('loading') : t('save')}</button>
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
                  <button className="btn btn-danger" onClick={handleEmpDelete}>{t('delete')}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          تاب: الحضور
      ══════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <>
          {/* ── لوحة الحضور والانصراف السريع ── */}
          <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="input-group" style={{ margin: 0, minWidth: 200, flex: 1 }}>
                <label className="input-label" style={{ marginBottom: '0.3rem' }}>
                  {lang === 'ar' ? 'اختر الموظف' : 'Select Employee'}
                </label>
                <select className="input" value={checkInEmpId} onChange={e => { setCheckInEmpId(e.target.value); setAttMsg('') }}>
                  <option value="">{lang === 'ar' ? 'اختر موظف...' : 'Select employee...'}</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleCheckIn} disabled={checkingIn} style={{ minWidth: 130 }}>
                {checkingIn ? '⏳...' : (lang === 'ar' ? '✅ تسجيل حضور' : '✅ Check In')}
              </button>
              <button className="btn btn-secondary" onClick={handleCheckOut} disabled={checkingOut} style={{ minWidth: 130 }}>
                {checkingOut ? '⏳...' : (lang === 'ar' ? '🚪 تسجيل انصراف' : '🚪 Check Out')}
              </button>
            </div>
            {attMsg && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: attMsg.startsWith('✅') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {attMsg}
              </p>
            )}
          </div>

          <div className="toolbar">
            <div className="input-group" style={{ margin: 0 }}>
              <input
                className="input"
                type="date"
                value={attDate}
                onChange={e => setAttDate(e.target.value)}
                style={{ width: 'auto' }}
              />
            </div>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              {lang === 'ar' ? `${attendance.length} سجل` : `${attendance.length} records`}
            </span>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {attLoading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : attendance.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📅</div><p className="empty-state-text">{t('no_data')}</p></div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                      <th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                      <th>{lang === 'ar' ? 'وقت الحضور' : 'Check In'}</th>
                      <th>{lang === 'ar' ? 'وقت الانصراف' : 'Check Out'}</th>
                      <th>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id}>
                        <td className="fw-semibold">{a.employee?.name || '—'}</td>
                        <td className="text-muted">{fmtDate(a.date)}</td>
                        <td>{a.check_in || '—'}</td>
                        <td>{a.check_out || '—'}</td>
                        <td>
                          <span className={`badge ${attStatusBadge(a.status)}`}>
                            {{ present: lang === 'ar' ? 'حاضر' : 'Present', absent: lang === 'ar' ? 'غائب' : 'Absent', late: lang === 'ar' ? 'متأخر' : 'Late', half_day: lang === 'ar' ? 'نصف يوم' : 'Half Day' }[a.status] || a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          تاب: الإجازات
      ══════════════════════════════════════════════════ */}
      {activeTab === 'leaves' && (
        <>
          <div className="toolbar">
            <span />
            <button className="btn btn-primary" onClick={() => setLeaveModal(true)}>
              + {lang === 'ar' ? 'طلب إجازة' : 'Request Leave'}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {leaveLoading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : leaves.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🏖️</div><p className="empty-state-text">{t('no_data')}</p></div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                      <th>{lang === 'ar' ? 'النوع' : 'Type'}</th>
                      <th>{lang === 'ar' ? 'من' : 'From'}</th>
                      <th>{lang === 'ar' ? 'إلى' : 'To'}</th>
                      <th>{t('status')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id}>
                        <td className="fw-semibold">{l.employee?.name || '—'}</td>
                        <td>{lang === 'ar' ? leaveTypeLabels[l.type]?.ar : leaveTypeLabels[l.type]?.en || l.type}</td>
                        <td className="text-muted">{fmtDate(l.start_date)}</td>
                        <td className="text-muted">{fmtDate(l.end_date)}</td>
                        <td><span className={`badge ${leaveStatusBadge(l.status)}`}>{l.status === 'pending' ? (lang === 'ar' ? 'معلق' : 'Pending') : l.status === 'approved' ? (lang === 'ar' ? 'موافق' : 'Approved') : (lang === 'ar' ? 'مرفوض' : 'Rejected')}</span></td>
                        <td>
                          {l.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-sm" style={{ background: 'var(--color-success)', color: '#fff' }} onClick={() => handleLeaveStatus(l.id, 'approved')}>✓</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleLeaveStatus(l.id, 'rejected')}>✕</button>
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

          {/* Modal: طلب إجازة */}
          {leaveModal && (
            <div className="modal-overlay" onClick={() => setLeaveModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">{lang === 'ar' ? 'طلب إجازة جديد' : 'New Leave Request'}</h3>
                  <button className="btn-icon" onClick={() => setLeaveModal(false)}>✕</button>
                </div>
                <form onSubmit={handleLeaveSubmit}>
                  <div className="modal-body">
                    <div className="form-grid form-grid-2">
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'الموظف' : 'Employee'} *</label>
                        <select className="input" value={leaveForm.employee_id} onChange={e => setLeaveForm({ ...leaveForm, employee_id: e.target.value })} required>
                          <option value="">{lang === 'ar' ? 'اختر موظف' : 'Select Employee'}</option>
                          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'نوع الإجازة' : 'Leave Type'}</label>
                        <select className="input" value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                          {Object.entries(leaveTypeLabels).map(([key, val]) => (
                            <option key={key} value={key}>{lang === 'ar' ? val.ar : val.en}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'من تاريخ' : 'From'} *</label>
                        <input className="input" type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'إلى تاريخ' : 'To'} *</label>
                        <input className="input" type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} required />
                      </div>
                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">{lang === 'ar' ? 'السبب' : 'Reason'}</label>
                        <textarea className="input" rows={2} value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} style={{ resize: 'vertical' }} />
                      </div>
                    </div>
                    {leaveErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {leaveErr}</div>}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setLeaveModal(false)}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={leaveSaving}>{leaveSaving ? t('loading') : t('save')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          تاب: الرواتب
      ══════════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div className="card" style={{ padding: 0 }}>
          {payLoading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : payroll.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">💵</div><p className="empty-state-text">{t('no_data')}</p></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                    <th>{lang === 'ar' ? 'الشهر' : 'Month'}</th>
                    <th>{lang === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}</th>
                    <th>{lang === 'ar' ? 'الخصومات' : 'Deductions'}</th>
                    <th>{lang === 'ar' ? 'صافي الراتب' : 'Net Salary'}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(p => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.employee?.name || '—'}</td>
                      <td className="text-muted">{p.month}</td>
                      <td>{fmt(p.basic_salary)}</td>
                      <td style={{ color: 'var(--color-danger)' }}>- {fmt(p.total_deductions)}</td>
                      <td className="fw-semibold" style={{ color: 'var(--color-success)' }}>{fmt(p.net_salary)}</td>
                      <td><span className={`badge ${payStatusBadge(p.status)}`}>{p.status === 'paid' ? (lang === 'ar' ? 'مدفوع' : 'Paid') : p.status === 'pending' ? (lang === 'ar' ? 'معلق' : 'Pending') : p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </ERPLayout>
  )
}
