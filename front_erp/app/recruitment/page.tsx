'use client'

// ══════════════════════════════════════════════════════════
// app/recruitment/page.tsx — صفحة التوظيف
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET    /api/recruitment         → قائمة الوظائف
//   POST   /api/recruitment         → إضافة وظيفة جديدة
//   PUT    /api/recruitment/{id}    → تعديل وظيفة
//   DELETE /api/recruitment/{id}    → حذف وظيفة
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Job = {
  id: number
  title: string
  department: string | null
  requirements: string | null
  salary_range_min: number | null
  salary_range_max: number | null
  status: string
  open_date: string | null
  close_date: string | null
  created_at: string
}

const STATUSES = ['open', 'closed', 'draft', 'on_hold']

const EMPTY_FORM = {
  title: '',
  department: '',
  requirements: '',
  salary_range_min: '',
  salary_range_max: '',
  status: 'open',
  open_date: '',
  close_date: '',
}

export default function RecruitmentPage() {
  const { t, lang } = useI18n()

  const [jobs,       setJobs]       = useState<Job[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [modal,      setModal]      = useState(false)
  const [editJob,    setEditJob]    = useState<Job | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formErr,    setFormErr]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [deleteId,   setDeleteId]   = useState<number | null>(null)

  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const fetchJobs = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      per_page: '15',
      ...(search       && { search }),
      ...(statusFilter && { status: statusFilter }),
    })
    const res = await api.get<{ data: Job[]; total: number }>(`/recruitment?${params}`)
    if (res.data) { setJobs(res.data.data || []); setTotal(res.data.total || 0) }
    setLoading(false)
  }

  useEffect(() => { fetchJobs() }, [page, search, statusFilter])

  const openAdd = () => {
    setEditJob(null)
    setForm(EMPTY_FORM)
    setFormErr('')
    setModal(true)
  }

  const openEdit = (job: Job) => {
    setEditJob(job)
    setForm({
      title: job.title,
      department: job.department || '',
      requirements: job.requirements || '',
      salary_range_min: job.salary_range_min ? String(job.salary_range_min) : '',
      salary_range_max: job.salary_range_max ? String(job.salary_range_max) : '',
      status: job.status,
      open_date: job.open_date || '',
      close_date: job.close_date || '',
    })
    setFormErr('')
    setModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.title.trim()) { setFormErr(ar('العنوان مطلوب', 'Title is required')); return }

    setSaving(true)
    const payload: any = {
      title: form.title,
      department: form.department || null,
      requirements: form.requirements || null,
      status: form.status,
      salary_range_min: form.salary_range_min ? Number(form.salary_range_min) : null,
      salary_range_max: form.salary_range_max ? Number(form.salary_range_max) : null,
      open_date: form.open_date || null,
      close_date: form.close_date || null,
    }

    const res = editJob
      ? await api.put(`/recruitment/${editJob.id}`, payload)
      : await api.post('/recruitment', payload)

    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    fetchJobs()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/recruitment/${deleteId}`)
    setDeleteId(null)
    fetchJobs()
  }

  const statusBadge = (s: string) => ({
    open:    'badge-success',
    closed:  'badge-danger',
    draft:   'badge-muted',
    on_hold: 'badge-warning',
  }[s] || 'badge-muted')

  const statusLabel = (s: string) => ({
    open:    ar('مفتوح',    'Open'),
    closed:  ar('مغلق',    'Closed'),
    draft:   ar('مسودة',   'Draft'),
    on_hold: ar('معلق',    'On Hold'),
  }[s] || s)

  const fmt = (n: number | null) =>
    n != null ? new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n) : '—'

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  return (
    <ERPLayout pageTitle={ar('التوظيف', 'Recruitment')}>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder={ar('بحث في الوظائف...', 'Search jobs...')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            className="input"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">{ar('كل الحالات', 'All Status')}</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + {ar('وظيفة جديدة', 'New Job')}
        </button>
      </div>

      {/* ── الجدول ──────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44 }} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👔</div>
            <p className="empty-state-text">{ar('لا توجد وظائف', 'No jobs found')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{ar('المسمى الوظيفي', 'Job Title')}</th>
                  <th>{ar('القسم', 'Department')}</th>
                  <th>{ar('الراتب (من-إلى)', 'Salary Range')}</th>
                  <th>{ar('تاريخ الإغلاق', 'Close Date')}</th>
                  <th>{ar('الحالة', 'Status')}</th>
                  <th>{ar('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td className="text-muted">{job.id}</td>
                    <td className="fw-semibold">{job.title}</td>
                    <td className="text-muted">{job.department || '—'}</td>
                    <td>
                      {job.salary_range_min || job.salary_range_max
                        ? `${fmt(job.salary_range_min)} – ${fmt(job.salary_range_max)}`
                        : '—'}
                    </td>
                    <td className="text-muted">{fmtDate(job.close_date)}</td>
                    <td>
                      <span className={`badge ${statusBadge(job.status)}`}>
                        {statusLabel(job.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(job)}>
                          {t('edit')}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(job.id)}>
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="sales-pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {ar('← السابق', '← Prev')}
            </button>
            <span className="text-muted">{ar(`صفحة ${page}`, `Page ${page}`)}</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => p + 1)}
              disabled={jobs.length < 15}
            >
              {ar('التالي →', 'Next →')}
            </button>
          </div>
        )}
      </div>

      {/* ── Modal: إضافة / تعديل وظيفة ───────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editJob ? ar('تعديل وظيفة', 'Edit Job') : ar('وظيفة جديدة', 'New Job')}
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">

                  {/* المسمى الوظيفي */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('المسمى الوظيفي', 'Job Title')} *</label>
                    <input
                      className="input"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder={ar('مثال: مطور برمجيات', 'e.g. Software Developer')}
                    />
                  </div>

                  {/* القسم */}
                  <div className="input-group">
                    <label className="input-label">{ar('القسم', 'Department')}</label>
                    <input
                      className="input"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      placeholder={ar('مثال: تقنية المعلومات', 'e.g. IT')}
                    />
                  </div>

                  {/* الحالة */}
                  <div className="input-group">
                    <label className="input-label">{ar('الحالة', 'Status')}</label>
                    <select
                      className="input"
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  </div>

                  {/* نطاق الراتب */}
                  <div className="input-group">
                    <label className="input-label">{ar('الحد الأدنى للراتب', 'Min Salary')}</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={form.salary_range_min}
                      onChange={e => setForm({ ...form, salary_range_min: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('الحد الأقصى للراتب', 'Max Salary')}</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={form.salary_range_max}
                      onChange={e => setForm({ ...form, salary_range_max: e.target.value })}
                    />
                  </div>

                  {/* تاريخ الفتح والإغلاق */}
                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الفتح', 'Open Date')}</label>
                    <input
                      className="input"
                      type="date"
                      value={form.open_date}
                      onChange={e => setForm({ ...form, open_date: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الإغلاق', 'Close Date')}</label>
                    <input
                      className="input"
                      type="date"
                      value={form.close_date}
                      onChange={e => setForm({ ...form, close_date: e.target.value })}
                    />
                  </div>

                  {/* المتطلبات */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('المتطلبات', 'Requirements')}</label>
                    <textarea
                      className="input"
                      rows={4}
                      value={form.requirements}
                      onChange={e => setForm({ ...form, requirements: e.target.value })}
                      placeholder={ar('اكتب متطلبات الوظيفة...', 'Write job requirements...')}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                {formErr && (
                  <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    ⚠️ {formErr}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: تأكيد الحذف ────────────────────────────── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('تأكيد الحذف', 'Confirm Delete')}</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>{ar('هل أنت متأكد من حذف هذه الوظيفة؟', 'Are you sure you want to delete this job?')}</p>
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
