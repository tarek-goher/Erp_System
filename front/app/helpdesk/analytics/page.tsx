'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { StatCard, ToastContainer } from '../../../components/ui'
import { useToast } from '../../../hooks/useToast'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#6366f1','#0ea5e9','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899']

const PRIORITY_AR: Record<string, string> = {
  low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة',
}

type Overview = {
  period_days: number
  total_tickets: number
  resolved_tickets: number
  resolve_rate: number
  sla_compliance: number | null
  avg_resolution_hours: number | null
  avg_first_response_hours: number | null
  overdue_now: number
  by_priority: Record<string, number>
  by_status: Record<string, number>
}

type Agent = {
  agent_id: number
  agent_name: string
  total: number
  resolved: number
  resolve_rate: number
  avg_resolution_hours: number | null
  sla_breaches: number
  avg_csat: number | null
}

type VolumeSeries = { date?: string; week?: string; created: number; resolved: number }

type SlaItem = { priority: string; total: number; on_time: number; breached: number; compliance: number | null }

export default function HelpdeskAnalyticsPage() {
  const { toasts, show, remove } = useToast()
  const [loading, setLoading] = useState(true)
  const [days, setDays]       = useState<7|30|90>(30)

  const [overview,  setOverview]  = useState<Overview | null>(null)
  const [agents,    setAgents]    = useState<Agent[]>([])
  const [volume,    setVolume]    = useState<VolumeSeries[]>([])
  const [slaData,   setSlaData]   = useState<SlaItem[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const [ovRes, teamRes, volRes, slaRes] = await Promise.all([
        api.get(`/helpdesk/analytics/overview?days=${days}`),
        api.get(`/helpdesk/analytics/team?days=${days}`),
        api.get(`/helpdesk/analytics/volume?days=${days}`),
        api.get(`/helpdesk/analytics/sla?days=${days}`),
      ])
      if (ovRes.data)    setOverview(ovRes.data)
      if (teamRes.data)  setAgents(teamRes.data.agents || [])
      if (volRes.data)   setVolume(volRes.data.series || [])
      if (slaRes.data)   setSlaData(slaRes.data.per_priority || [])
    } catch {
      show('خطأ في تحميل البيانات', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [days])

  // بيانات الـ by_priority للـ Pie Chart
  const priorityChartData = overview
    ? Object.entries(overview.by_priority).map(([k, v], i) => ({
        name: PRIORITY_AR[k] || k,
        count: v,
        color: COLORS[i % COLORS.length],
      }))
    : []

  // بيانات SLA للـ Bar Chart
  const slaChartData = slaData.map(s => ({
    name: PRIORITY_AR[s.priority] || s.priority,
    ملتزم: s.on_time,
    خرق:   s.breached,
  }))

  return (
    <ERPLayout pageTitle="تحليلات الدعم الفني">
      <ToastContainer toasts={toasts} remove={remove} />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 تحليلات الدعم الفني</h1>
          <p className="page-subtitle">مؤشرات الأداء • إحصائيات الفريق • SLA</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', background:'var(--bg-hover)', borderRadius:'var(--radius-md)', padding:4, gap:2 }}>
            {([7,30,90] as const).map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding:'4px 12px', borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer',
                  background: days===d ? 'var(--bg-card)' : 'transparent',
                  color:      days===d ? 'var(--color-primary)' : 'var(--text-muted)',
                  fontWeight: days===d ? 700 : 400, fontSize:'0.8rem', fontFamily:'inherit',
                }}
              >
                {d===7 ? '7 أيام' : d===30 ? '30 يوم' : '3 أشهر'}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
            {loading ? '⏳' : '🔄'} تحديث
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {Array(4).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:80 }} />)}
        </div>
      ) : overview ? (
        <>
          {/* STATS */}
          <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
            <StatCard icon="🎫" label="إجمالي التذاكر"     value={overview.total_tickets}                                              accent="var(--color-primary)" />
            <StatCard icon="✅" label="تم الحل"             value={overview.resolved_tickets}                                           accent="var(--color-success)" />
            <StatCard icon="📈" label="معدل الحل"          value={`${overview.resolve_rate}%`}                                         accent="var(--color-success)" />
            <StatCard icon="⚠️" label="متأخرة الآن"        value={overview.overdue_now}                                                accent="var(--color-danger)" />
            <StatCard icon="⏱️" label="متوسط وقت الحل"    value={overview.avg_resolution_hours ? `${overview.avg_resolution_hours}س` : '—'} accent="var(--color-info)" />
            <StatCard icon="⚡" label="متوسط أول رد"       value={overview.avg_first_response_hours ? `${overview.avg_first_response_hours}س` : '—'} accent="var(--color-secondary)" />
            <StatCard icon="🎯" label="التزام SLA"         value={overview.sla_compliance !== null ? `${overview.sla_compliance}%` : '—'} accent="var(--color-warning)" />
            <StatCard icon="🔴" label="مفتوحة"             value={overview.by_status['open'] || 0}                                     accent="var(--color-danger)" />
          </div>

          {/* CHARTS ROW 1 */}
          <div className="grid-2" style={{ marginBottom:'1.5rem' }}>
            {/* Volume Chart */}
            <div className="card">
              <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.95rem' }}>📈 حجم التذاكر</h3>
              {volume.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={volume} margin={{ top:5, right:5, bottom:0, left:-20 }}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey={volume[0]?.date ? 'date' : 'week'} tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize:12 }} />
                    <Area type="monotone" dataKey="created"  name="جديدة"  stroke="#6366f1" fill="url(#cg)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="resolved" name="محلولة" stroke="#22c55e" fill="url(#rg)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Priority Pie */}
            <div className="card">
              <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.95rem' }}>🗂️ توزيع حسب الأولوية</h3>
              {priorityChartData.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>لا توجد بيانات</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={priorityChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" paddingAngle={3}>
                        {priorityChartData.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                    {priorityChartData.map((c, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.8rem' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-secondary)' }}>
                          <span style={{ width:10, height:10, borderRadius:'50%', background:c.color, display:'inline-block' }} />
                          {c.name}
                        </span>
                        <span style={{ fontWeight:700 }}>{c.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CHARTS ROW 2 */}
          <div className="grid-2">
            {/* SLA Bar */}
            <div className="card">
              <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.95rem' }}>⏰ الالتزام بـ SLA</h3>
              {slaChartData.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={slaChartData} layout="vertical" margin={{ top:5, right:5, bottom:0, left:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis type="number" tick={{ fontSize:11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize:11 }} width={50} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize:12 }} />
                    <Bar dataKey="ملتزم" stackId="a" fill="#22c55e" />
                    <Bar dataKey="خرق"   stackId="a" fill="#ef4444" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Team Performance */}
            <div className="card">
              <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.95rem' }}>👥 أداء الفريق</h3>
              {agents.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>لا توجد بيانات</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>الموظف</th>
                        <th>محلولة</th>
                        <th>معدل</th>
                        <th>متوسط</th>
                        <th>خرق SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.sort((a,b) => b.resolved - a.resolved).map((a, i) => (
                        <tr key={a.agent_id}>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:30, height:30, borderRadius:'50%', background:COLORS[i%COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'#fff', flexShrink:0 }}>
                                {a.agent_name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight:600, fontSize:'0.8rem' }}>{a.agent_name}</div>
                                {i===0 && <div style={{ fontSize:'0.65rem', color:'#f59e0b' }}>🏆 الأفضل</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight:700, color:'var(--color-success)' }}>{a.resolved}</td>
                          <td>
                            <span style={{
                              fontSize:'0.75rem', padding:'2px 6px', borderRadius:'var(--radius-full)',
                              background: a.resolve_rate >= 80 ? 'var(--color-success-light)' : a.resolve_rate >= 60 ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                              color:      a.resolve_rate >= 80 ? 'var(--color-success)'       : a.resolve_rate >= 60 ? 'var(--color-warning)'       : 'var(--color-danger)',
                            }}>{a.resolve_rate}%</span>
                          </td>
                          <td>
                            {a.avg_resolution_hours
                              ? <span style={{ fontSize:'0.75rem', padding:'2px 6px', borderRadius:'var(--radius-full)', background: a.avg_resolution_hours < 4 ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: a.avg_resolution_hours < 4 ? 'var(--color-success)' : 'var(--color-warning)' }}>{a.avg_resolution_hours}س</span>
                              : '—'
                            }
                          </td>
                          <td style={{ color: a.sla_breaches > 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                            {a.sla_breaches}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'3rem' }}>لا توجد بيانات</div>
      )}
    </ERPLayout>
  )
}
