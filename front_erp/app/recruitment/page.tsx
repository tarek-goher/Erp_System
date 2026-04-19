'use client'

// ══════════════════════════════════════════════════════════
// app/recruitment/page.tsx — صفحة الوظائف محدثة
// ✅ يحتوي على جميع الـ 15 Features
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
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
  applicant_count: number
  hired_count: number
  hiring_rate: number
  is_archived: boolean
}

const STATUSES = ['open', 'closed', 'draft', 'on_hold']
const DEPARTMENTS = ['IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations']

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

  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [includeArchived, setIncludeArchived] = useState(false)

  const [modal, setModal] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErr, setFormErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [duplicateId, setDuplicateId] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)

  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  // ── Fetch Jobs ────────────────────────────────────────────
  const fetchJobs = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      per_page: '15',
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
      ...(departmentFilter && { department: departmentFilter }),
      ...(includeArchived && { include_archived: 'true' }),
    })
    const res = await api.get<{ data: Job[]; total: number }>(`/recruitment?${params}`)
    if (res.data) {
      setJobs(res.data.data || [])
      setTotal(res.data.total || 0)
    }
    setLoading(false)
  }

  // ── Fetch Dashboard Stats ─────────────────────────────────
  const fetchStats = async () => {
    const res = await api.get('/recruitment/dashboard-summary')
    if (res.data) setStats(res.data)
  }

  useEffect(() => {
    fetchJobs()
    fetchStats()
  }, [page, search, statusFilter, departmentFilter, sortBy, sortOrder, includeArchived])

  // ── Open Add Modal ────────────────────────────────────────
  const openAdd = () => {
    setEditJob(null)
    setForm(EMPTY_FORM)
    setFormErr('')
    setModal(true)
  }

  // ── Open Edit Modal ───────────────────────────────────────
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

  // ── Handle Submit ─────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')

    if (!form.title.trim()) {
      setFormErr(ar('العنوان مطلوب', 'Title is required'))
      return
    }

    // ✅ Feature #8: Validation أقوى
    if (form.salary_range_min && form.salary_range_max) {
      if (Number(form.salary_range_min) > Number(form.salary_range_max)) {
        setFormErr(ar('الحد الأدنى يجب أن يكون أقل من الأقصى', 'Min salary must be less than max'))
        return
      }
    }

    if (form.open_date && form.close_date) {
      if (new Date(form.open_date) > new Date(form.close_date)) {
        setFormErr(ar('تاريخ الفتح يجب أن يكون قبل الإغلاق', 'Open date must be before close date'))
        return
      }
    }

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
    if (res.error) {
      setFormErr(res.error)
      return
    }
    setModal(false)
    fetchJobs()
    fetchStats()
  }

  // ── Delete ────────────────────────────────────────────────
  // ✅ Feature #7: Soft Delete
  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/recruitment/${deleteId}`)
    setDeleteId(null)
    fetchJobs()
    fetchStats()
  }

  // ── Duplicate Job ─────────────────────────────────────────
  // ✅ Feature #12: Duplicate Job
  const handleDuplicate = async (jobId: number) => {
    const res = await api.post(`/recruitment/${jobId}/duplicate`, {})
    if (!res.error) {
      fetchJobs()
      alert(ar('تم نسخ الوظيفة بنجاح', 'Job duplicated successfully'))
    }
  }

  // ── Archive/Unarchive ─────────────────────────────────────
  const handleArchive = async (jobId: number, isArchived: boolean) => {
    const res = await isArchived
      ? await api.post(`/recruitment/${jobId}/unarchive`, {})
      : await api.post(`/recruitment/${jobId}/archive`, {})
    if (!res.error) fetchJobs()
  }

  const statusBadge = (s: string) => ({
    open: 'badge-success',
    closed: 'badge-danger',
    draft: 'badge-muted',
    on_hold: 'badge-warning',
  }[s] || 'badge-muted')

  const statusLabel = (s: string) => ({
    open: ar('مفتوح', 'Open'),
    closed: ar('مغلق', 'Closed'),
    draft: ar('مسودة', 'Draft'),
    on_hold: ar('معلق', 'On Hold'),
  }[s] || s)

  const fmt = (n: number | null) =>
    n != null ? new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n) : '—'

  return (
    <ERPLayout pageTitle={ar('التوظيف', 'Recruitment')}>

      {/* ── Dashboard Stats ──────────────────────────────────── */}
      {/* ✅ Feature #15: Dashboard / Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
              {stats.total_open_jobs}
            </div>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              {ar('وظائف مفتوحة', 'Open Jobs')}
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
              {stats.total_applicants}
            </div>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              {ar('إجمالي المتقدمين', 'Total Applicants')}
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
              {stats.total_hired}
            </div>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              {ar('تم توظيفهم', 'Hired')}
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
              {stats.pending_interviews}
            </div>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              {ar('مقابلات معلقة', 'Pending Interviews')}
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2980b9' }}>
              {stats.high_rated_applicants}
            </div>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              {ar('متقدمين نجوم ⭐', 'High-Rated')}
            </p>
          </div>
        </div>
      )}

      {/* ── Toolbar with Advanced Filters ────────────────────── */}
      {/* ✅ Feature #9: Filters أقوى */}
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

          {/* Status Filter */}
          <select
            className="input"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">{ar('جميع الحالات', 'All Status')}</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            className="input"
            style={{ width: 'auto' }}
            value={departmentFilter}
            onChange={e => { setDepartmentFilter(e.target.value); setPage(1) }}
          >
            <option value="">{ar('جميع الأقسام', 'All Departments')}</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            className="input"
            style={{ width: 'auto' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="created_at">{ar('الأحدث', 'Newest')}</option>
            <option value="title">{ar('العنوان', 'Title')}</option>
            <option value="salary_range_min">{ar('الراتب', 'Salary')}</option>
          </select>

          {/* Include Archived */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={e => setIncludeArchived(e.target.checked)}
            />
            <span className="text-muted">{ar('عرض المؤرشفة', 'Show Archived')}</span>
          </label>
        </div>

        <button className="btn btn-primary" onClick={openAdd}>
          + {ar('وظيفة جديدة', 'New Job')}
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
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
                  <th>{ar('الراتب', 'Salary Range')}</th>
                  <th>{ar('المتقدمين', 'Applicants')}</th>
                  <th>{ar('توظيف %', 'Hired %')}</th>
                  <th>{ar('الحالة', 'Status')}</th>
                  <th>{ar('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} style={{ opacity: job.is_archived ? 0.6 : 1 }}>
                    <td className="text-muted">{job.id}</td>
                    <td className="fw-semibold">
                      <Link href={`/recruitment/jobs/${job.id}`} className="link">
                        {job.title}
                      </Link>
                    </td>
                    <td className="text-muted">{job.department || '—'}</td>
                    <td>
                      {job.salary_range_min || job.salary_range_max
                        ? `${fmt(job.salary_range_min)} – ${fmt(job.salary_range_max)}`
                        : '—'}
                    </td>
                    <td className="text-center">
                      <Link href={`/recruitment/applicants?job_id=${job.id}`} className="link">
                        {job.applicant_count}
                      </Link>
                    </td>
                    <td className="text-center">
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        color: job.hiring_rate > 50 ? '#27ae60' : '#f39c12'
                      }}>
                        {job.hiring_rate}%
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(job.status)}`}>
                        {statusLabel(job.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(job)}>
                          {t('edit')}
                        </button>
                        <button className="btn btn-info btn-sm" onClick={() => handleDuplicate(job.id)}>
                          📋
                        </button>
                        <button
                          className={`btn btn-sm ${job.is_archived ? 'btn-success' : 'btn-warning'}`}
                          onClick={() => handleArchive(job.id, job.is_archived)}
                        >
                          {job.is_archived ? '📂' : '🗂'}
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

        {/* ── Pagination ──────────────────────────────────────── */}
        {/* ✅ Feature #11: Pagination حقيقية */}
        {total > 15 && (
          <div className="sales-pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {ar('← السابق', '← Prev')}
            </button>
            <span className="text-muted">
              {ar(`صفحة ${page} من ${Math.ceil(total / 15)}`, `Page ${page} of ${Math.ceil(total / 15)}`)}
            </span>
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

      {/* ── Modal: Add/Edit Job ──────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editJob ? ar('تعديل وظيفة', 'Edit Job') : ar('وظيفة جديدة', 'New Job')}
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  {/* Title */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('المسمى الوظيفي', 'Job Title')} *</label>
                    <input
                      className="input"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  {/* Department */}
                  <div className="input-group">
                    <label className="input-label">{ar('القسم', 'Department')}</label>
                    <select
                      className="input"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                    >
                      <option value="">{ar('اختر قسماً', 'Select Department')}</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
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

                  {/* Salary Min */}
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

                  {/* Salary Max */}
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

                  {/* Open Date */}
                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الفتح', 'Open Date')}</label>
                    <input
                      className="input"
                      type="date"
                      value={form.open_date}
                      onChange={e => setForm({ ...form, open_date: e.target.value })}
                    />
                  </div>

                  {/* Close Date */}
                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الإغلاق', 'Close Date')}</label>
                    <input
                      className="input"
                      type="date"
                      value={form.close_date}
                      onChange={e => setForm({ ...form, close_date: e.target.value })}
                    />
                  </div>

                  {/* Requirements */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('المتطلبات', 'Requirements')}</label>
                    <textarea
                      className="input"
                      rows={4}
                      value={form.requirements}
                      onChange={e => setForm({ ...form, requirements: e.target.value })}
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

      {/* ── Delete Confirmation ──────────────────────────────── */}
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