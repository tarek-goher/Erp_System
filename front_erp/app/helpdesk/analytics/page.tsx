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

const MOCK = {
  overview: { total:422,open:34,resolved:358,in_progress:30,avg_resolution_hours:3.8,sla_breached:18,satisfaction:4.65,first_response_avg_minutes:24 },
  trends: [
    {date:'1/4',open:12,resolved:8,in_progress:5},{date:'2/4',open:15,resolved:12,in_progress:7},
    {date:'3/4',open:9,resolved:15,in_progress:4},{date:'4/4',open:18,resolved:10,in_progress:9},
    {date:'5/4',open:11,resolved:14,in_progress:6},{date:'7/4',open:20,resolved:16,in_progress:8},
  ],
  categories: [
    {name:'تقني',count:145,color:'#6366f1'},{name:'فواتير',count:89,color:'#0ea5e9'},
    {name:'شحن',count:67,color:'#22c55e'},{name:'منتج',count:54,color:'#f59e0b'},
    {name:'حساب',count:38,color:'#ef4444'},{name:'أخرى',count:29,color:'#8b5cf6'},
  ],
  agents: [
    {name:'أحمد محمد',resolved:87,avg_hours:3.2,satisfaction:4.8,open:5},
    {name:'سارة علي',resolved:72,avg_hours:4.1,satisfaction:4.6,open:8},
    {name:'محمود حسن',resolved:95,avg_hours:2.8,satisfaction:4.9,open:3},
    {name:'فاطمة خالد',resolved:61,avg_hours:5.5,satisfaction:4.3,open:12},
    {name:'علي أحمد',resolved:78,avg_hours:3.8,satisfaction:4.7,open:6},
  ],
  sla: [
    {name:'عاجلة',breached:3,met:47},{name:'عالية',breached:8,met:72},
    {name:'متوسطة',breached:5,met:120},{name:'منخفضة',breached:2,met:89},
  ],
}

export default function HelpdeskAnalyticsPage() {
  const { toasts, show, remove } = useToast()
  const [loading, setLoading] = useState(true)
  const [range, setRange]     = useState<'7d'|'30d'|'90d'>('30d')
  const [isMock, setIsMock]   = useState(false)
  const [data, setData]       = useState(MOCK)

  const load = async () => {
    setLoading(true)
    const res = await api.get(`/helpdesk/analytics?range=${range}`)
    if (res.data?.overview) {
      setIsMock(false)
      setData({ overview: res.data.overview, trends: res.data.trends??MOCK.trends, categories: res.data.categories??MOCK.categories, agents: res.data.agents??MOCK.agents, sla: res.data.sla??MOCK.sla })
    } else { setIsMock(true); setData(MOCK) }
    setLoading(false)
  }
  useEffect(() => { load() }, [range])

  const { overview, trends, categories, agents, sla } = data

  return (
    <ERPLayout pageTitle="تحليلات الدعم الفني">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div><h1 className="page-title">📊 تحليلات الدعم الفني</h1><p className="page-subtitle">مؤشرات الأداء • إحصائيات الفريق • SLA</p></div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          {isMock && <span style={{ padding:'4px 10px',background:'var(--color-warning-light)',color:'var(--color-warning)',borderRadius:'var(--radius-full)',fontSize:'0.75rem',fontWeight:600 }}>⚠️ بيانات تجريبية</span>}
          <div style={{ display:'flex',background:'var(--bg-hover)',borderRadius:'var(--radius-md)',padding:4,gap:2 }}>
            {(['7d','30d','90d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)} style={{ padding:'4px 12px',borderRadius:'var(--radius-sm)',border:'none',cursor:'pointer',background:range===r?'var(--bg-card)':'transparent',color:range===r?'var(--color-primary)':'var(--text-muted)',fontWeight:range===r?700:400,fontSize:'0.8rem',fontFamily:'inherit' }}>
                {r==='7d'?'7 أيام':r==='30d'?'30 يوم':'3 أشهر'}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>{loading?'⏳':'🔄'} تحديث</button>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
        <StatCard icon="🎫" label="إجمالي التذاكر"     value={overview.total}                               accent="var(--color-primary)" />
        <StatCard icon="🔴" label="تذاكر مفتوحة"       value={overview.open}                                accent="var(--color-danger)" />
        <StatCard icon="⏱️" label="متوسط الحل (ساعة)"  value={`${overview.avg_resolution_hours}h`}         accent="var(--color-info)" />
        <StatCard icon="⭐" label="رضا العملاء"         value={`${overview.satisfaction}/5`}                accent="var(--color-warning)" />
        <StatCard icon="✅" label="تم الحل"             value={overview.resolved}                            accent="var(--color-success)" />
        <StatCard icon="⚡" label="متوسط أول رد"       value={`${overview.first_response_avg_minutes}m`}   accent="var(--color-secondary)" />
        <StatCard icon="🚨" label="خرق SLA"            value={overview.sla_breached}                        accent="var(--color-danger)" />
        <StatCard icon="📈" label="معدل الحل"          value={`${Math.round((overview.resolved/overview.total)*100)}%`} accent="var(--color-success)" />
      </div>
      <div className="grid-2" style={{ marginBottom:'1.5rem' }}>
        <div className="card">
          <h3 style={{ fontWeight:700,marginBottom:'1rem',fontSize:'0.95rem' }}>📈 اتجاه التذاكر اليومي</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trends} margin={{ top:5,right:5,bottom:0,left:-20 }}>
              <defs>
                <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize:11 }} /><YAxis tick={{ fontSize:11 }} />
              <Tooltip /><Legend wrapperStyle={{ fontSize:12 }} />
              <Area type="monotone" dataKey="open"        name="مفتوحة" stroke="#ef4444" fill="url(#og)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="resolved"    name="محلولة" stroke="#22c55e" fill="url(#rg)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="in_progress" name="جارية"  stroke="#f59e0b" fill="none"     strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontWeight:700,marginBottom:'1rem',fontSize:'0.95rem' }}>🗂️ توزيع حسب الفئة</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={categories} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" paddingAngle={3}>
              {categories.map((c,i) => <Cell key={i} fill={c.color} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex',flexDirection:'column',gap:6,marginTop:8 }}>
            {categories.map((c,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'0.8rem' }}>
                <span style={{ display:'flex',alignItems:'center',gap:6,color:'var(--text-secondary)' }}>
                  <span style={{ width:10,height:10,borderRadius:'50%',background:c.color,display:'inline-block' }} />{c.name}
                </span>
                <span style={{ fontWeight:700 }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontWeight:700,marginBottom:'1rem',fontSize:'0.95rem' }}>⏰ الالتزام بـ SLA</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sla} layout="vertical" margin={{ top:5,right:5,bottom:0,left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" tick={{ fontSize:11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize:11 }} width={45} />
              <Tooltip /><Legend wrapperStyle={{ fontSize:12 }} />
              <Bar dataKey="met" name="ملتزم" stackId="a" fill="#22c55e" />
              <Bar dataKey="breached" name="خرق" stackId="a" fill="#ef4444" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontWeight:700,marginBottom:'1rem',fontSize:'0.95rem' }}>👥 أداء الفريق</h3>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr><th>الموظف</th><th>محلولة</th><th>مفتوحة</th><th>متوسط</th><th>الرضا</th></tr></thead>
              <tbody>
                {agents.sort((a,b) => b.resolved-a.resolved).map((a,i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <div style={{ width:30,height:30,borderRadius:'50%',background:COLORS[i%COLORS.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,color:'#fff',flexShrink:0 }}>{a.name.charAt(0)}</div>
                        <div><div style={{ fontWeight:600,fontSize:'0.8rem' }}>{a.name}</div>{i===0&&<div style={{ fontSize:'0.65rem',color:'#f59e0b' }}>🏆 الأفضل</div>}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight:700,color:'var(--color-success)' }}>{a.resolved}</td>
                    <td style={{ color: a.open>8?'var(--color-danger)':'var(--text-primary)' }}>{a.open}</td>
                    <td><span style={{ fontSize:'0.75rem',padding:'2px 6px',borderRadius:'var(--radius-full)',background:a.avg_hours<4?'var(--color-success-light)':a.avg_hours<6?'var(--color-warning-light)':'var(--color-danger-light)',color:a.avg_hours<4?'var(--color-success)':a.avg_hours<6?'var(--color-warning)':'var(--color-danger)' }}>{a.avg_hours}h</span></td>
                    <td style={{ fontWeight:700 }}>{a.satisfaction} ⭐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ERPLayout>
  )
}
