'use client'

// ══════════════════════════════════════════════════════════
// app/reports/page.tsx — صفحة التقارير
// API: GET /api/reports/income-statement
//      GET /api/reports/balance-sheet
//      GET /api/reports/cash-flow
//      GET /api/reports/sales-summary
//      GET /api/reports/export
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'   // ✅ Fix #1: import useAuth
import { useI18n } from '../../lib/i18n'

const REPORT_TYPES = [
  { key: 'income-statement',  ar: 'قائمة الدخل',       en: 'Income Statement',  icon: '📊', endpoint: '/reports/income-statement', exportEndpoint: '/reports/export/profits' },
  { key: 'balance-sheet',     ar: 'الميزانية العمومية', en: 'Balance Sheet',     icon: '⚖️', endpoint: '/reports/balance-sheet',    exportEndpoint: '/reports/export/profits' },
  { key: 'cash-flow',         ar: 'التدفق النقدي',      en: 'Cash Flow',         icon: '💵', endpoint: '/reports/cash-flow',        exportEndpoint: '/reports/export/profits' },
  { key: 'sales-summary',     ar: 'ملخص المبيعات',      en: 'Sales Summary',     icon: '💰', endpoint: '/reports/sales-summary',    exportEndpoint: '/reports/export/sales'   },
]

export default function ReportsPage() {
  const { lang } = useI18n()
  const { token } = useAuth()             // ✅ Fix #1: استخدام useAuth للتحقق من الـ token
  const [activeReport, setActiveReport] = useState(REPORT_TYPES[0])
  const [data,     setData]     = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)  // ✅ Fix #2: حالة الـ export
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const fetchReport = async () => {
    setLoading(true)
    setData(null)
    const p = new URLSearchParams({
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo   && { date_to:   dateTo   }),
    })
    const res = await api.get(`${activeReport.endpoint}?${p}`)
    if (res.data) setData(res.data)
    setLoading(false)
  }

  // ✅ Fix #1: لا تجيب البيانات إلا لو في token
  useEffect(() => {
    if (!token) return
    fetchReport()
  }, [activeReport, token])

  // ✅ Fix #2: Export عن طريق api.get مع الـ Authorization header بدل window.open مباشرة
  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(format)
    const p = new URLSearchParams({
      format,
      ...(dateFrom && { from: dateFrom }),
      ...(dateTo   && { to:   dateTo   }),
    })
    const res = await api.get(`${activeReport.exportEndpoint}?${p}`)

    if (res.data) {
      // لو الـ backend رجّع URL → افتحه في tab جديد
      if (res.data.url) {
        window.open(res.data.url, '_blank')
      }
      // لو رجّع base64 أو blob link
      else if (res.data.file) {
        window.open(res.data.file, '_blank')
      }
      // لو رجّع download_url
      else if (res.data.download_url) {
        window.open(res.data.download_url, '_blank')
      }
    } else if (res.error) {
      alert(res.error)
    }

    setExporting(null)
  }

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  const renderData = (d: any) => {
    if (!d) return null
    const rows = d.data || (Array.isArray(d) ? d : null)
    if (rows && rows.length > 0) {
      const keys = Object.keys(rows[0])
      return (
        <div className="table-container">
          <table className="table">
            <thead><tr>{keys.map((k: string) => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr></thead>
            <tbody>
              {rows.map((row: any, i: number) => (
                <tr key={i}>
                  {keys.map((k: string) => (
                    <td key={k}>{typeof row[k] === 'number' ? fmt(row[k]) : String(row[k] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    const summary = d.summary || d.totals || d
    if (typeof summary === 'object' && !Array.isArray(summary)) {
      const entries = Object.entries(summary).filter(([, v]) => v !== null && typeof v !== 'object')
      if (entries.length > 0) {
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {entries.map(([key, val]) => (
              <div key={key} style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{key.replace(/_/g, ' ')}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {typeof val === 'number' ? fmt(val as number) : String(val)}
                </div>
              </div>
            ))}
          </div>
        )
      }
    }
    return (
      <pre style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto' }}>
        {JSON.stringify(d, null, 2)}
      </pre>
    )
  }

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'التقارير' : 'Reports'}>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3 className="fw-bold" style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
            {lang === 'ar' ? 'نوع التقرير' : 'Report Type'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {REPORT_TYPES.map(r => (
              <button
                key={r.key}
                onClick={() => setActiveReport(r)}
                className={activeReport.key === r.key ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                style={{ justifyContent: 'flex-start', gap: '0.5rem' }}
              >
                <span>{r.icon}</span>
                <span>{lang === 'ar' ? r.ar : r.en}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <h3 className="fw-bold" style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
            {lang === 'ar' ? 'الفترة الزمنية' : 'Date Range'}
          </h3>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'من تاريخ' : 'From Date'}</label>
              <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
              <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={fetchReport} disabled={loading}>
            {loading ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...') : (lang === 'ar' ? 'عرض التقرير' : 'Generate Report')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 className="fw-bold">{lang === 'ar' ? activeReport.ar : activeReport.en}</h3>
          {/* ✅ Fix #2: export عن طريق handleExport بدل window.open المباشر */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleExport('excel')}
              disabled={exporting === 'excel'}
            >
              📊 {exporting === 'excel' ? '...' : (lang === 'ar' ? 'Excel' : 'Excel')}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleExport('pdf')}
              disabled={exporting === 'pdf'}
            >
              📥 {exporting === 'pdf' ? '...' : (lang === 'ar' ? 'PDF' : 'PDF')}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 36 }} />)}
          </div>
        ) : !data ? (
          <div className="empty-state">
            <div className="empty-state-icon">📈</div>
            <p className="empty-state-text">{lang === 'ar' ? 'اختر تقريراً لعرضه' : 'Select a report to display'}</p>
          </div>
        ) : renderData(data)}
      </div>

    </ERPLayout>
  )
}