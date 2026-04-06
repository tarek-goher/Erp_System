'use client'

// ══════════════════════════════════════════════════════════
// app/appraisals/page.tsx — تقييم الأداء
// API: GET/POST  /api/appraisals
//      GET/PUT    /api/appraisals/{id}
//      POST       /api/appraisals/{id}/submit
//      POST       /api/appraisals/{id}/approve
//      POST       /api/appraisals/{id}/reject
//      GET        /api/appraisals/stats
//      GET        /api/employees
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../hooks/useToast'

type Employee   = { id: number; name: string; department?: string }
type Appraisal  = {
  id: number
  employee?: Employee
  reviewer?: { name: string }
  period: string
  score?: number
  feedback?: string
  goals?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  reviewed_at?: string
  created_at: string
}
type Stats = { total: number; draft: number; submitted: number; approved: number; rejected: number; avg_score: number }

const STATUS_BADGE: Record<string, string> = {
  draft:     'badge-muted',
  submitted: 'badge-warning',
  approved:  'badge-success',
  rejected:  'badge-danger',
}

const STATUS_LABEL_AR: Record<string, string> = {
  draft:     'مسودة',
  submitted: 'بانتظار المراجعة',
  approved:  'معتمد',
  rejected:  'مرفوض',
}

export default function AppraisalsPage() {
  const { t, lang } = useI18n()
  const { toasts, show: toast, remove: removeToast } = useToast?.() ?? { toasts: [], show: () => {}, remove: () => {} }

  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [employees,  setEmployees]  = useState<Employee[]>([])
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [periods,    setPeriods]    = useState<string[]>([])
  const [loading,    setLoading]    = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [page,         setPage]         = useState(1)
  const [total,        setTotal]        = useState(0)

  const [modal,      setModal]      = useState(false)
  const [viewModal,  setViewModal]  = useState<Appraisal | null>(null)
  const [rejectModal, setRejectModal] = useState<Appraisal | null>(null)
  const [rejectFeedback, setRejectFeedback] = useState('')

  const [form, setForm] = useState({
    employee_id: '',
    period: '',
    score: '',
    feedback: '',
    goals: '',
  })
  const [saving, setSaving] = useState(false)

  // ── جلب البيانات ───────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      per_page: '15',
      ...(statusFilter && { status: statusFilter }),
      ...(periodFilter && { period: periodFilter }),
    })
    const [aRes, sRes, pRes, eRes] = await Promise.all([
      api.get<{ data: Appraisal[]; total: number }>(`/appraisals?${params}`),
      api.get<Stats>('/appraisals/stats'),
      api.get<string[]>('/appraisals/periods'),
      employees.length === 0 ? api.get<{ data: Employee[] }>('/employees?per_page=200') : Promise.resolve(null),
    ])
    if (aRes.data)       { setAppraisals(aRes.data.data || []); setTotal(aRes.data.total || 0) }
    if (sRes.data)         setStats(sRes.data)
    if (pRes.data)         setPeriods(pRes.data)
    if (eRes?.data)        setEmployees((eRes.data as any).data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [page, statusFilter, periodFilter])

  // ── إنشاء تقييم ────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.employee_id || !form.period) return
    setSaving(true)
    const res = await api.post('/appraisals', {
      employee_id: Number(form.employee_id),
      period:      form.period,
      score:       form.score ? Number(form.score) : undefined,
      feedback:    form.feedback || undefined,
      goals:       form.goals   || undefined,
    })
    setSaving(false)
    if (!res.error) {
      setModal(false)
      setForm({ employee_id: '', period: '', score: '', feedback: '', goals: '' })
      fetchData()
    }
  }

  // ── Actions ─────────────────────────────────────────────
  const submitAppraisal = async (id: number) => {
    const res = await api.post(`/appraisals/${id}/submit`)
    if (!res.error) fetchData()
  }

  const approveAppraisal = async (id: number) => {
    const res = await api.post(`/appraisals/${id}/approve`)
    if (!res.error) { fetchData(); setViewModal(null) }
  }

  const rejectAppraisal = async () => {
    if (!rejectModal) return
    setSaving(true)
    const res = await api.post(`/appraisals/${rejectModal.id}/reject`, { feedback: rejectFeedback })
    setSaving(false)
    if (!res.error) { setRejectModal(null); setRejectFeedback(''); fetchData() }
  }

  const deleteAppraisal = async (id: number) => {
    if (!confirm('حذف التقييم؟')) return
    await api.delete(`/appraisals/${id}`)
    fetchData()
  }

  const scoreColor = (s?: number) => {
    if (!s) return '#94a3b8'
    if (s >= 80) return '#16a34a'
    if (s >= 60) return '#d97706'
    return '#dc2626'
  }

  return (
    <ERPLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">{lang === 'ar' ? 'تقييم الأداء' : 'Performance Appraisals'}</h1>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            + {lang === 'ar' ? 'تقييم جديد' : 'New Appraisal'}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid">
            {[
              { label: lang === 'ar' ? 'الإجمالي' : 'Total',     value: stats.total,     color: '#2563eb' },
              { label: lang === 'ar' ? 'مسودة' : 'Draft',         value: stats.draft,     color: '#94a3b8' },
              { label: lang === 'ar' ? 'بانتظار' : 'Submitted',   value: stats.submitted, color: '#d97706' },
              { label: lang === 'ar' ? 'معتمد' : 'Approved',      value: stats.approved,  color: '#16a34a' },
              { label: lang === 'ar' ? 'متوسط الدرجة' : 'Avg Score', value: `${stats.avg_score}%`, color: '#7c3aed' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="filters-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} style={{ maxWidth: 200 }}>
            <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
            {Object.entries(STATUS_LABEL_AR).map(([k, v]) => (
              <option key={k} value={k}>{lang === 'ar' ? v : k}</option>
            ))}
          </select>
          <select className="form-select" value={periodFilter} onChange={e => { setPeriodFilter(e.target.value); setPage(1) }} style={{ maxWidth: 200 }}>
            <option value="">{lang === 'ar' ? 'كل الفترات' : 'All Periods'}</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="loading-state" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" />
            </div>
          ) : appraisals.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {lang === 'ar' ? 'لا توجد تقييمات' : 'No appraisals found'}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                  <th>{lang === 'ar' ? 'الفترة' : 'Period'}</th>
                  <th>{lang === 'ar' ? 'الدرجة' : 'Score'}</th>
                  <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{lang === 'ar' ? 'المراجع' : 'Reviewer'}</th>
                  <th>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
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
                    <td>
                      {a.score != null ? (
                        <span style={{ fontWeight: 700, color: scoreColor(a.score), fontSize: '1.1rem' }}>{a.score}%</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[a.status]}`}>{lang === 'ar' ? STATUS_LABEL_AR[a.status] : a.status}</span></td>
                    <td>{a.reviewer?.name || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setViewModal(a)}>
                          {lang === 'ar' ? 'عرض' : 'View'}
                        </button>
                        {a.status === 'draft' && (
                          <button className="btn btn-sm btn-primary" onClick={() => submitAppraisal(a.id)}>
                            {lang === 'ar' ? 'إرسال' : 'Submit'}
                          </button>
                        )}
                        {a.status === 'submitted' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => approveAppraisal(a.id)}>
                              {lang === 'ar' ? 'اعتماد' : 'Approve'}
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => { setRejectModal(a); setRejectFeedback('') }}>
                              {lang === 'ar' ? 'رفض' : 'Reject'}
                            </button>
                          </>
                        )}
                        {a.status === 'draft' && (
                          <button className="btn btn-sm btn-danger" onClick={() => deleteAppraisal(a.id)}>
                            {lang === 'ar' ? 'حذف' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div className="pagination" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              {lang === 'ar' ? 'السابق' : 'Prev'}
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>{page}</span>
            <button className="btn btn-secondary btn-sm" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>
              {lang === 'ar' ? 'التالي' : 'Next'}
            </button>
          </div>
        )}

        {/* Modal: إنشاء تقييم */}
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{lang === 'ar' ? 'تقييم جديد' : 'New Appraisal'}</h2>
                <button className="modal-close" onClick={() => setModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">{lang === 'ar' ? 'الموظف *' : 'Employee *'}</label>
                      <select className="form-select" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required>
                        <option value="">{lang === 'ar' ? 'اختر موظفاً' : 'Select Employee'}</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.department ? `— ${e.department}` : ''}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{lang === 'ar' ? 'الفترة *' : 'Period *'}</label>
                      <select className="form-select" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} required>
                        <option value="">{lang === 'ar' ? 'اختر الفترة' : 'Select Period'}</option>
                        {periods.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{lang === 'ar' ? 'الدرجة (0-100)' : 'Score (0-100)'}</label>
                      <input type="number" className="form-input" min={0} max={100} value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} placeholder="مثال: 85" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{lang === 'ar' ? 'الأهداف' : 'Goals'}</label>
                    <textarea className="form-textarea" value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} rows={3} placeholder={lang === 'ar' ? 'أهداف الفترة...' : 'Goals for this period...'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{lang === 'ar' ? 'التقييم والملاحظات' : 'Feedback'}</label>
                    <textarea className="form-textarea" value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} rows={3} placeholder={lang === 'ar' ? 'ملاحظات المراجع...' : 'Reviewer notes...'} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</> : lang === 'ar' ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: عرض تقييم */}
        {viewModal && (
          <div className="modal-overlay" onClick={() => setViewModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <h2>{lang === 'ar' ? 'تفاصيل التقييم' : 'Appraisal Details'}</h2>
                <button className="modal-close" onClick={() => setViewModal(null)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div className="info-row">
                    <span className="text-muted">{lang === 'ar' ? 'الموظف:' : 'Employee:'}</span>
                    <strong>{viewModal.employee?.name}</strong>
                  </div>
                  <div className="info-row">
                    <span className="text-muted">{lang === 'ar' ? 'الفترة:' : 'Period:'}</span>
                    <span className="badge badge-info">{viewModal.period}</span>
                  </div>
                  <div className="info-row">
                    <span className="text-muted">{lang === 'ar' ? 'الحالة:' : 'Status:'}</span>
                    <span className={`badge ${STATUS_BADGE[viewModal.status]}`}>{lang === 'ar' ? STATUS_LABEL_AR[viewModal.status] : viewModal.status}</span>
                  </div>
                  {viewModal.score != null && (
                    <div className="info-row">
                      <span className="text-muted">{lang === 'ar' ? 'الدرجة:' : 'Score:'}</span>
                      <span style={{ fontWeight: 700, fontSize: '1.3rem', color: scoreColor(viewModal.score) }}>{viewModal.score}%</span>
                    </div>
                  )}
                  {viewModal.goals && (
                    <div>
                      <div className="text-muted" style={{ marginBottom: '0.5rem' }}>{lang === 'ar' ? 'الأهداف:' : 'Goals:'}</div>
                      <div style={{ background: 'var(--bg-page)', padding: '1rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap' }}>{viewModal.goals}</div>
                    </div>
                  )}
                  {viewModal.feedback && (
                    <div>
                      <div className="text-muted" style={{ marginBottom: '0.5rem' }}>{lang === 'ar' ? 'التغذية الراجعة:' : 'Feedback:'}</div>
                      <div style={{ background: 'var(--bg-page)', padding: '1rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap' }}>{viewModal.feedback}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                {viewModal.status === 'submitted' && (
                  <>
                    <button className="btn btn-success" onClick={() => approveAppraisal(viewModal.id)}>{lang === 'ar' ? 'اعتماد' : 'Approve'}</button>
                    <button className="btn btn-danger" onClick={() => { setRejectModal(viewModal); setViewModal(null) }}>{lang === 'ar' ? 'رفض' : 'Reject'}</button>
                  </>
                )}
                <button className="btn btn-secondary" onClick={() => setViewModal(null)}>{lang === 'ar' ? 'إغلاق' : 'Close'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: رفض */}
        {rejectModal && (
          <div className="modal-overlay" onClick={() => setRejectModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h2>{lang === 'ar' ? 'رفض التقييم' : 'Reject Appraisal'}</h2>
                <button className="modal-close" onClick={() => setRejectModal(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'سبب الرفض (اختياري)' : 'Rejection Reason (optional)'}</label>
                  <textarea className="form-textarea" value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)} rows={4} placeholder={lang === 'ar' ? 'أدخل سبب الرفض...' : 'Enter rejection reason...'} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button className="btn btn-danger" onClick={rejectAppraisal} disabled={saving}>
                  {saving ? lang === 'ar' ? 'جاري...' : 'Saving...' : lang === 'ar' ? 'تأكيد الرفض' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}
