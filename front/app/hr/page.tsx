'use client'

// ══════════════════════════════════════════════════════════
// app/hr/page.tsx — صفحة الموارد البشرية (محدّثة بالكامل)
// API: GET/POST /api/employees | DELETE /api/employees/{id}
//      GET/POST /api/attendance
//      GET/POST /api/leave-requests
//      POST /api/leave-requests/{id}/approve
//      POST /api/leave-requests/{id}/reject
//      GET /api/payroll
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui'
import { useI18n } from '../../lib/i18n'

type Employee     = { id: number; name: string; email: string; department?: string; position?: string; role?: string; status: string; hire_date: string; salary?: number; phone?: string }
type Attendance = { 
  id: number; 
  employee_id?: number;        
  employee?: { name: string }; 
  date: string; 
  check_in?: string; 
  check_out?: string; 
  status: string 
}
type LeaveRequest = { id: number; employee?: { name: string }; employee_id?: number; type: string; start_date: string; end_date: string; status: string; reason?: string; days?: number }
type Payroll = { 
  id: number; 
  employee?: { name: string }; 
  month: number;        
  year: number;         
  month_label?: string; 
  basic_salary: number; 
  deductions: number;        
  allowances?: number;       
  net_salary: number; 
  status: string 
}

const TABS = ['employees', 'attendance', 'leaves', 'payroll'] as const

// ── Validation helpers ──────────────────────────────────
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isValidPhone  = (phone: string) => !phone || /^[\d\s\+\-\(\)]{7,20}$/.test(phone)

export default function HRPage() {
  const { show, toasts, remove } = useToast()
  const { t, lang } = useI18n()
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('employees')

  // ── Employees ──────────────────────────────────────────
  const [employees, setEmployees]   = useState<Employee[]>([])
  const [empLoading, setEmpLoading] = useState(true)
  const [empSearch, setEmpSearch]   = useState('')
  const [empModal, setEmpModal]     = useState(false)
  const [empViewModal, setEmpViewModal] = useState<Employee | null>(null)
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [empSaving, setEmpSaving]   = useState(false)
  const [empErr, setEmpErr]         = useState('')
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null)
  const [empForm, setEmpForm]       = useState({
    name: '', email: '', phone: '', department: '', role: '', hire_date: '', salary: '',
  })

  // ── Attendance ─────────────────────────────────────────
  const [attendance, setAttendance]   = useState<Attendance[]>([])
  const [attLoading, setAttLoading]   = useState(true)
  const [attDate, setAttDate]         = useState('')
  const [checkInEmpId, setCheckInEmpId] = useState('')
  const [checkingIn, setCheckingIn]   = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [attMsg, setAttMsg]           = useState('')

  // ── Leave Requests ─────────────────────────────────────
  const [leaves, setLeaves]           = useState<LeaveRequest[]>([])
  const [leaveLoading, setLeaveLoading] = useState(true)
  const [leaveModal, setLeaveModal]   = useState(false)
  const [leaveViewModal, setLeaveViewModal] = useState<LeaveRequest | null>(null)
  const [leaveEditModal, setLeaveEditModal] = useState<LeaveRequest | null>(null)
  const [deleteLeaveId, setDeleteLeaveId] = useState<number | null>(null)
  const [leaveSaving, setLeaveSaving] = useState(false)
  const [leaveErr, setLeaveErr]       = useState('')
  const [leaveForm, setLeaveForm]     = useState({
    employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '',
  })

  // ── Payroll ────────────────────────────────────────────
  const [payroll, setPayroll]     = useState<Payroll[]>([])
  const [payLoading, setPayLoading] = useState(true)

  // ─── تحديد الموظف المتسجل check-in في اليوم ده ────────
  const todayCheckedIn = (empId: string) => {
    if (!empId) return false
    const today = new Date().toISOString().split('T')[0]
    return attendance.some(
      a => String(a.employee_id ?? '') === String(empId) && a.date?.startsWith(today) && a.check_in && !a.check_out
    )
  }

  // ─── Fetch Employees ───────────────────────────────────
  const fetchEmployees = async () => {
    setEmpLoading(true)
    const p = new URLSearchParams({ per_page: '50', ...(empSearch && { search: empSearch }) })
    const res = await api.get<{ data: Employee[] }>(`/employees?${p}`)
    if (res.data) setEmployees(extractArray(res.data))
    setEmpLoading(false)
  }

  // ─── Fetch Attendance ──────────────────────────────────
  const fetchAttendance = async () => {
    setAttLoading(true)
    const p = new URLSearchParams({ per_page: '50', ...(attDate && { date: attDate }) })
    const res = await api.get<{ data: Attendance[] }>(`/attendance?${p}`)
    if (res.data) setAttendance(extractArray(res.data))
    setAttLoading(false)
  }

  // ─── Fetch Leaves ──────────────────────────────────────
  const fetchLeaves = async () => {
    setLeaveLoading(true)
    const res = await api.get<{ data: LeaveRequest[] }>('/leave-requests?per_page=50')
    if (res.data) setLeaves(extractArray(res.data))
    setLeaveLoading(false)
  }

  // ─── Fetch Payroll ─────────────────────────────────────
  const fetchPayroll = async () => {
    setPayLoading(true)
    const res = await api.get('/payroll?per_page=50')
    // ✅ تصحيح: استخدام extractArray بدلاً من res.data?.data?.data
    if (res.data) setPayroll(extractArray(res.data))
    setPayLoading(false)
  }

  // ── تسجيل حضور ────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!checkInEmpId) {
      setAttMsg(lang === 'ar' ? '⚠️ اختر موظف أولاً' : '⚠️ Select employee first')
      return
    }
    setCheckingIn(true); setAttMsg('')
    const today = new Date().toISOString().split('T')[0]
    const now   = new Date().toTimeString().slice(0, 5)

    const res = await api.post('/attendance', {
      employee_id: Number(checkInEmpId),
      date: today,
      check_in: now,
      status: 'present',
    })
    setCheckingIn(false)
    if (res.error) { setAttMsg(`⚠️ ${res.error}`); return }
    setAttMsg(lang === 'ar' ? '✅ تم تسجيل الحضور' : '✅ Checked in successfully')
    fetchAttendance()
  }

  // ── تسجيل انصراف ───────────────────────────────────────
  const handleCheckOut = async () => {
    if (!checkInEmpId) {
      setAttMsg(lang === 'ar' ? '⚠️ اختر موظف أولاً' : '⚠️ Select employee first')
      return
    }
    // ✅ التحقق من أن الموظف check-in اليوم
    if (!todayCheckedIn(checkInEmpId)) {
      setAttMsg(lang === 'ar' ? '⚠️ هذا الموظف لم يسجل حضوره اليوم' : '⚠️ Employee has not checked in today')
      return
    }

    setCheckingOut(true); setAttMsg('')
    const today = new Date().toISOString().split('T')[0]
    const now   = new Date().toTimeString().slice(0, 5)

    const res = await api.post('/attendance', {
      employee_id: Number(checkInEmpId),
      date: today,
      check_out: now,
    })
    setCheckingOut(false)
    if (res.error) { setAttMsg(`⚠️ ${res.error}`); return }
    setAttMsg(lang === 'ar' ? '✅ تم تسجيل الانصراف' : '✅ Checked out successfully')
    fetchAttendance()
  }

  useEffect(() => {
    if (activeTab === 'employees')  fetchEmployees()
    if (activeTab === 'attendance') fetchAttendance()
    if (activeTab === 'leaves')     fetchLeaves()
    if (activeTab === 'payroll')    fetchPayroll()
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'employees') return
    const timer = setTimeout(() => fetchEmployees(), 400)
    return () => clearTimeout(timer)
  }, [empSearch])
  
  useEffect(() => { if (activeTab === 'attendance') fetchAttendance() }, [attDate])

  // ── إضافة/تعديل موظف ────────────────────────────────────────
  const handleEmpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setEmpErr('')

    if (!empForm.name.trim()) { setEmpErr(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required'); return }
    if (!empForm.email.trim()) { setEmpErr(lang === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required'); return }
    if (!isValidEmail(empForm.email)) { setEmpErr(lang === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address'); return }
    if (!isValidPhone(empForm.phone)) { setEmpErr(lang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number'); return }
    if (!empForm.role.trim()) { setEmpErr(lang === 'ar' ? 'المنصب مطلوب' : 'Position is required'); return }
    if (empForm.salary && Number(empForm.salary) < 0) { setEmpErr(lang === 'ar' ? 'الراتب لا يمكن أن يكون سالباً' : 'Salary cannot be negative'); return }

    setEmpSaving(true)
    const payload = {
      name:       empForm.name.trim(),
      email:      empForm.email.trim().toLowerCase(),
      phone:      empForm.phone.trim() || undefined,
      department: empForm.department.trim() || undefined,
      role:       empForm.role.trim(),
      hire_date:  empForm.hire_date || undefined,
      salary:     empForm.salary ? Number(empForm.salary) : 0,
    }

    let res
    if (editingEmpId) {
      // ✅ تعديل موظف موجود
      res = await api.put(`/employees/${editingEmpId}`, payload)
    } else {
      // ✅ إضافة موظف جديد
      res = await api.post('/employees', payload)
    }

    setEmpSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(editingEmpId ? (lang === 'ar' ? 'تم تحديث الموظف ✅' : 'Employee updated ✅') : (lang === 'ar' ? 'تم إضافة الموظف ✅' : 'Employee added ✅'))
    setEmpModal(false)
    setEditingEmpId(null)
    setEmpForm({ name: '', email: '', phone: '', department: '', role: '', hire_date: '', salary: '' })
    fetchEmployees()
  }

  // ✅ فتح modal التعديل بالبيانات الموجودة
  const openEditEmp = (emp: Employee) => {
    setEditingEmpId(emp.id)
    setEmpForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      department: emp.department || '',
      role: emp.role || emp.position || '',
      hire_date: emp.hire_date,
      salary: emp.salary ? String(emp.salary) : '',
    })
    setEmpErr('')
    setEmpModal(true)
  }

  // ✅ فتح modal العرض
  const openViewEmp = (emp: Employee) => {
    setEmpViewModal(emp)
  }

  // ✅ Soft Delete
  const handleEmpDelete = async () => {
    if (!deleteId) return
    const res = await api.delete(`/employees/${deleteId}`)
    if (res.error) { show(res.error, 'error'); setDeleteId(null); return }
    show(lang === 'ar' ? 'تم حذف الموظف' : 'Employee deleted')
    setDeleteId(null)
    setEmployees(prev => prev.filter(e => e.id !== deleteId))
  }

  // ── طلب إجازة / تعديل إجازة ──────────────────────────────────────────
  const handleLeaveSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLeaveErr('')

    if (!leaveForm.employee_id) { setLeaveErr(lang === 'ar' ? 'اختر الموظف' : 'Select an employee'); return }
    if (!leaveForm.start_date)  { setLeaveErr(lang === 'ar' ? 'تاريخ البداية مطلوب' : 'Start date is required'); return }
    if (!leaveForm.end_date)    { setLeaveErr(lang === 'ar' ? 'تاريخ النهاية مطلوب' : 'End date is required'); return }

    if (new Date(leaveForm.end_date) < new Date(leaveForm.start_date)) {
      setLeaveErr(lang === 'ar' ? 'تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية' : 'End date cannot be before start date')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    if (leaveForm.start_date < today && !leaveEditModal) {
      setLeaveErr(lang === 'ar' ? 'لا يمكن طلب إجازة في تاريخ ماضي' : 'Cannot request leave for a past date')
      return
    }

    setLeaveSaving(true)
    const payload = {
      employee_id: Number(leaveForm.employee_id),
      type:        leaveForm.type,
      start_date:  leaveForm.start_date,
      end_date:    leaveForm.end_date,
      reason:      leaveForm.reason.trim() || undefined,
    }

    let res
    if (leaveEditModal) {
      // ✅ تعديل إجازة موجودة
      res = await api.put(`/leave-requests/${leaveEditModal.id}`, payload)
    } else {
      // ✅ تقديم إجازة جديدة
      res = await api.post('/leave-requests', payload)
    }

    setLeaveSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(leaveEditModal ? (lang === 'ar' ? 'تم تحديث طلب الإجازة ✅' : 'Leave request updated ✅') : (lang === 'ar' ? 'تم تقديم طلب الإجازة ✅' : 'Leave request submitted ✅'))
    setLeaveModal(false)
    setLeaveEditModal(null)
    setLeaveForm({ employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' })
    fetchLeaves()
  }

  // ✅ فتح modal التعديل للإجازة
  const openEditLeave = (leave: LeaveRequest) => {
    if (leave.status !== 'pending') {
      show(lang === 'ar' ? 'لا يمكن تعديل إجازة تم حسمها' : 'Cannot edit approved/rejected leave', 'error')
      return
    }
    setLeaveEditModal(leave)
    setLeaveForm({
      employee_id: String(leave.employee_id || ''),
      type: leave.type,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason || '',
    })
    setLeaveErr('')
    setLeaveModal(true)
  }

  // ✅ فتح modal العرض للإجازة
  const openViewLeave = (leave: LeaveRequest) => {
    setLeaveViewModal(leave)
  }

  // ✅ حذف إجازة
  const handleLeaveDelete = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) return
    const res = await api.delete(`/leave-requests/${id}`)
    if (res.error) { show(res.error, 'error'); return }
    show(lang === 'ar' ? 'تم حذف طلب الإجازة' : 'Leave request deleted')
    setLeaves(prev => prev.filter(l => l.id !== id))
  }

  // ✅ الموافقة على الإجازة
  const handleLeaveApprove = async (id: number) => {
    const res = await api.post(`/leave-requests/${id}/approve`, {})
    if (res.error) { show(res.error, 'error'); return }
    show(lang === 'ar' ? 'تمت الموافقة ✅' : 'Leave approved ✅')
    fetchLeaves()
  }

  // ✅ رفض الإجازة
  const handleLeaveReject = async (id: number) => {
    const res = await api.post(`/leave-requests/${id}/reject`, {})
    if (res.error) { show(res.error, 'error'); return }
    show(lang === 'ar' ? 'تم الرفض' : 'Leave rejected', 'error')
    fetchLeaves()
  }

  // ── Helpers ────────────────────────────────────────────
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'
  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtCurrency = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(n || 0)

  const monthNames = lang === 'ar' 
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['January','February','March','April','May','June','July','August','September','October','November','December']

  const leaveTypeLabels: Record<string, { ar: string; en: string }> = {
    annual:    { ar: 'سنوية',     en: 'Annual' },
    sick:      { ar: 'مرضية',     en: 'Sick' },
    emergency: { ar: 'طارئة',     en: 'Emergency' },
    unpaid:    { ar: 'بدون راتب', en: 'Unpaid' },
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

  const ar = (text: string) => lang === 'ar' ? text : undefined

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
                placeholder={lang === 'ar' ? 'بحث بالاسم أو القسم...' : 'Search by name or department...'}
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingEmpId(null); setEmpErr(''); setEmpForm({ name: '', email: '', phone: '', department: '', role: '', hire_date: '', salary: '' }); setEmpModal(true) }}>
              + {lang === 'ar' ? 'موظف جديد' : 'New Employee'}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {empLoading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : employees.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <p className="empty-state-text">{t('no_data')}</p>
              </div>
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
                        <td>{emp.role || emp.position || '—'}</td>
                        <td>{emp.salary ? fmtCurrency(emp.salary) : '—'}</td>
                        <td className="text-muted">{fmtDate(emp.hire_date)}</td>
                        <td>
                          <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                            {emp.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {/* ✅ زر View */}
                            <button className="btn btn-info btn-sm" onClick={() => openViewEmp(emp)} title={lang === 'ar' ? 'عرض' : 'View'}>
                              👁️
                            </button>
                            {/* ✅ زر Edit */}
                            <button className="btn btn-secondary btn-sm" onClick={() => openEditEmp(emp)} title={lang === 'ar' ? 'تعديل' : 'Edit'}>
                              ✏️
                            </button>
                            {/* ✅ زر Delete */}
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(emp.id)} title={lang === 'ar' ? 'حذف' : 'Delete'}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal: إضافة/تعديل موظف */}
          {empModal && (
            <div className="modal-overlay" onClick={() => setEmpModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">{editingEmpId ? (lang === 'ar' ? 'تعديل الموظف' : 'Edit Employee') : (lang === 'ar' ? 'موظف جديد' : 'New Employee')}</h3>
                  <button className="btn-icon" onClick={() => { setEmpModal(false); setEditingEmpId(null) }}>✕</button>
                </div>
                <form onSubmit={handleEmpSubmit}>
                  <div className="modal-body">
                    <div className="form-grid form-grid-2">

                      {/* الاسم */}
                      <div className="input-group">
                        <label className="input-label">
                          {t('name')} <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <input
                          className="input"
                          placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'}
                          value={empForm.name}
                          onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                        />
                      </div>

                      {/* الإيميل */}
                      <div className="input-group">
                        <label className="input-label">
                          {t('email')} <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <input
                          className="input"
                          type="email"
                          placeholder="example@company.com"
                          value={empForm.email}
                          onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                          style={{ borderColor: empForm.email && !isValidEmail(empForm.email) ? 'var(--color-danger)' : undefined }}
                        />
                        {empForm.email && !isValidEmail(empForm.email) && (
                          <span style={{ color: 'var(--color-danger)', fontSize: '0.78rem' }}>
                            {lang === 'ar' ? '⚠️ صيغة البريد غير صحيحة' : '⚠️ Invalid email format'}
                          </span>
                        )}
                      </div>

                      {/* الهاتف */}
                      <div className="input-group">
                        <label className="input-label">{t('phone')}</label>
                        <input
                          className="input"
                          placeholder="+20 1XX XXX XXXX"
                          value={empForm.phone}
                          onChange={e => setEmpForm({ ...empForm, phone: e.target.value })}
                          style={{ borderColor: empForm.phone && !isValidPhone(empForm.phone) ? 'var(--color-danger)' : undefined }}
                        />
                        {empForm.phone && !isValidPhone(empForm.phone) && (
                          <span style={{ color: 'var(--color-danger)', fontSize: '0.78rem' }}>
                            {lang === 'ar' ? '⚠️ رقم الهاتف غير صحيح' : '⚠️ Invalid phone number'}
                          </span>
                        )}
                      </div>

                      {/* الراتب */}
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'الراتب' : 'Salary'}</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={empForm.salary}
                          onChange={e => setEmpForm({ ...empForm, salary: e.target.value })}
                        />
                      </div>

                      {/* القسم */}
                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'القسم' : 'Department'}</label>
                        <input
                          className="input"
                          placeholder={lang === 'ar' ? 'مثال: المحاسبة' : 'e.g. Accounting'}
                          value={empForm.department}
                          onChange={e => setEmpForm({ ...empForm, department: e.target.value })}
                        />
                      </div>

                      {/* المنصب */}
                      <div className="input-group">
                        <label className="input-label">
                          {lang === 'ar' ? 'المنصب' : 'Position'} <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <input
                          className="input"
                          placeholder={lang === 'ar' ? 'مثال: محاسب أول' : 'e.g. Senior Accountant'}
                          value={empForm.role}
                          onChange={e => setEmpForm({ ...empForm, role: e.target.value })}
                        />
                      </div>

                      {/* تاريخ التعيين */}
                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">{lang === 'ar' ? 'تاريخ التعيين' : 'Hire Date'}</label>
                        <input
                          className="input"
                          type="date"
                          max={new Date().toISOString().split('T')[0]}
                          value={empForm.hire_date}
                          onChange={e => setEmpForm({ ...empForm, hire_date: e.target.value })}
                          style={{ width: 'auto' }}
                        />
                      </div>
                    </div>

                    {empErr && (
                      <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem', background: 'rgba(239,68,68,0.08)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                        ⚠️ {empErr}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setEmpModal(false); setEditingEmpId(null) }}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={empSaving}>
                      {empSaving ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                          {t('loading')}
                        </span>
                      ) : t('save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: عرض موظف */}
          {empViewModal && (
            <div className="modal-overlay" onClick={() => setEmpViewModal(null)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <div className="modal-header">
                  <h3 className="modal-title">{lang === 'ar' ? 'بيانات الموظف' : 'Employee Details'}</h3>
                  <button className="btn-icon" onClick={() => setEmpViewModal(null)}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('name')}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{empViewModal.name}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('email')}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{empViewModal.email}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('phone')}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{empViewModal.phone || '—'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'المنصب' : 'Position'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{empViewModal.role || empViewModal.position || '—'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'القسم' : 'Department'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{empViewModal.department || '—'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'الراتب' : 'Salary'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500, color: 'var(--color-success)' }}>{empViewModal.salary ? fmtCurrency(empViewModal.salary) : '—'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'تاريخ التعيين' : 'Hire Date'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{fmtDate(empViewModal.hire_date)}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('status')}</label>
                      <p style={{ margin: '0.25rem 0 0' }}>
                        <span className={`badge ${empViewModal.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                          {empViewModal.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setEmpViewModal(null)}>{t('close')}</button>
                  <button className="btn btn-primary" onClick={() => { openEditEmp(empViewModal); setEmpViewModal(null) }}>
                    {lang === 'ar' ? '✏️ تعديل' : '✏️ Edit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* تأكيد الحذف */}
          {deleteId && (
            <div className="modal-overlay" onClick={() => setDeleteId(null)}>
              <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>{t('confirm_delete')}</h3>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    {lang === 'ar'
                      ? 'سيتم حذف الموظف وسيبقى الحضور والرواتب السابقة محفوظة.'
                      : 'The employee will be removed. Past attendance & payroll records will be preserved.'}
                  </p>
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
                <select
                  className="input"
                  value={checkInEmpId}
                  onChange={e => { setCheckInEmpId(e.target.value); setAttMsg('') }}
                >
                  <option value="">{lang === 'ar' ? 'اختر موظف...' : 'Select employee...'}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* ✅ الأزرار */}
              <button
                className="btn btn-primary"
                onClick={handleCheckIn}
                disabled={checkingIn || !checkInEmpId}
                style={{ minWidth: 140, opacity: !checkInEmpId ? 0.5 : 1 }}
              >
                {checkingIn
                  ? <span>⏳ {lang === 'ar' ? 'جاري...' : 'Loading...'}</span>
                  : (lang === 'ar' ? '✅ تسجيل حضور' : '✅ Check In')}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleCheckOut}
                disabled={checkingOut || !checkInEmpId}
                style={{ minWidth: 140, opacity: !checkInEmpId ? 0.5 : 1 }}
              >
                {checkingOut
                  ? <span>⏳ {lang === 'ar' ? 'جاري...' : 'Loading...'}</span>
                  : (lang === 'ar' ? '🚪 تسجيل انصراف' : '🚪 Check Out')}
              </button>
            </div>

            {attMsg && (
              <p style={{
                marginTop: '0.6rem', fontSize: '0.85rem',
                color: attMsg.startsWith('✅') ? 'var(--color-success)' : 'var(--color-danger)',
              }}>
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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {attDate && (
                <button className="btn btn-secondary btn-sm" onClick={() => setAttDate('')}>
                  {lang === 'ar' ? '× مسح الفلتر' : '× Clear filter'}
                </button>
              )}
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                {lang === 'ar' ? `${attendance.length} سجل` : `${attendance.length} records`}
              </span>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {attLoading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : attendance.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <p className="empty-state-text">{t('no_data')}</p>
              </div>
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
                        <td>{a.check_in ? String(a.check_in).slice(0, 5) : '—'}</td>
                        <td>{a.check_out ? String(a.check_out).slice(0, 5) : '—'}</td>
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
            <button className="btn btn-primary" onClick={() => { setLeaveEditModal(null); setLeaveErr(''); setLeaveForm({ employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' }); setLeaveModal(true) }}>
              + {lang === 'ar' ? 'طلب إجازة' : 'Request Leave'}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {leaveLoading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : leaves.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏖️</div>
                <p className="empty-state-text">{t('no_data')}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                      <th>{lang === 'ar' ? 'النوع' : 'Type'}</th>
                      <th>{lang === 'ar' ? 'من' : 'From'}</th>
                      <th>{lang === 'ar' ? 'إلى' : 'To'}</th>
                      <th>{lang === 'ar' ? 'الأيام' : 'Days'}</th>
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
                        <td>{l.days ?? '—'}</td>
                        <td>
                          <span className={`badge ${leaveStatusBadge(l.status)}`}>
                            {l.status === 'pending'  ? (lang === 'ar' ? 'معلق'   : 'Pending')
                           : l.status === 'approved' ? (lang === 'ar' ? 'موافق'  : 'Approved')
                           :                           (lang === 'ar' ? 'مرفوض'  : 'Rejected')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {/* ✅ زر View */}
                            <button className="btn btn-info btn-sm" onClick={() => openViewLeave(l)} title={lang === 'ar' ? 'عرض' : 'View'}>
                              👁️
                            </button>
                            
                            {/* ✅ زر Edit — فقط للـ pending */}
                            {l.status === 'pending' && (
                              <button className="btn btn-secondary btn-sm" onClick={() => openEditLeave(l)} title={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                ✏️
                              </button>
                            )}

                            {/* ✅ زر Approve */}
                            {l.status === 'pending' && (
                              <button
                                className="btn btn-sm"
                                style={{ background: 'var(--color-success)', color: '#fff' }}
                                onClick={() => handleLeaveApprove(l.id)}
                                title={lang === 'ar' ? 'موافقة' : 'Approve'}
                              >✓</button>
                            )}

                            {/* ✅ زر Reject */}
                            {l.status === 'pending' && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleLeaveReject(l.id)}
                                title={lang === 'ar' ? 'رفض' : 'Reject'}
                              >✕</button>
                            )}

                            {/* ✅ زر Delete */}
                            <button className="btn btn-danger btn-sm" onClick={() => handleLeaveDelete(l.id)} title={lang === 'ar' ? 'حذف' : 'Delete'}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal: عرض إجازة */}
          {leaveViewModal && (
            <div className="modal-overlay" onClick={() => setLeaveViewModal(null)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                <div className="modal-header">
                  <h3 className="modal-title">{lang === 'ar' ? 'بيانات الإجازة' : 'Leave Request Details'}</h3>
                  <button className="btn-icon" onClick={() => setLeaveViewModal(null)}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'الموظف' : 'Employee'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{leaveViewModal.employee?.name || '—'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'النوع' : 'Type'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{lang === 'ar' ? leaveTypeLabels[leaveViewModal.type]?.ar : leaveTypeLabels[leaveViewModal.type]?.en || leaveViewModal.type}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'من' : 'From'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{fmtDate(leaveViewModal.start_date)}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'إلى' : 'To'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{fmtDate(leaveViewModal.end_date)}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'عدد الأيام' : 'Days'}</label>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 500 }}>{leaveViewModal.days ?? '—'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('status')}</label>
                      <p style={{ margin: '0.25rem 0 0' }}>
                        <span className={`badge ${leaveStatusBadge(leaveViewModal.status)}`}>
                          {leaveViewModal.status === 'pending'  ? (lang === 'ar' ? 'معلق'   : 'Pending')
                         : leaveViewModal.status === 'approved' ? (lang === 'ar' ? 'موافق'  : 'Approved')
                         :                                       (lang === 'ar' ? 'مرفوض'  : 'Rejected')}
                        </span>
                      </p>
                    </div>
                    {leaveViewModal.reason && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{lang === 'ar' ? 'السبب' : 'Reason'}</label>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', color: '#4b5563' }}>{leaveViewModal.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setLeaveViewModal(null)}>{t('close')}</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: طلب إجازة جديد / تعديل */}
          {leaveModal && (
            <div className="modal-overlay" onClick={() => { setLeaveModal(false); setLeaveEditModal(null) }}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">{leaveEditModal ? (lang === 'ar' ? 'تعديل الإجازة' : 'Edit Leave') : (lang === 'ar' ? 'طلب إجازة جديد' : 'New Leave Request')}</h3>
                  <button className="btn-icon" onClick={() => { setLeaveModal(false); setLeaveEditModal(null) }}>✕</button>
                </div>
                <form onSubmit={handleLeaveSubmit}>
                  <div className="modal-body">
                    <div className="form-grid form-grid-2">
                      <div className="input-group">
                        <label className="input-label">
                          {lang === 'ar' ? 'الموظف' : 'Employee'} <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <select
                          className="input"
                          value={leaveForm.employee_id}
                          onChange={e => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
                          disabled={!!leaveEditModal}
                        >
                          <option value="">{lang === 'ar' ? 'اختر موظف' : 'Select Employee'}</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="input-label">{lang === 'ar' ? 'نوع الإجازة' : 'Leave Type'}</label>
                        <select
                          className="input"
                          value={leaveForm.type}
                          onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                        >
                          {Object.entries(leaveTypeLabels).map(([key, val]) => (
                            <option key={key} value={key}>{lang === 'ar' ? val.ar : val.en}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="input-label">
                          {lang === 'ar' ? 'من تاريخ' : 'From'} <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <input
                          className="input"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={leaveForm.start_date}
                          onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value, end_date: leaveForm.end_date < e.target.value ? e.target.value : leaveForm.end_date })}
                        />
                      </div>

                      <div className="input-group">
                        <label className="input-label">
                          {lang === 'ar' ? 'إلى تاريخ' : 'To'} <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <input
                          className="input"
                          type="date"
                          min={leaveForm.start_date || new Date().toISOString().split('T')[0]}
                          value={leaveForm.end_date}
                          onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                        />
                      </div>

                      {leaveForm.start_date && leaveForm.end_date && (
                        <div style={{ gridColumn: '1 / -1', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          📅 {lang === 'ar' ? 'عدد الأيام:' : 'Days:'}{' '}
                          {Math.max(1, Math.floor((new Date(leaveForm.end_date).getTime() - new Date(leaveForm.start_date).getTime()) / 86400000) + 1)}
                        </div>
                      )}

                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">{lang === 'ar' ? 'السبب' : 'Reason'}</label>
                        <textarea
                          className="input"
                          rows={2}
                          placeholder={lang === 'ar' ? 'اذكر سبب الإجازة (اختياري)' : 'State the reason (optional)'}
                          value={leaveForm.reason}
                          onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                    </div>

                    {leaveErr && (
                      <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem', background: 'rgba(239,68,68,0.08)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                        ⚠️ {leaveErr}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setLeaveModal(false); setLeaveEditModal(null) }}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={leaveSaving}>
                      {leaveSaving ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                          {t('loading')}
                        </span>
                      ) : t('save')}
                    </button>
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
            <div className="empty-state">
              <div className="empty-state-icon">💵</div>
              <p className="empty-state-text">{t('no_data')}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                    <th>{lang === 'ar' ? 'الشهر' : 'Month'}</th>
                    <th>{lang === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}</th>
                    <th>{lang === 'ar' ? 'البدلات' : 'Allowances'}</th>
                    <th>{lang === 'ar' ? 'الخصومات' : 'Deductions'}</th>
                    <th>{lang === 'ar' ? 'صافي الراتب' : 'Net Salary'}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(p => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.employee?.name || '—'}</td>
                      <td className="text-muted">
                        {p.month_label ?? `${monthNames[p.month - 1]} ${p.year}`}
                      </td>
                      <td>{fmt(p.basic_salary)}</td>
                      <td style={{ color: 'var(--color-success)' }}>+{fmt(p.allowances || 0)}</td>
                      <td style={{ color: 'var(--color-danger)' }}>-{fmt(p.deductions || 0)}</td>
                      <td className="fw-semibold" style={{ color: 'var(--color-success)' }}>{fmt(p.net_salary)}</td>
                      <td>
                        <span className={`badge ${payStatusBadge(p.status)}`}>
                          {p.status === 'paid'    ? (lang === 'ar' ? 'مدفوع'   : 'Paid')
                         : p.status === 'pending' ? (lang === 'ar' ? 'معلق'    : 'Pending')
                         :                          p.status}
                        </span>
                      </td>
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