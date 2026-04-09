'use client'
import { useState, useEffect } from 'react'
import { api } from '../../../lib/api'
import { StatCard, ToastContainer } from '../../../components/ui'
import { useToast } from '../../../hooks/useToast'

export default function MonitoringPage() {
  const { toasts, show, remove } = useToast()
  const [data, setData]               = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = async () => {
    setLoading(true)
    const res = await api.get('/super-admin/monitoring')
    if (res.error) {
      show(res.error, 'error')
    } else if (res.data) {
      setData(res.data)
      setLastRefresh(new Date())
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const i = setInterval(load, 30000)
    return () => clearInterval(i)
  }, [])

  // ── مساعدات قراءة الـ response ─────────────────────────────
  // البيانات: data.system.* | data.services.database.* | data.services.cache.* | data.services.queue.*
  const sys = (data && typeof data === 'object' ? data.system : null) ?? {}
  const services = (data && typeof data === 'object' ? data.services : null) ?? {}
  const serverTime = (data && typeof data === 'object' ? data.server_time : null) ?? '—'
  const uptime = (data && typeof data === 'object' ? data.uptime_since : null) ?? '—'

  const db       = services.database ?? {}
  const cache    = services.cache    ?? {}
  const queue    = services.queue    ?? {}

  const overallStatus = data?.status === 'healthy'
    ? '✅ سليم'
    : data?.status === 'degraded'
      ? '⚠️ متدهور'
      : '—'
  const statusColor = data?.status === 'healthy'
    ? 'var(--color-success)'
    : 'var(--color-danger)'

  const fmtStatus = (s: string) =>
    s === 'ok' ? '✅ متصل' : s === 'error' ? '❌ خطأ' : (s ?? '—')

  return (
    <div>
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div>
          <h1 className="page-title">📡 مراقبة النظام</h1>
          <p className="page-subtitle">
            آخر تحديث: {lastRefresh.toLocaleTimeString('ar-EG')} — يتجدد كل 30 ثانية
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={load}
          disabled={loading}
        >
          {loading ? '⏳ جارٍ التحديث...' : '🔄 تحديث'}
        </button>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80 }} />
          ))}
        </div>
      ) : (
        <>
          {/* ── بطاقات الإحصائيات ── */}
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            <StatCard
              icon="🖥️"
              label="حالة النظام"
              value={overallStatus}
              accent={statusColor}
            />
            <StatCard
              icon="⚡"
              label="استخدام CPU"
              value={sys.cpu != null ? `${sys.cpu}%` : '—'}
              accent="var(--color-warning)"
            />
            <StatCard
              icon="💾"
              label="استخدام الذاكرة"
              value={sys.memory != null ? `${sys.memory}%` : '—'}
              accent="var(--color-primary)"
            />
            <StatCard
              icon="💿"
              label="مساحة الديسك"
              value={sys.disk != null ? `${sys.disk}%` : '—'}
              accent="var(--color-info)"
            />
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            {/* ── قاعدة البيانات ── */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🗄️ قاعدة البيانات</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'الاتصال',            val: fmtStatus(db.status),                                     ok: db.status === 'ok' },
                  { label: 'وقت الاستجابة',      val: db.latency_ms   != null ? `${db.latency_ms} ms` : '—',   ok: undefined },
                  { label: 'حجم قاعدة البيانات', val: sys.db_size_mb  != null ? `${sys.db_size_mb} MB` : '—',  ok: undefined },
                  { label: 'الشركات النشطة',     val: sys.active_companies ?? '—',                              ok: undefined },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{row.label}</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: row.ok === true
                        ? 'var(--color-success)'
                        : row.ok === false
                          ? 'var(--color-danger)'
                          : 'var(--text-primary)',
                    }}>
                      {String(row.val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Cache & Queue ── */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🔄 الـ Cache & Queue</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Cache',           val: fmtStatus(cache.status),                                         ok: cache.status === 'ok' },
                  { label: 'المهام المعلقة',  val: queue.pending_jobs ?? '0',                                       ok: undefined },
                  { label: 'المهام الفاشلة',  val: queue.failed_jobs  ?? '0',                                       ok: (queue.failed_jobs ?? 0) === 0 },
                  { label: 'معدل الخطأ',      val: queue.error_rate   != null ? String(queue.error_rate) : '0%',    ok: undefined },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{row.label}</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: row.ok === true
                        ? 'var(--color-success)'
                        : row.ok === false
                          ? 'var(--color-danger)'
                          : 'var(--text-primary)',
                    }}>
                      {String(row.val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── أداء التطبيق ── */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📊 أداء التطبيق</h3>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[
                { label: 'إجمالي الطلبات',        val: sys.total_requests     != null ? Number(sys.total_requests).toLocaleString('ar-EG')   : '—' },
                { label: 'متوسط وقت الاستجابة',  val: sys.avg_response_ms    != null ? `${sys.avg_response_ms} ms`                          : '—' },
                { label: 'معدل الخطأ',             val: sys.error_rate         != null ? `${sys.error_rate}%`                                 : '0%' },
                { label: 'المستخدمون اليوم',      val: sys.active_users_today ?? '—' },
                { label: 'Uptime',                 val: sys.uptime             ?? (data?.uptime_since ? `منذ ${data.uptime_since}` : '99.9%') },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{String(item.val)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
