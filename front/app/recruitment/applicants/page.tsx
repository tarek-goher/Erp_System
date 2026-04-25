'use client'

// ══════════════════════════════════════════════════════════
// app/recruitment/applicants/page.tsx — صفحة المتقدمين
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET    /api/applicants              → قائمة المتقدمين
//   POST   /api/applicants              → إضافة متقدم جديد
//   PUT    /api/applicants/{id}         → تعديل بيانات متقدم
//   DELETE /api/applicants/{id}         → حذف متقدم
//   PATCH  /api/applicants/{id}/status  → تغيير الحالة (Pipeline)
//   POST   /api/applicants/{id}/upload  → رفع CV
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type Applicant = {
  id: number
  job_id: number
  job_title: string
  full_name: string
  email: string
  phone: string | null
  cv_url: string | null
  cv_file_name: string | null
  cover_letter: string | null
  applied_date: string
  pipeline_stage: string // Applied, Screening, Interview, Offer, Hired, Rejected
  rating: number | null // 0-5 stars
  notes: string | null
  created_at: string
  updated_at: string
}

type Job = {
  id: number
  title: string
}

const PIPELINE_STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']
const RATINGS = [1, 2, 3, 4, 5]

const EMPTY_FORM = {
  job_id: '',
  full_name: '',
  email: '',
  phone: '',
  cover_letter: '',
  rating: '',
}

export default function ApplicantsPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  const [modal, setModal] = useState(false)
  const [editApplicant, setEditApplicant] = useState<Applicant | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErr, setFormErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [cvFile, setCvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [viewApplicant, setViewApplicant] = useState<Applicant | null>(null)

  // ── Fetch Applicants ──────────────────────────────────────
  const fetchApplicants = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      per_page: '15',
      ...(search && { search }),
      ...(jobFilter && { job_id: jobFilter }),
      ...(stageFilter && { pipeline_stage: stageFilter }),
    })
    const res = await api.get<{ data: Applicant[]; total: number }>(`/applicants?${params}`)
    if (res.data) {
      setApplicants(res.data.data || [])
      setTotal(res.data.total || 0)
    }
    setLoading(false)
  }

  // ── Fetch Jobs (للـ dropdown) ──────────────────────────────
  const fetchJobs = async () => {
    const res = await api.get<{ data: Job[] }>('/recruitment?per_page=999')
    if (res.data) setJobs(res.data.data || [])
  }

  useEffect(() => { 
    fetchJobs()
    fetchApplicants()
  }, [page, search, jobFilter, stageFilter])

  // ── Open Add Modal ────────────────────────────────────────
  const openAdd = () => {
    setEditApplicant(null)
    setForm(EMPTY_FORM)
    setCvFile(null)
    setFormErr('')
    setModal(true)
  }

  // ── Open Edit Modal ───────────────────────────────────────
  const openEdit = (applicant: Applicant) => {
    setEditApplicant(applicant)
    setForm({
      job_id: String(applicant.job_id),
      full_name: applicant.full_name,
      email: applicant.email,
      phone: applicant.phone || '',
      cover_letter: applicant.cover_letter || '',
      rating: applicant.rating ? String(applicant.rating) : '',
    })
    setCvFile(null)
    setFormErr('')
    setModal(true)
  }

  // ── Handle Submit ─────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')

    if (!form.job_id.trim()) {
      setFormErr(ar('الوظيفة مطلوبة', 'Job is required'))
      return
    }
    if (!form.full_name.trim()) {
      setFormErr(ar('الاسم مطلوب', 'Name is required'))
      return
    }
    if (!form.email.trim()) {
      setFormErr(ar('البريد مطلوب', 'Email is required'))
      return
    }

    setSaving(true)
    const payload: any = {
      job_id: Number(form.job_id),
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      cover_letter: form.cover_letter || null,
      rating: form.rating ? Number(form.rating) : null,
    }

    const res = editApplicant
      ? await api.put(`/applicants/${editApplicant.id}`, payload)
      : await api.post('/applicants', payload)

    if (!res.error) {
      // Upload CV if provided
      if (cvFile && editApplicant) {
        await uploadCV(editApplicant.id)
      }
      setModal(false)
      fetchApplicants()
    } else {
      setFormErr(res.error)
    }
    setSaving(false)
  }

  // ── Upload CV ─────────────────────────────────────────────
  const uploadCV = async (applicantId: number) => {
    if (!cvFile) return
    setUploading(true)
    const formData = new FormData()
    formData.append('cv', cvFile)
    const res = await api.post(`/applicants/${applicantId}/upload-cv`, formData)
    setUploading(false)
    if (res.error) {
      setFormErr(ar('خطأ في رفع CV', 'Error uploading CV'))
    }
  }

  // ── Change Pipeline Stage ─────────────────────────────────
  const changeStage = async (applicantId: number, newStage: string) => {
    const res = await api.patch(`/applicants/${applicantId}/stage`, { pipeline_stage: newStage })
    if (!res.error) fetchApplicants()
  }

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/applicants/${deleteId}`)
    setDeleteId(null)
    fetchApplicants()
  }

  // ── Utility Functions ─────────────────────────────────────
  const stageColor = (stage: string) => ({
    'Applied': 'badge-info',
    'Screening': 'badge-warning',
    'Interview': 'badge-primary',
    'Offer': 'badge-success',
    'Hired': 'badge-success',
    'Rejected': 'badge-danger',
  }[stage] || 'badge-muted')

  const stageLabel = (stage: string) => ({
    'Applied': ar('تقديم', 'Applied'),
    'Screening': ar('تصفية', 'Screening'),
    'Interview': ar('مقابلة', 'Interview'),
    'Offer': ar('عرض عمل', 'Offer'),
    'Hired': ar('توظيف', 'Hired'),
    'Rejected': ar('رفض', 'Rejected'),
  }[stage] || stage)

  const renderStars = (rating: number | null) => {
    if (!rating) return '—'
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  return (
    <ERPLayout pageTitle={ar('المتقدمين', 'Applicants')}>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder={ar('بحث في المتقدمين...', 'Search applicants...')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            className="input"
            style={{ width: 'auto' }}
            value={jobFilter}
            onChange={e => { setJobFilter(e.target.value); setPage(1) }}
          >
            <option value="">{ar('جميع الوظائف', 'All Jobs')}</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <select
            className="input"
            style={{ width: 'auto' }}
            value={stageFilter}
            onChange={e => { setStageFilter(e.target.value); setPage(1) }}
          >
            <option value="">{ar('جميع المراحل', 'All Stages')}</option>
            {PIPELINE_STAGES.map(s => (
              <option key={s} value={s}>{stageLabel(s)}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + {ar('متقدم جديد', 'New Applicant')}
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
        ) : applicants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <p className="empty-state-text">{ar('لا توجد طلبات', 'No applicants found')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{ar('الاسم', 'Name')}</th>
                  <th>{ar('البريد', 'Email')}</th>
                  <th>{ar('الوظيفة', 'Job')}</th>
                  <th>{ar('المرحلة', 'Stage')}</th>
                  <th>{ar('التقييم', 'Rating')}</th>
                  <th>{ar('CV', 'CV')}</th>
                  <th>{ar('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map(app => (
                  <tr key={app.id}>
                    <td className="text-muted">{app.id}</td>
                    <td className="fw-semibold">{app.full_name}</td>
                    <td className="text-muted">{app.email}</td>
                    <td className="text-muted">{app.job_title}</td>
                    <td>
                      <select
                        className={`badge ${stageColor(app.pipeline_stage)}`}
                        value={app.pipeline_stage}
                        onChange={e => changeStage(app.id, e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                      >
                        {PIPELINE_STAGES.map(s => (
                          <option key={s} value={s}>{stageLabel(s)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-center">{renderStars(app.rating)}</td>
                    <td>
                      {app.cv_url ? (
                        <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="link">
                          📄 {app.cv_file_name || 'Download'}
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(app)}>
                          {t('edit')}
                        </button>
                        <button className="btn btn-info btn-sm" onClick={() => setViewApplicant(app)}>
                          👁 {ar('عرض', 'View')}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(app.id)}>
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
        {total > 15 && (
          <div className="sales-pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {ar('← السابق', '← Prev')}
            </button>
            <span className="text-muted">{ar(`صفحة ${page} من ${Math.ceil(total / 15)}`, `Page ${page} of ${Math.ceil(total / 15)}`)}</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => p + 1)}
              disabled={applicants.length < 15}
            >
              {ar('التالي →', 'Next →')}
            </button>
          </div>
        )}
      </div>

      {/* ── Modal: Add/Edit ──────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editApplicant ? ar('تعديل متقدم', 'Edit Applicant') : ar('متقدم جديد', 'New Applicant')}
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">

                  {/* الوظيفة */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('الوظيفة', 'Job')} *</label>
                    <select
                      className="input"
                      value={form.job_id}
                      onChange={e => setForm({ ...form, job_id: e.target.value })}
                    >
                      <option value="">{ar('اختر وظيفة', 'Select a job')}</option>
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* الاسم */}
                  <div className="input-group">
                    <label className="input-label">{ar('الاسم الكامل', 'Full Name')} *</label>
                    <input
                      className="input"
                      value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      placeholder={ar('مثال: أحمد محمد', 'e.g. Ahmed Mohamed')}
                    />
                  </div>

                  {/* البريد */}
                  <div className="input-group">
                    <label className="input-label">{ar('البريد الإلكتروني', 'Email')} *</label>
                    <input
                      className="input"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder={ar('مثال: ahmed@gmail.com', 'e.g. ahmed@gmail.com')}
                    />
                  </div>

                  {/* الهاتف */}
                  <div className="input-group">
                    <label className="input-label">{ar('رقم الهاتف', 'Phone')}</label>
                    <input
                      className="input"
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder={ar('مثال: +20 123456789', 'e.g. +20 123456789')}
                    />
                  </div>

                  {/* التقييم */}
                  <div className="input-group">
                    <label className="input-label">{ar('التقييم', 'Rating')}</label>
                    <select
                      className="input"
                      value={form.rating}
                      onChange={e => setForm({ ...form, rating: e.target.value })}
                    >
                      <option value="">{ar('بدون تقييم', 'No rating')}</option>
                      {RATINGS.map(r => (
                        <option key={r} value={r}>{r} ⭐</option>
                      ))}
                    </select>
                  </div>

                  {/* CV Upload */}
                  <div className="input-group">
                    <label className="input-label">CV ({ar('PDF/DOC', 'PDF/DOC')})</label>
                    <input
                      className="input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={e => setCvFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  {/* Cover Letter */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('رسالة التغطية', 'Cover Letter')}</label>
                    <textarea
                      className="input"
                      rows={4}
                      value={form.cover_letter}
                      onChange={e => setForm({ ...form, cover_letter: e.target.value })}
                      placeholder={ar('اكتب رسالة التغطية...', 'Write cover letter...')}
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
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Applicant Details ────────────────────── */}
      {viewApplicant && (
        <div className="modal-overlay" onClick={() => setViewApplicant(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{viewApplicant.full_name}</h3>
              <button className="btn-icon" onClick={() => setViewApplicant(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <strong>{ar('البريد:', 'Email:')}</strong>
                  <p className="text-muted">{viewApplicant.email}</p>
                </div>
                <div>
                  <strong>{ar('الهاتف:', 'Phone:')}</strong>
                  <p className="text-muted">{viewApplicant.phone || '—'}</p>
                </div>
                <div>
                  <strong>{ar('الوظيفة:', 'Job:')}</strong>
                  <p className="text-muted">{viewApplicant.job_title}</p>
                </div>
                <div>
                  <strong>{ar('المرحلة:', 'Stage:')}</strong>
                  <p className="text-muted">{stageLabel(viewApplicant.pipeline_stage)}</p>
                </div>
                <div>
                  <strong>{ar('التقييم:', 'Rating:')}</strong>
                  <p className="text-muted">{renderStars(viewApplicant.rating)}</p>
                </div>
                <div>
                  <strong>{ar('رسالة التغطية:', 'Cover Letter:')}</strong>
                  <p className="text-muted">{viewApplicant.cover_letter || '—'}</p>
                </div>
                <div>
                  <strong>{ar('CV:', 'CV:')}</strong>
                  {viewApplicant.cv_url ? (
                    <a href={viewApplicant.cv_url} target="_blank" rel="noopener noreferrer" className="link">
                      📄 {viewApplicant.cv_file_name}
                    </a>
                  ) : (
                    <p className="text-muted">—</p>
                  )}
                </div>
                <div>
                  <strong>{ar('تاريخ التقديم:', 'Applied Date:')}</strong>
                  <p className="text-muted">{new Date(viewApplicant.applied_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewApplicant(null)}>
                {ar('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Delete ────────────────────────────── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('تأكيد الحذف', 'Confirm Delete')}</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>{ar('هل أنت متأكد من حذف هذا المتقدم؟', 'Are you sure you want to delete this applicant?')}</p>
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