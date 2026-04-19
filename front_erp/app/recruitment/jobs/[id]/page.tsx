'use client'

// ══════════════════════════════════════════════════════════
// app/recruitment/jobs/[id]/page.tsx — تفاصيل الوظيفة
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ERPLayout from '../../../../components/layout/ERPLayout'
import { api } from '../../../../lib/api'
import { useI18n } from '../../../../lib/i18n'

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
}

type Applicant = {
  id: number
  full_name: string
  email: string
  phone: string | null
  pipeline_stage: string
  rating: number | null
  applied_date: string
  cv_url: string | null
}

type PipelineStats = {
  Applied: number
  Screening: number
  Interview: number
  Offer: number
  Hired: number
  Rejected: number
}

const PIPELINE_STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']

export default function JobDetailPage() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const params = useParams()
  const jobId = Number(params.id)

  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [job, setJob] = useState<Job | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState('Applied')
  const [filterApplicants, setFilterApplicants] = useState<Applicant[]>([])

  const fetchJobDetails = async () => {
    setLoading(true)
    const [jobRes, appRes] = await Promise.all([
      api.get(`/recruitment/${jobId}`),
      api.get(`/applicants?job_id=${jobId}&per_page=999`),
    ])

    if (jobRes.data) setJob(jobRes.data)
    if (appRes.data) {
      setApplicants(appRes.data.data || [])
      
      // Calculate pipeline stats
      const stats: PipelineStats = {
        Applied: 0,
        Screening: 0,
        Interview: 0,
        Offer: 0,
        Hired: 0,
        Rejected: 0,
      }
      ;(appRes.data.data || []).forEach((a: Applicant) => {
        stats[a.pipeline_stage as keyof PipelineStats]++
      })
      setPipelineStats(stats)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (jobId) fetchJobDetails()
  }, [jobId])

  // Filter applicants by selected stage
  useEffect(() => {
    setFilterApplicants(applicants.filter(a => a.pipeline_stage === selectedStage))
  }, [selectedStage, applicants])

  if (loading) return <ERPLayout pageTitle={ar('تحميل...', 'Loading...')}><div>Loading...</div></ERPLayout>
  if (!job) return <ERPLayout pageTitle={ar('غير موجود', 'Not Found')}><div>Job not found</div></ERPLayout>

  const fmt = (n: number | null) =>
    n != null ? new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n) : '—'

  const stageColor = (stage: string) => ({
    'Applied': '#3498db',
    'Screening': '#f39c12',
    'Interview': '#2980b9',
    'Offer': '#27ae60',
    'Hired': '#16a085',
    'Rejected': '#e74c3c',
  }[stage] || '#95a5a6')

  const stageLabel = (stage: string) => ({
    'Applied': ar('تقديم', 'Applied'),
    'Screening': ar('تصفية', 'Screening'),
    'Interview': ar('مقابلة', 'Interview'),
    'Offer': ar('عرض عمل', 'Offer'),
    'Hired': ar('توظيف', 'Hired'),
    'Rejected': ar('رفض', 'Rejected'),
  }[stage] || stage)

  return (
    <ERPLayout pageTitle={job.title}>
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          ← {ar('عودة', 'Back')}
        </button>
      </div>

      {/* ── Job Header ───────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>{job.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div>
            <strong>{ar('القسم', 'Department')}</strong>
            <p className="text-muted">{job.department || '—'}</p>
          </div>
          <div>
            <strong>{ar('الراتب', 'Salary')}</strong>
            <p className="text-muted">{job.salary_range_min ? `${fmt(job.salary_range_min)} - ${fmt(job.salary_range_max)}` : '—'}</p>
          </div>
          <div>
            <strong>{ar('الحالة', 'Status')}</strong>
            <p className="text-muted">{job.status}</p>
          </div>
          <div>
            <strong>{ar('المتقدمين', 'Applicants')}</strong>
            <p className="text-muted">{job.applicant_count || 0}</p>
          </div>
        </div>
        
        {/* ── Requirements ─────────────────────────────────────── */}
        {job.requirements && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            <strong>{ar('المتطلبات', 'Requirements')}</strong>
            <p className="text-muted" style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
              {job.requirements}
            </p>
          </div>
        )}
      </div>

      {/* ── Pipeline Stats ───────────────────────────────────── */}
      {pipelineStats && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{ar('مسار التوظيف', 'Hiring Pipeline')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
            {PIPELINE_STAGES.map(stage => (
              <div
                key={stage}
                style={{
                  padding: '1rem',
                  border: `2px solid ${stageColor(stage)}`,
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: selectedStage === stage ? `${stageColor(stage)}20` : 'transparent',
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelectedStage(stage)}
              >
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stageColor(stage) }}>
                  {pipelineStats[stage as keyof PipelineStats]}
                </div>
                <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {stageLabel(stage)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Applicants in Selected Stage ──────────────────────── */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>
          {stageLabel(selectedStage)} ({filterApplicants.length})
        </h3>
        
        {filterApplicants.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">{ar('لا توجد متقدمين', 'No applicants')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar('الاسم', 'Name')}</th>
                  <th>{ar('البريد', 'Email')}</th>
                  <th>{ar('الهاتف', 'Phone')}</th>
                  <th>{ar('التقييم', 'Rating')}</th>
                  <th>{ar('CV', 'CV')}</th>
                  <th>{ar('تاريخ التقديم', 'Applied Date')}</th>
                </tr>
              </thead>
              <tbody>
                {filterApplicants.map(app => (
                  <tr key={app.id}>
                    <td className="fw-semibold">{app.full_name}</td>
                    <td className="text-muted">{app.email}</td>
                    <td className="text-muted">{app.phone || '—'}</td>
                    <td>
                      {app.rating ? '★'.repeat(app.rating) + '☆'.repeat(5 - app.rating) : '—'}
                    </td>
                    <td>
                      {app.cv_url ? (
                        <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="link">
                          📄 {ar('تحميل', 'Download')}
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-muted">
                      {new Date(app.applied_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
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