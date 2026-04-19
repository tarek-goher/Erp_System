'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../hooks/useToast'

type Employee   = { id: number; name: string; department?: string; position?: string }
type Template   = { id: number; name: string; name_ar: string; criteria: Criterion[] }
type Criterion  = { key: string; label: string; label_ar: string; weight: number }
type Goal = {
  id: number; employee_id: number; title: string; title_ar?: string
  target: number; current: number; unit: string; due_date?: string; status: 'on_track' | 'at_risk' | 'completed' | 'overdue'
}
type Feedback360 = {
  id: number; appraisal_id: number; from_employee_id: number; from_name: string
  relation: 'self' | 'peer' | 'manager' | 'subordinate'
  scores: Record<string, number>; comments: string; submitted_at?: string
}
type Appraisal  = {
  id: number
  employee?: Employee
  reviewer?: { name: string }
  template?: Template
  period: string
  score?: number
  feedback?: string
  goals?: string
  criteria_scores?: Record<string, number>
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  approval_chain?: ApprovalStep[]
  linked_promotion?: boolean
  linked_raise?: number
  reviewed_at?: string
  created_at: string
}
type ApprovalStep = { level: number; approver_name: string; status: 'pending' | 'approved' | 'rejected'; date?: string }
type Stats = { total: number; draft: number; submitted: number; approved: number; rejected: number; avg_score: number }

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-muted', submitted: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger',
}
const STATUS_LABEL_AR: Record<string, string> = {
  draft: 'مسودة', submitted: 'بانتظار المراجعة', approved: 'معتمد', rejected: 'مرفوض',
}

export default function AppraisalsPage() {
  const { lang } = useI18n()
  const { show: toast } = useToast?.() ?? { show: () => {} }
  const ar = lang === 'ar'

  const [isMounted, setIsMounted] = useState(false)
  const [tab, setTab] = useState<'appraisals' | 'goals' | 'feedback360'>('appraisals')
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [employees,  setEmployees]  = useState<Employee[]>([])
  const [templates,  setTemplates]  = useState<Template[]>([])
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [periods,    setPeriods]    = useState<string[]>([])
  const [goals,      setGoals]      = useState<Goal[]>([])
  const [feedback360List, setFeedback360List] = useState<Feedback360[]>([])
  const [loading,    setLoading]    = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [modal,        setModal]        = useState(false)
  const [viewModal,    setViewModal]    = useState<Appraisal | null>(null)
  const [rejectModal,  setRejectModal]  = useState<Appraisal | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<Appraisal | null>(null)
  const [goalModal,    setGoalModal]    = useState(false)
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    employee_id: '', period: '', template_id: '', score: '', feedback: '', goals: '',
    linked_promotion: false, linked_raise: '',
  })

  const [feedbackForm, setFeedbackForm] = useState({
    from_employee_id: '', relation: 'peer', scores: {} as Record<string, number>, comments: '',
  })

  const [goalForm, setGoalForm] = useState({
    employee_id: '', title: '', target: '', unit: '', due_date: '',
  })

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), per_page: '15',
      ...(statusFilter && { status: statusFilter }),
      ...(periodFilter && { period: periodFilter }),
    })
    const [aRes, sRes, pRes, eRes, tRes] = await Promise.all([
      api.get<{ data: Appraisal[]; total: number }>(`/appraisals?${params}`),
      api.get<Stats>('/appraisals/stats'),
      api.get<string[]>('/appraisals/periods'),
      employees.length === 0 ? api.get<{ data: Employee[] }>('/employees?per_page=200') : Promise.resolve(null),
      templates.length === 0 ? api.get<Template[]>('/appraisals/templates') : Promise.resolve(null),
    ])
    if (aRes.data)  { setAppraisals(extractArray(aRes.data)); setTotal((aRes.data as any).total || 0) }
    if (sRes.data)  setStats(sRes.data)
    if (pRes?.data) setPeriods(extractArray(pRes.data))
    if (eRes?.data) setEmployees(extractArray(eRes.data))
    if (tRes?.data) setTemplates(extractArray(tRes.data))
    setLoading(false)
  }

  const fetchGoals = async () => {
    const res = await api.get<Goal[]>('/appraisals/goals')
    if (res.data) setGoals(extractArray(res.data))
  }

  const fetchFeedback360 = async (appraisalId?: number) => {
    const url = appraisalId ? `/appraisals/${appraisalId}/360-feedback` : '/appraisals/360-feedback'
    const res = await api.get<Feedback360[]>(url)
    if (res.data) setFeedback360List(extractArray(res.data))
  }

  useEffect(() => { setIsMounted(true) }, [])
  useEffect(() => { fetchData() }, [page, statusFilter, periodFilter])
  useEffect(() => { if (tab === 'goals') fetchGoals() }, [tab])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.employee_id || !form.period) return
    setSaving(true)
    const res = await api.post('/appraisals', {
      employee_id: Number(form.employee_id),
      period: form.period,
      template_id: form.template_id ? Number(form.template_id) : undefined,
      score: form.score ? Number(form.score) : undefined,
      feedback: form.feedback || undefined,
      goals: form.goals || undefined,
      linked_promotion: form.linked_promotion,
      linked_raise: form.linked_raise ? Number(form.linked_raise) : undefined,
    })
    setSaving(false)
    if (!res.error) {
      setModal(false)
      setForm({ employee_id: '', period: '', template_id: '', score: '', feedback: '', goals: '', linked_promotion: false, linked_raise: '' })
      fetchData()
    }
  }

  const submitAppraisal  = async (id: number) => { const r = await api.post(`/appraisals/${id}/submit`);  if (!r.error) fetchData() }
  const approveAppraisal = async (id: number) => { const r = await api.post(`/appraisals/${id}/approve`); if (!r.error) { fetchData(); setViewModal(null) } }
  const rejectAppraisal  = async () => {
    if (!rejectModal) return; setSaving(true)
    const r = await api.post(`/appraisals/${rejectModal.id}/reject`, { feedback: rejectFeedback })
    setSaving(false); if (!r.error) { setRejectModal(null); setRejectFeedback(''); fetchData() }
  }

  const submitFeedback360 = async (e: FormEvent) => {
    e.preventDefault()
    if (!feedbackModal) return; setSaving(true)
    const r = await api.post(`/appraisals/${feedbackModal.id}/360-feedback`, feedbackForm)
    setSaving(false)
    if (!r.error) { setFeedbackModal(null); setFeedbackForm({ from_employee_id: '', relation: 'peer', scores: {}, comments: '' }) }
  }

  const handleGoalSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true)
    const r = await api.post('/appraisals/goals', { ...goalForm, target: Number(goalForm.target), employee_id: Number(goalForm.employee_id) })
    setSaving(false); if (!r.error) { setGoalModal(false); fetchGoals() }
  }

  const updateGoalProgress = async (goalId: number, current: number) => {
    await api.patch(`/appraisals/goals/${goalId}`, { current })
    fetchGoals()
  }

  const deleteAppraisal = async (id: number) => {
    if (!confirm(ar ? 'حذف التقييم؟' : 'Delete appraisal?')) return
    await api.delete(`/appraisals/${id}`); fetchData()
  }

  const scoreColor = (s?: number) => {
    if (!s) return '#94a3b8'; if (s >= 80) return '#16a34a'; if (s >= 60) return '#d97706'; return '#dc2626'
  }

  const goalStatusColor = (s: Goal['status']) => ({ on_track: '#16a34a', at_risk: '#d97706', completed: '#2563eb', overdue: '#dc2626' }[s])

  return (
    <ERPLayout pageTitle={ar ? 'تقييم الأداء' : 'Performance Appraisals'}>
      
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        {tab === 'goals' && <button className="btn btn-primary" onClick={() => setGoalModal(true)}>+ {ar ? 'هدف جديد' : 'New Goal'}</button>}
        {tab === 'appraisals' && <button className="btn btn-primary" onClick={() => setModal(true)}>+ {ar ? 'تقييم جديد' : 'New Appraisal'}</button>}
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab ${tab === 'appraisals' ? 'active' : ''}`} onClick={() => setTab('appraisals')}>
          {ar ? '📋 التقييمات' : '📋 Appraisals'}
        </button>
        <button className={`tab ${tab === 'goals' ? 'active' : ''}`} onClick={() => setTab('goals')}>
          {ar ? '🎯 الأهداف' : '🎯 Goals'}
        </button>
        <button className={`tab ${tab === 'feedback360' ? 'active' : ''}`} onClick={() => setTab('feedback360')}>
          {ar ? '🔄 تقييم 360°' : '🔄 360° Feedback'}
        </button>
      </div>

      {tab === 'appraisals' && (
        <>
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                { label: ar ? 'الإجمالي' : 'Total',       value: stats.total,     color: 'var(--color-primary)' },
                { label: ar ? 'مسودة' : 'Draft',           value: stats.draft,     color: 'var(--text-muted)' },
                { label: ar ? 'بانتظار' : 'Submitted',     value: stats.submitted, color: 'var(--color-warning)' },
                { label: ar ? 'معتمد' : 'Approved',        value: stats.approved,  color: 'var(--color-success)' },
                { label: ar ? 'متوسط الدرجة' : 'Avg Score', value: `${stats.avg_score}%`, color: '#7c3aed' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: '1rem', borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="toolbar">
            <div className="toolbar-actions">
              <select className="input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
                <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
                {Object.entries(STATUS_LABEL_AR).map(([k, v]) => <option key={k} value={k}>{ar ? v : k}</option>)}
              </select>
              <select className="input" value={periodFilter} onChange={e => { setPeriodFilter(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
                <option value="">{ar ? 'كل الفترات' : 'All Periods'}</option>
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div>
             : appraisals.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📋</div><p className="empty-state-text">{ar ? 'لا توجد تقييمات' : 'No appraisals found'}</p></div>
             : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{ar ? 'الموظف' : 'Employee'}</th>
                      <th>{ar ? 'الفترة' : 'Period'}</th>
                      <th>{ar ? 'النموذج' : 'Template'}</th>
                      <th>{ar ? 'الدرجة' : 'Score'}</th>
                      <th>{ar ? 'الحالة' : 'Status'}</th>
                      <th>{ar ? 'الترقية/الزيادة' : 'Promo/Raise'}</th>
                      <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appraisals.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.employee?.name || '—'}</div>
                          {a.employee?.department && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{a.employee.department}</div>}
                        </td>
                        <td><span className="badge badge-info">{a.period}</span></td>
                        <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.template?.name_ar || a.template?.name || '—'}</span></td>
                        <td>
                          {a.score != null
                            ? <span style={{ fontWeight: 700, color: scoreColor(a.score), fontSize: '1.1rem' }}>{a.score}%</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[a.status]}`}>{ar ? STATUS_LABEL_AR[a.status] : a.status}</span>
                          {a.approval_chain && (
                            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                              {a.approval_chain.map((step, i) => (
                                <div key={i} title={step.approver_name} style={{
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: step.status === 'approved' ? '#16a34a' : step.status === 'rejected' ? '#dc2626' : '#d97706',
                                }} />
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          {a.linked_promotion && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>⬆️ {ar ? 'ترقية' : 'Promo'}</span>}
                          {a.linked_raise && <span className="badge badge-info" style={{ fontSize: '0.7rem', marginRight: 4 }}>+{a.linked_raise}%</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => setViewModal(a)}>{ar ? 'عرض' : 'View'}</button>
                            {a.status === 'submitted' && (
                              <button className="btn btn-sm btn-primary" onClick={() => { setFeedbackModal(a); fetchFeedback360(a.id) }}>360°</button>
                            )}
                            {a.status === 'draft' && <button className="btn btn-sm btn-primary" onClick={() => submitAppraisal(a.id)}>{ar ? 'إرسال' : 'Submit'}</button>}
                            {a.status === 'submitted' && (
                              <>
                                <button className="btn btn-sm btn-success" onClick={() => approveAppraisal(a.id)}>{ar ? 'اعتماد' : 'Approve'}</button>
                                <button className="btn btn-sm btn-danger" onClick={() => { setRejectModal(a); setRejectFeedback('') }}>{ar ? 'رفض' : 'Reject'}</button>
                              </>
                            )}
                            {a.status === 'draft' && <button className="btn btn-sm btn-danger" onClick={() => deleteAppraisal(a.id)}>{ar ? 'حذف' : 'Delete'}</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {total > 15 && (
            <div className="sales-pagination" style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>{ar ? 'السابق' : 'Prev'}</button>
              <span className="text-muted">{ar ? `صفحة ${page}` : `Page ${page}`}</span>
              <button className="btn btn-secondary btn-sm" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>{ar ? 'التالي' : 'Next'}</button>
            </div>
          )}
        </>
      )}

      {tab === 'goals' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'الموظف' : 'Employee'}</th>
                  <th>{ar ? 'الهدف' : 'Goal'}</th>
                  <th>{ar ? 'التقدم' : 'Progress'}</th>
                  <th>{ar ? 'الوحدة' : 'Unit'}</th>
                  <th>{ar ? 'تاريخ الانتهاء' : 'Due Date'}</th>
                  <th>{ar ? 'الحالة' : 'Status'}</th>
                  <th>{ar ? 'تحديث' : 'Update'}</th>
                </tr>
              </thead>
              <tbody>
                {goals.map(g => {
                  const pct = Math.min(100, Math.round((g.current / g.target) * 100))
                  return (
                    <tr key={g.id}>
                      <td>{employees.find(e => e.id === g.employee_id)?.name || g.employee_id}</td>
                      <td style={{ fontWeight: 600 }}>{g.title}</td>
                      <td style={{ minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: goalStatusColor(g.status), borderRadius: 999, transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: goalStatusColor(g.status) }}>{pct}%</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{g.current} / {g.target}</div>
                      </td>
                      <td>{g.unit}</td>
                      <td>{g.due_date ? new Date(g.due_date).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                      <td>
                        <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, background: `${goalStatusColor(g.status)}20`, color: goalStatusColor(g.status) }}>
                          {{ on_track: ar ? 'على المسار' : 'On Track', at_risk: ar ? 'في خطر' : 'At Risk', completed: ar ? 'مكتمل' : 'Completed', overdue: ar ? 'متأخر' : 'Overdue' }[g.status]}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number" className="input" defaultValue={g.current}
                          style={{ width: 80, padding: '0.25rem 0.5rem' }}
                          onBlur={e => updateGoalProgress(g.id, Number(e.target.value))}
                        />
                      </td>
                    </tr>
                  )
                })}
                {goals.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد أهداف' : 'No goals yet'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'feedback360' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'التقييم' : 'Appraisal'}</th>
                  <th>{ar ? 'المُقيِّم' : 'Reviewer'}</th>
                  <th>{ar ? 'العلاقة' : 'Relation'}</th>
                  <th>{ar ? 'التعليق' : 'Comments'}</th>
                  <th>{ar ? 'تاريخ الإرسال' : 'Submitted'}</th>
                </tr>
              </thead>
              <tbody>
                {feedback360List.map(f => (
                  <tr key={f.id}>
                    <td>{f.appraisal_id}</td>
                    <td style={{ fontWeight: 600 }}>{f.from_name}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                        {{ self: ar ? 'ذاتي' : 'Self', peer: ar ? 'زميل' : 'Peer', manager: ar ? 'مدير' : 'Manager', subordinate: ar ? 'مرؤوس' : 'Subordinate' }[f.relation]}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.comments}</td>
                    <td>{f.submitted_at ? new Date(f.submitted_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                  </tr>
                ))}
                {feedback360List.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد تغذية راجعة 360°' : 'No 360° feedback yet'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div className="modal-header">
              <h3 className="modal-title">{ar ? 'تقييم جديد' : 'New Appraisal'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الموظف *' : 'Employee *'}</label>
                    <select className="input" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required>
                      <option value="">{ar ? 'اختر موظفاً' : 'Select Employee'}</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.department ? `— ${e.department}` : ''}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الفترة *' : 'Period *'}</label>
                    <select className="input" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} required>
                      <option value="">{ar ? 'اختر الفترة' : 'Select Period'}</option>
                      {periods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'نموذج التقييم' : 'Appraisal Template'}</label>
                    <select className="input" value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}>
                      <option value="">{ar ? 'بدون نموذج' : 'No Template'}</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{ar ? t.name_ar : t.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الدرجة (0-100)' : 'Score (0-100)'}</label>
                    <input type="number" className="input" min={0} max={100} value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label className="input-label">{ar ? 'الأهداف' : 'Goals'}</label>
                  <textarea className="input" value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
                </div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label className="input-label">{ar ? 'التقييم والملاحظات' : 'Feedback'}</label>
                  <textarea className="input" value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--bg-hover)', marginTop: '1.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>⬆️ {ar ? 'ربط بالترقية / الزيادة' : 'Link to Promotion / Raise'}</div>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.linked_promotion} onChange={e => setForm(f => ({ ...f, linked_promotion: e.target.checked }))} />
                      {ar ? 'يستحق ترقية' : 'Recommend Promotion'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>{ar ? 'نسبة الزيادة %' : 'Raise %'}</label>
                      <input type="number" className="input" min={0} max={100} value={form.linked_raise} onChange={e => setForm(f => ({ ...f, linked_raise: e.target.value }))} style={{ width: 80 }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {viewModal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setViewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div className="modal-header">
              <h3 className="modal-title">{ar ? 'تفاصيل التقييم' : 'Appraisal Details'}</h3>
              <button className="btn-icon" onClick={() => setViewModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {[
                  { label: ar ? 'الموظف' : 'Employee', value: viewModal.employee?.name },
                  { label: ar ? 'الفترة' : 'Period', value: <span className="badge badge-info">{viewModal.period}</span> },
                  { label: ar ? 'الحالة' : 'Status', value: <span className={`badge ${STATUS_BADGE[viewModal.status]}`}>{ar ? STATUS_LABEL_AR[viewModal.status] : viewModal.status}</span> },
                  viewModal.score != null ? { label: ar ? 'الدرجة' : 'Score', value: <span style={{ fontWeight: 700, fontSize: '1.3rem', color: scoreColor(viewModal.score) }}>{viewModal.score}%</span> } : null,
                  viewModal.linked_promotion ? { label: ar ? 'الترقية' : 'Promotion', value: <span className="badge badge-success">⬆️ {ar ? 'موصى بالترقية' : 'Promotion Recommended'}</span> } : null,
                  viewModal.linked_raise ? { label: ar ? 'الزيادة' : 'Raise', value: `+${viewModal.linked_raise}%` } : null,
                ].filter(Boolean).map((row: any, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span className="text-muted">{row.label}</span><span style={{ fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}

                {viewModal.approval_chain && viewModal.approval_chain.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{ar ? 'مسار الاعتماد' : 'Approval Chain'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {viewModal.approval_chain.map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: step.status === 'approved' ? '#16a34a' : step.status === 'rejected' ? '#dc2626' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>{step.level}</div>
                          <span style={{ flex: 1, fontWeight: 600 }}>{step.approver_name}</span>
                          <span style={{ fontSize: '0.8rem', color: step.status === 'approved' ? '#16a34a' : step.status === 'rejected' ? '#dc2626' : '#d97706' }}>
                            {step.status === 'approved' ? '✓' : step.status === 'rejected' ? '✗' : '⏳'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewModal.goals && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div className="text-muted" style={{ marginBottom: '0.5rem' }}>{ar ? 'الأهداف' : 'Goals'}</div>
                    <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap' }}>{viewModal.goals}</div>
                  </div>
                )}
                {viewModal.feedback && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div className="text-muted" style={{ marginBottom: '0.5rem' }}>{ar ? 'التغذية الراجعة' : 'Feedback'}</div>
                    <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap' }}>{viewModal.feedback}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {viewModal.status === 'submitted' && (
                <>
                  <button className="btn btn-success" onClick={() => approveAppraisal(viewModal.id)}>{ar ? 'اعتماد' : 'Approve'}</button>
                  <button className="btn btn-danger" onClick={() => { setRejectModal(viewModal); setViewModal(null) }}>{ar ? 'رفض' : 'Reject'}</button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>{ar ? 'إغلاق' : 'Close'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {feedbackModal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setFeedbackModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div className="modal-header">
              <h3 className="modal-title">🔄 {ar ? 'تقييم 360°' : '360° Feedback'} — {feedbackModal.employee?.name}</h3>
              <button className="btn-icon" onClick={() => setFeedbackModal(null)}>✕</button>
            </div>
            <form onSubmit={submitFeedback360} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                {feedback360List.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{ar ? 'التقييمات المستلمة' : 'Received Feedback'}</div>
                    {feedback360List.map(f => (
                      <div key={f.id} style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{f.from_name}</span>
                          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{{ self: ar ? 'ذاتي' : 'Self', peer: ar ? 'زميل' : 'Peer', manager: ar ? 'مدير' : 'Manager', subordinate: ar ? 'مرؤوس' : 'Subordinate' }[f.relation]}</span>
                        </div>
                        {f.comments && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{f.comments}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{ar ? 'إضافة تقييم جديد' : 'Add New Feedback'}</div>
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{ar ? 'المُقيِّم' : 'Reviewer'}</label>
                    <select className="input" value={feedbackForm.from_employee_id} onChange={e => setFeedbackForm(f => ({ ...f, from_employee_id: e.target.value }))} required>
                      <option value="">{ar ? 'اختر' : 'Select'}</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'العلاقة' : 'Relation'}</label>
                    <select className="input" value={feedbackForm.relation} onChange={e => setFeedbackForm(f => ({ ...f, relation: e.target.value }))}>
                      <option value="self">{ar ? 'ذاتي' : 'Self'}</option>
                      <option value="peer">{ar ? 'زميل' : 'Peer'}</option>
                      <option value="manager">{ar ? 'مدير' : 'Manager'}</option>
                      <option value="subordinate">{ar ? 'مرؤوس' : 'Subordinate'}</option>
                    </select>
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label className="input-label">{ar ? 'التعليق' : 'Comments'}</label>
                  <textarea className="input" value={feedbackForm.comments} onChange={e => setFeedbackForm(f => ({ ...f, comments: e.target.value }))} rows={4} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFeedbackModal(null)}>{ar ? 'إغلاق' : 'Close'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'إرسال التقييم' : 'Submit Feedback'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {rejectModal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div className="modal-header">
              <h3 className="modal-title">{ar ? 'رفض التقييم' : 'Reject Appraisal'}</h3>
              <button className="btn-icon" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              <div className="input-group">
                <label className="input-label">{ar ? 'سبب الرفض (اختياري)' : 'Rejection Reason (optional)'}</label>
                <textarea className="input" value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)} rows={4} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>{ar ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-danger" onClick={rejectAppraisal} disabled={saving}>{saving ? '...' : ar ? 'تأكيد الرفض' : 'Confirm Reject'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {goalModal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }} onClick={() => setGoalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div className="modal-header">
              <h3 className="modal-title">🎯 {ar ? 'هدف جديد' : 'New Goal'}</h3>
              <button className="btn-icon" onClick={() => setGoalModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                <div className="input-group">
                  <label className="input-label">{ar ? 'الموظف *' : 'Employee *'}</label>
                  <select className="input" value={goalForm.employee_id} onChange={e => setGoalForm(f => ({ ...f, employee_id: e.target.value }))} required>
                    <option value="">{ar ? 'اختر' : 'Select'}</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label className="input-label">{ar ? 'عنوان الهدف *' : 'Goal Title *'}</label>
                  <input className="input" value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-grid form-grid-2" style={{ marginTop: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الهدف المطلوب *' : 'Target *'}</label>
                    <input className="input" type="number" min={1} value={goalForm.target} onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الوحدة' : 'Unit'}</label>
                    <input className="input" value={goalForm.unit} onChange={e => setGoalForm(f => ({ ...f, unit: e.target.value }))} placeholder={ar ? 'مثال: صفقة، ج، %' : 'e.g. deal, EGP, %'} />
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label className="input-label">{ar ? 'تاريخ الانتهاء' : 'Due Date'}</label>
                  <input className="input" type="date" value={goalForm.due_date} onChange={e => setGoalForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setGoalModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </ERPLayout>
  )
}