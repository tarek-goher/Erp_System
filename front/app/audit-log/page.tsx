'use client'

// ══════════════════════════════════════════════════════════
// app/audit-log/page.tsx — سجل المراجعة (Audit Log)
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET /api/audit-logs?user_id=&action=&from=&to=  → قائمة السجلات
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type AuditLog = {
  id: number
  user_id: number | null
  action: string
  model: string | null
  model_id: number | null
  changes: Record<string, any> | null
  ip: string | null
  created_at: string
  user?: { id: number; name: string; email: string }
}

const ACTION_COLORS: Record<string, string> = {
  create:  'badge-success',
  update:  'badge-warning',
  delete:  'badge-danger',
  login:   'badge-primary',
  logout:  'badge-muted',
  approve: 'badge-success',
  reject:  'badge-danger',
}

export default function AuditLogPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [logs,     setLogs]     = useState<AuditLog[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)

  const [userId,   setUserId]   = useState('')
  const [action,   setAction]   = useState('')
  const [from,     setFrom]     = useState('')
  const [to,       setTo]       = useState('')

  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      per_page: '20',
      ...(userId && { user_id: userId }),
      ...(action && { action }),
      ...(from   && { from }),
      ...(to     && { to }),
    })
    const res = await api.get<{ data: AuditLog[]; total: number }>(`/audit-logs?${params}`)
    if (res.data) { setLogs(res.data.data || []); setTotal(res.data.total || 0) }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [page, userId, action, from, to])

  const resetFilters = () => {
    setUserId('')
    setAction('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')

  return (
    <ERPLayout pageTitle={ar('سجل المراجعة', 'Audit Log')}>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{ar('الإجراء', 'Action')}</label>
            <select className="input" value={action} onChange={e => { setAction(e.target.value); setPage(1) }}>
              <option value="">{ar('كل الإجراءات', 'All Actions')}</option>
              {['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{ar('من تاريخ', 'From Date')}</label>
            <input className="input" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{ar('إلى تاريخ', 'To Date')}</label>
            <input className="input" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '1.4rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetFilters}>
              🔄 {ar('إعادة تعيين', 'Reset')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">{ar('لا توجد سجلات', 'No audit logs found')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{ar('التاريخ والوقت', 'Date & Time')}</th>
                  <th>{ar('المستخدم', 'User')}</th>
                  <th>{ar('الإجراء', 'Action')}</th>
                  <th>{ar('النموذج', 'Model')}</th>
                  <th>{ar('IP')}</th>
                  <th>{ar('التفاصيل', 'Details')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-muted">{log.id}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {fmtDate(log.created_at)}
                    </td>
                    <td>
                      {log.user ? (
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{log.user.name}</p>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.user.email}</p>
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <span className={`badge ${ACTION_COLORS[log.action] || 'badge-muted'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-muted">
                      {log.model
                        ? `${log.model}${log.model_id ? ` #${log.model_id}` : ''}`
                        : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {log.ip || '—'}
                    </td>
                    <td>
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDetailLog(log)}
                        >
                          👁️ {ar('عرض', 'View')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="sales-pagination">
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              {ar('← السابق', '← Prev')}
            </button>
            <span className="text-muted">{ar(`صفحة ${page} من ${Math.ceil(total / 20)}`, `Page ${page} of ${Math.ceil(total / 20)}`)}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={logs.length < 20}>
              {ar('التالي →', 'Next →')}
            </button>
          </div>
        )}
      </div>

      {/* ── Modal: تفاصيل السجل ────────────────────────────── */}
      {detailLog && (
        <div className="modal-overlay" onClick={() => setDetailLog(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('تفاصيل السجل', 'Log Details')}</h3>
              <button className="btn-icon" onClick={() => setDetailLog(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontSize: '0.875rem' }}>
                  <div>
                    <span className="text-muted">{ar('المستخدم', 'User')}: </span>
                    <span className="fw-semibold">{detailLog.user?.name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted">{ar('الإجراء', 'Action')}: </span>
                    <span className={`badge ${ACTION_COLORS[detailLog.action] || 'badge-muted'}`}>{detailLog.action}</span>
                  </div>
                  <div>
                    <span className="text-muted">{ar('التاريخ', 'Date')}: </span>
                    <span>{fmtDate(detailLog.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-muted">IP: </span>
                    <span style={{ fontFamily: 'monospace' }}>{detailLog.ip || '—'}</span>
                  </div>
                  {detailLog.model && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span className="text-muted">{ar('النموذج', 'Model')}: </span>
                      <span>{detailLog.model} #{detailLog.model_id}</span>
                    </div>
                  )}
                </div>

                {detailLog.changes && (
                  <div>
                    <p className="fw-semibold" style={{ marginBottom: '0.5rem' }}>
                      {ar('التغييرات', 'Changes')}
                    </p>
                    <pre style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      maxHeight: 300,
                      margin: 0,
                      color: 'var(--text-primary)',
                    }}>
                      {JSON.stringify(detailLog.changes, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailLog(null)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

    </ERPLayout>
  )
}
