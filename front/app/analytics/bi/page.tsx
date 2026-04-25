'use client'

// ══════════════════════════════════════════════════════════
// app/analytics/bi.vue/page.tsx — BI & Analytics
// API: GET /api/bi/dashboards
//      GET /api/bi/reports
//      GET /api/bi/kpis
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api, extractArray } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

const TABS = ['dashboards', 'reports', 'kpis']

export default function BIPage() {
  const { lang } = useI18n()
  const [activeTab, setActiveTab] = useState('dashboards')

  const tabLabels: Record<string, { ar: string; en: string; icon: string }> = {
    dashboards: { ar: 'لوحات البيانات', en: 'BI Dashboards', icon: '📊' },
    reports:    { ar: 'التقارير',        en: 'BI Reports',    icon: '📈' },
    kpis:       { ar: 'مؤشرات الأداء',  en: 'KPI Metrics',   icon: '🎯' },
  }

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'تحليلات الأعمال' : 'BI & Analytics'}>
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab].icon} {lang === 'ar' ? tabLabels[tab].ar : tabLabels[tab].en}
          </button>
        ))}
      </div>

      {activeTab === 'dashboards' && <BIDashboards lang={lang} />}
      {activeTab === 'reports'    && <BIReports    lang={lang} />}
      {activeTab === 'kpis'       && <KPIMetrics   lang={lang} />}
    </ERPLayout>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
    </div>
  )
}

function DataTable({ data, lang }: { data: any[]; lang: string }) {
  if (!data || data.length === 0) return (
    <div className="empty-state"><div className="empty-state-icon">📊</div>
      <p className="empty-state-text">{lang === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
    </div>
  )
  const keys = Object.keys(data[0])
  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  return (
    <div className="table-container">
      <table className="table">
        <thead><tr>{keys.map(k => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {keys.map(k => <td key={k}>{typeof row[k] === 'number' ? fmt(row[k]) : String(row[k] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RawData({ data, lang }: { data: any; lang: string }) {
  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const rows = data?.data || (Array.isArray(data) ? data : null)
  if (rows && rows.length > 0) return <DataTable data={rows} lang={lang} />
  const entries = Object.entries(data || {}).filter(([, v]) => v !== null && typeof v !== 'object')
  if (entries.length > 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {entries.map(([key, val]) => (
          <div key={key} style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{key.replace(/_/g, ' ')}</div>
            <div style={{ fontWeight: 700 }}>{typeof val === 'number' ? fmt(val as number) : String(val)}</div>
          </div>
        ))}
      </div>
    )
  }
  return <pre style={{ fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>
}

// ── BIDashboards ────────────────────────────────────────────
function BIDashboards({ lang }: { lang: string }) {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/bi/dashboards').then(res => { setData(res.data); setLoading(false) })
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  if (loading) return <LoadingSkeleton />

  const summary = data?.summary || data?.data?.summary || {}
  const charts  = data?.charts  || data?.data?.charts  || []
  const summaryEntries = Object.entries(summary).filter(([, v]) => typeof v === 'number')

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {summaryEntries.length > 0 ? summaryEntries.map(([key, val]) => (
          <div key={key} className="card stat-card">
            <div className="stat-label">{key.replace(/_/g, ' ')}</div>
            <div className="stat-value">{fmt(val as number)}</div>
          </div>
        )) : (
          <>
            {[
              { label: lang === 'ar' ? 'إجمالي المبيعات' : 'Total Sales', icon: '💰' },
              { label: lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue', icon: '📈' },
              { label: lang === 'ar' ? 'عدد العملاء' : 'Total Customers', icon: '👥' },
              { label: lang === 'ar' ? 'معدل النمو' : 'Growth Rate', icon: '🚀' },
            ].map((s, i) => (
              <div key={i} className="card stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.icon} —</div>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="card">
        <h3 className="fw-bold" style={{ marginBottom: '1rem' }}>
          {lang === 'ar' ? 'بيانات لوحة التحكم' : 'Dashboard Data'}
        </h3>
        {charts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {charts.map((chart: any, i: number) => (
              <div key={i}>
                <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>{chart.title || `Chart ${i + 1}`}</h4>
                <DataTable data={chart.data || []} lang={lang} />
              </div>
            ))}
          </div>
        ) : data ? <RawData data={data} lang={lang} /> : (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-text">{lang === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── BIReports ───────────────────────────────────────────────
function BIReports({ lang }: { lang: string }) {
  const [reports, setReports]   = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail]     = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  useEffect(() => {
    api.get('/bi/reports').then(res => {
      setReports(extractArray(res.data))
      setLoading(false)
    })
  }, [])

  const loadReport = async (report: any) => {
    setSelected(report)
    setDetailLoading(true)
    const p = new URLSearchParams({ ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }) })
    const res = await api.get(`/bi/reports/${report.id}?${p}`)
    setDetail(res.data)
    setDetailLoading(false)
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="grid-2">
      <div className="card">
        <h3 className="fw-bold" style={{ marginBottom: '1rem' }}>
          {lang === 'ar' ? 'قائمة التقارير' : 'Report List'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
          <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder={lang === 'ar' ? 'من' : 'From'} />
          <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder={lang === 'ar' ? 'إلى' : 'To'} />
        </div>
        {reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📈</div>
            <p className="empty-state-text">{lang === 'ar' ? 'لا توجد تقارير' : 'No reports found'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reports.map((r: any) => (
              <button key={r.id} onClick={() => loadReport(r)}
                className={selected?.id === r.id ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                style={{ justifyContent: 'flex-start' }}>
                📄 {r.name || r.title || `Report #${r.id}`}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <h3 className="fw-bold" style={{ marginBottom: '1rem' }}>
          {selected ? (selected.name || selected.title) : (lang === 'ar' ? 'اختر تقريراً' : 'Select a Report')}
        </h3>
        {detailLoading ? <LoadingSkeleton /> : detail ? <RawData data={detail} lang={lang} /> : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">{lang === 'ar' ? 'اختر تقريراً من القائمة' : 'Choose a report from the list'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── KPIMetrics ──────────────────────────────────────────────
function KPIMetrics({ lang }: { lang: string }) {
  const [kpis, setKpis]       = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('month')

  const fetchKPIs = async () => {
    setLoading(true)
    const res = await api.get(`/bi/kpis?period=${period}`)
    if (res.data) {
      const arr = extractArray(res.data)
      if (arr.length > 0) setKpis(arr)
      setSummary(res.data?.summary || res.data?.data || null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchKPIs() }, [period])

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const periodOptions = [
    { key: 'week', ar: 'أسبوعي', en: 'Weekly' },
    { key: 'month', ar: 'شهري', en: 'Monthly' },
    { key: 'quarter', ar: 'ربع سنوي', en: 'Quarterly' },
    { key: 'year', ar: 'سنوي', en: 'Yearly' },
  ]

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {periodOptions.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={period === p.key ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}>
              {lang === 'ar' ? p.ar : p.en}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSkeleton /> : (
        <>
          {kpis.length > 0 ? (
            <>
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {kpis.map((kpi: any, i: number) => (
                  <div key={i} className="card stat-card">
                    <div className="stat-label">{kpi.name || kpi.label || kpi.key}</div>
                    <div className="stat-value" style={{ color: kpi.change > 0 ? 'var(--success)' : kpi.change < 0 ? 'var(--danger)' : 'inherit' }}>
                      {kpi.value !== undefined ? fmt(kpi.value) : '—'}
                    </div>
                    {kpi.change !== undefined && (
                      <div style={{ fontSize: '0.75rem', color: kpi.change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 className="fw-bold" style={{ marginBottom: '1rem' }}>{lang === 'ar' ? 'تفاصيل المؤشرات' : 'KPI Details'}</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{lang === 'ar' ? 'المؤشر' : 'KPI'}</th>
                        <th>{lang === 'ar' ? 'القيمة' : 'Value'}</th>
                        <th>{lang === 'ar' ? 'الهدف' : 'Target'}</th>
                        <th>{lang === 'ar' ? 'التغيير' : 'Change'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.map((kpi: any, i: number) => (
                        <tr key={i}>
                          <td className="fw-semibold">{kpi.name || kpi.label || kpi.key}</td>
                          <td>{kpi.value !== undefined ? fmt(kpi.value) : '—'}</td>
                          <td>{kpi.target !== undefined ? fmt(kpi.target) : '—'}</td>
                          <td>
                            {kpi.change !== undefined ? (
                              <span style={{ color: kpi.change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : summary ? (
            <div className="stats-grid">
              {Object.entries(summary).filter(([, v]) => typeof v === 'number' || typeof v === 'string').map(([key, val]) => (
                <div key={key} className="card stat-card">
                  <div className="stat-label">{key.replace(/_/g, ' ')}</div>
                  <div className="stat-value">{typeof val === 'number' ? fmt(val) : String(val)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <p className="empty-state-text">{lang === 'ar' ? 'لا توجد مؤشرات أداء' : 'No KPI data available'}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
