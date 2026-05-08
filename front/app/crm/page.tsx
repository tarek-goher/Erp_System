'use client'

import { useState, useEffect, FormEvent, DragEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Lead = {
  id: number; name: string; email?: string; phone?: string; value?: number
  status: string; source?: string; notes?: string
  score?: number; score_label?: 'hot' | 'warm' | 'cold'
  assignedTo?: { name: string }; created_at: string
  last_activity?: string; email_opened?: boolean; email_replied?: boolean
}
type KanbanCol   = { stage: string; count: number; total_value: number; leads: Lead[] }
type Stats       = { total_leads: number; new_leads: number; qualified: number; won: number; pipeline_value: number; win_rate: number }
type Activity    = { id: number; type: string; description: string; created_at: string; created_by?: string; auto?: boolean }
type AutoRule    = { id: number; name: string; trigger: string; action: string; is_active: boolean; conditions?: string }
type ForecastRow = { stage: string; leads: number; value: number; probability: number; weighted: number }
type EmailStat   = { lead_id: number; lead_name: string; sent_at: string; opened: boolean; opened_at?: string; replied: boolean; replied_at?: string }

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

const STAGE_CFG: Record<string, { ar: string; en: string; color: string; probability: number }> = {
  new:         { ar: 'جديد',        en: 'New',         color: '#64748b', probability: 10 },
  contacted:   { ar: 'تم التواصل', en: 'Contacted',   color: '#2563eb', probability: 25 },
  qualified:   { ar: 'مؤهل',       en: 'Qualified',   color: '#7c3aed', probability: 40 },
  proposal:    { ar: 'عرض سعر',    en: 'Proposal',    color: '#d97706', probability: 60 },
  negotiation: { ar: 'تفاوض',       en: 'Negotiation', color: '#ea580c', probability: 75 },
  won:         { ar: 'مكتسب',      en: 'Won',         color: '#16a34a', probability: 100 },
  lost:        { ar: 'خسارة',      en: 'Lost',        color: '#dc2626', probability: 0 },
}

const SCORE_CFG = { 
  hot:  { ar: 'ساخن', en: 'Hot',  color: '#dc2626', icon: 'fa-fire' }, 
  warm: { ar: 'دافئ', en: 'Warm', color: '#d97706', icon: 'fa-temperature-half' }, 
  cold: { ar: 'بارد', en: 'Cold', color: '#2563eb', icon: 'fa-snowflake' } 
}

const ACTIVITY_TYPES = [
  { key: 'call',    ar: 'مكالمة',  en: 'Call',    icon: 'fa-phone' },
  { key: 'email',   ar: 'بريد',    en: 'Email',   icon: 'fa-envelope' },
  { key: 'meeting', ar: 'اجتماع',  en: 'Meeting', icon: 'fa-handshake' },
  { key: 'note',    ar: 'ملاحظة',  en: 'Note',    icon: 'fa-note-sticky' },
  { key: 'task',    ar: 'مهمة',    en: 'Task',    icon: 'fa-check-square' },
]

const TRIGGER_TYPES = [
  { key: 'stage_change',  ar: 'تغيير المرحلة',  en: 'Stage Change' },
  { key: 'score_above',   ar: 'النقاط فوق حد',   en: 'Score Above Threshold' },
  { key: 'no_activity',   ar: 'لا نشاط منذ 3 أيام', en: 'No Activity (3 days)' },
  { key: 'email_opened',  ar: 'فتح البريد',      en: 'Email Opened' },
]

const ACTION_TYPES = [
  { key: 'send_email',    ar: 'إرسال بريد تلقائي', en: 'Send Auto Email' },
  { key: 'create_task',   ar: 'إنشاء مهمة',         en: 'Create Task' },
  { key: 'notify_owner',  ar: 'إشعار المسؤول',     en: 'Notify Owner' },
  { key: 'change_stage',  ar: 'تغيير المرحلة',     en: 'Change Stage' },
]

// Safe getters to prevent app crashes if DB contains unknown statuses
const getStageCfg = (s: string) => STAGE_CFG[s] || { ar: s, en: s, color: '#94a3b8', probability: 0 }
const getScoreCfg = (s?: string) => s ? (SCORE_CFG[s as keyof typeof SCORE_CFG] || null) : null
const getActIcon  = (type: string) => ACTIVITY_TYPES.find(t => t.key === type)?.icon || 'fa-circle-dot'

type ViewType = 'kanban' | 'list' | 'forecast' | 'automation' | 'email'

export default function CRMPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [view,     setView]     = useState<ViewType>('kanban')
  const [kanban,   setKanban]   = useState<KanbanCol[]>([])
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [dragging, setDragging] = useState<Lead | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // Modals
  const [addModal,      setAddModal]      = useState(false)
  const [viewLead,      setViewLead]      = useState<Lead | null>(null)
  const [activities,    setActivities]    = useState<Activity[]>([])
  const [activityForm,  setActivityForm]  = useState({ type: 'call', description: '' })
  
  const [autoRules,     setAutoRules]     = useState<AutoRule[]>([])
  const [ruleModal,     setRuleModal]     = useState(false)
  const [editRule,      setEditRule]      = useState<AutoRule | null>(null)
  const [ruleForm,      setRuleForm]      = useState({ name: '', trigger: 'stage_change', action: 'send_email', is_active: true, conditions: '' })

  const [forecastRows, setForecastRows] = useState<ForecastRow[]>([])
  const [emailStats, setEmailStats] = useState<EmailStat[]>([])

  const [form, setForm] = useState({ name: '', email: '', phone: '', value: '', source: 'direct', status: 'new', notes: '' })

  const fetchData = async () => {
    setLoading(true)
    const [kRes, sRes] = await Promise.all([api.get<KanbanCol[]>('/crm/kanban'), api.get<Stats>('/crm/stats')])
    if (kRes.data) setKanban(extractArray(kRes.data) || [])
    if (sRes.data) setStats(sRes.data)
    setLoading(false)
  }

  const fetchActivities = async (leadId: number) => {
    const res = await api.get<Activity[]>(`/crm/leads/${leadId}/activities`)
    if (res.data) setActivities(Array.isArray(res.data) ? res.data : [])
  }

  const fetchAutoRules = async () => {
    const res = await api.get<AutoRule[]>('/crm/automation')
    if (res.data) setAutoRules(Array.isArray(res.data) ? res.data : [])
  }

  const fetchForecast = async () => {
    const res = await api.get<ForecastRow[]>('/crm/forecast')
    if (res.data) setForecastRows(Array.isArray(res.data) ? res.data : [])
  }

  const fetchEmailStats = async () => {
    const res = await api.get<EmailStat[]>('/crm/email-tracking')
    if (res.data) setEmailStats(Array.isArray(res.data) ? res.data : [])
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    if (view === 'automation') fetchAutoRules()
    if (view === 'forecast')   fetchForecast()
    if (view === 'email')      fetchEmailStats()
  }, [view])

  // Drag & Drop
  const onDragStart = (e: DragEvent, lead: Lead) => { setDragging(lead); e.dataTransfer.effectAllowed = 'move' }
  const onDragOver  = (e: DragEvent, stage: string) => { e.preventDefault(); setDragOver(stage) }
  const onDrop = async (e: DragEvent, stage: string) => {
    e.preventDefault(); setDragOver(null)
    if (!dragging || dragging.status === stage) return
    setKanban(prev => {
      const next = prev.map(c => ({ ...c, leads: (c.leads || []).filter(l => l.id !== dragging.id) }))
      return next.map(c => c.stage === stage ? { ...c, leads: [{ ...dragging, status: stage }, ...(c.leads || [])] } : c)
    })
    await api.put(`/crm/leads/${dragging.id}/stage`, { status: stage })
    setDragging(null); fetchData()
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault(); if (!form.name.trim()) return; setSaving(true)
    const res = await api.post('/crm/leads', { ...form, value: form.value ? Number(form.value) : undefined })
    setSaving(false)
    if (!res.error) { setAddModal(false); setForm({ name: '', email: '', phone: '', value: '', source: 'direct', status: 'new', notes: '' }); fetchData() }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(ar ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return
    await api.delete(`/crm/leads/${id}`); setViewLead(null); fetchData()
  }

  const addActivity = async (e: FormEvent) => {
    e.preventDefault(); if (!viewLead || !activityForm.description) return; setSaving(true)
    const res = await api.post(`/crm/leads/${viewLead.id}/activities`, activityForm)
    setSaving(false); if (!res.error) { setActivityForm({ type: 'call', description: '' }); fetchActivities(viewLead.id) }
  }

  const handleSaveRule = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = editRule ? await api.put(`/crm/automation/${editRule.id}`, ruleForm) : await api.post('/crm/automation', ruleForm)
    setSaving(false); if (!res.error) { setRuleModal(false); fetchAutoRules() }
  }

  const allLeads = kanban.flatMap(c => c.leads || [])
  
  // Safe Forecast Data Aggregation
  const displayForecast = forecastRows.length ? forecastRows : STAGES.filter(s => s !== 'lost').map(s => {
    const col = kanban.find(c => c.stage === s)
    const prob = getStageCfg(s).probability
    return { stage: s, leads: col?.count || 0, value: col?.total_value || 0, probability: prob, weighted: Math.round((col?.total_value || 0) * prob / 100) }
  })
  const totalWtd = displayForecast.reduce((s, r) => s + (r.weighted || 0), 0)

  return (
    <ERPLayout>
      {/* Load FontAwesome directly safely */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" precedence="default" />
      
      <div className="page-inner">
        <div className="page-header">
          <h1 className="page-title">{ar ? 'إدارة العملاء' : 'CRM'}</h1>
          <div className="toolbar-actions">
            {view === 'automation' && <button className="btn btn-primary" onClick={() => { setEditRule(null); setRuleForm({ name: '', trigger: 'stage_change', action: 'send_email', is_active: true, conditions: '' }); setRuleModal(true) }}><i className="fa-solid fa-plus"></i> {ar ? 'قاعدة جديدة' : 'New Rule'}</button>}
            {(view === 'kanban' || view === 'list') && <button className="btn btn-primary" onClick={() => setAddModal(true)}><i className="fa-solid fa-plus"></i> {ar ? 'إضافة عميل' : 'Add Lead'}</button>}
          </div>
        </div>

        {/* ══ Native Tabs Nav ══ */}
        <div className="tabs">
          {[
            { id: 'kanban', icon: 'fa-table-columns', ar: 'لوحة كانبان', en: 'Kanban Board' },
            { id: 'list', icon: 'fa-list', ar: 'قائمة العملاء', en: 'Leads List' },
            { id: 'forecast', icon: 'fa-chart-line', ar: 'توقعات المبيعات', en: 'Sales Forecast' },
            { id: 'automation', icon: 'fa-robot', ar: 'أتمتة', en: 'Automation' },
            { id: 'email', icon: 'fa-envelope-open-text', ar: 'تتبع البريد', en: 'Emails' }
          ].map(v => (
            <button 
              key={v.id} 
              onClick={() => setView(v.id as ViewType)} 
              className={`tab ${view === v.id ? 'active' : ''}`}
            >
              <i className={`fa-solid ${v.icon}`} style={{ marginInlineEnd: '8px' }}></i> 
              {ar ? v.ar : v.en}
            </button>
          ))}
        </div>

        {/* ══ Stats Grid (Responsive Layout) ══ */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: ar ? 'إجمالي العملاء' : 'Total Leads', value: stats.total_leads,   color: '#2563eb', icon: 'fa-users' },
              { label: ar ? 'العملاء المؤهلون' : 'Qualified',    value: stats.qualified,     color: '#7c3aed', icon: 'fa-check-circle' },
              { label: ar ? 'الصفقات المكتسبة' : 'Won Deals',     value: stats.won,           color: '#16a34a', icon: 'fa-trophy' },
              { label: ar ? 'نسبة الفوز' : 'Win Rate',        value: `${stats.win_rate || 0}%`, color: '#0ea5e9', icon: 'fa-chart-pie' },
              { label: ar ? 'القيمة المتوقعة' : 'Pipeline',   value: `${Number(stats.pipeline_value || 0).toLocaleString()} ${ar ? 'ج' : 'EGP'}`, color: '#d97706', icon: 'fa-sack-dollar' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
                <div className="stat-icon" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                  <i className={`fa-solid ${s.icon}`}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="stat-value" style={{ color: 'var(--text-primary)', fontSize: '1.4rem' }}>{s.value}</div>
                  <div className="stat-label" style={{ fontSize: '0.85rem' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ View: Kanban ══ */}
        {!loading && view === 'kanban' && (
          <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', minWidth: 'max-content' }}>
              {kanban.map(col => {
                const cfg = getStageCfg(col.stage)
                return (
                  <div key={col.stage} onDragOver={e => onDragOver(e, col.stage)} onDragLeave={() => setDragOver(null)} onDrop={e => onDrop(e, col.stage)}
                    style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 300px)', background: dragOver === col.stage ? 'var(--bg-selected)' : 'var(--bg-page)', borderRadius: 'var(--radius-lg)', border: dragOver === col.stage ? `2px dashed ${cfg.color}` : '2px solid transparent', transition: 'all 0.2s' }}>
                    
                    {/* Header */}
                    <div style={{ padding: '1rem', borderBottom: `3px solid ${cfg.color}`, background: 'var(--bg-card)', borderRadius: `var(--radius-lg) var(--radius-lg) 0 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: cfg.color, fontSize: '0.95rem' }}>{ar ? cfg.ar : cfg.en}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cfg.probability}%</span>
                        <span style={{ background: cfg.color, color: '#fff', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{col.count}</span>
                      </div>
                    </div>

                    {/* Value Summary */}
                    {col.total_value > 0 && (
                      <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
                        <i className="fa-solid fa-coins" style={{ marginInlineEnd: '4px' }}></i> {Number(col.total_value).toLocaleString()} {ar ? 'ج' : 'EGP'}
                      </div>
                    )}

                    {/* Draggable Leads Container */}
                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, minHeight: '120px' }}>
                      {(col.leads || []).map(lead => {
                        const sc = getScoreCfg(lead.score_label)
                        return (
                          <div key={lead.id} draggable onDragStart={e => onDragStart(e, lead)} onClick={() => { setViewLead(lead); fetchActivities(lead.id) }}
                            className="card" style={{ padding: '1rem', cursor: 'grab', opacity: dragging?.id === lead.id ? 0.4 : 1 }}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{lead.name}</div>
                              {sc && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sc.color, display: 'flex', alignItems: 'center', gap: '4px' }}><i className={`fa-solid ${sc.icon}`}></i> {ar ? sc.ar : sc.en}</span>}
                            </div>
                            
                            {lead.email && <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '6px' }}><i className="fa-regular fa-envelope" style={{width: 14}}></i> {lead.email}</div>}
                            
                            {lead.score != null && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                <div style={{ flex: 1, height: '4px', background: 'var(--bg-page)', borderRadius: 'var(--radius-full)' }}>
                                  <div style={{ width: `${lead.score}%`, height: '100%', background: sc?.color || '#94a3b8', borderRadius: 'var(--radius-full)' }} />
                                </div>
                                <span style={{ fontSize: '0.7rem', color: sc?.color || 'var(--text-muted)', fontWeight: 600 }}>{lead.score}</span>
                              </div>
                            )}

                            {lead.value != null && <div style={{ marginTop: '8px', fontWeight: 700, color: 'var(--color-success)', fontSize: '0.9rem' }}>{Number(lead.value).toLocaleString()} {ar ? 'ج' : 'EGP'}</div>}
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                              {lead.email_opened  && <span title={ar ? 'فتح البريد' : 'Email opened'}  style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}><i className="fa-solid fa-envelope-open"></i></span>}
                              {lead.email_replied && <span title={ar ? 'تم الرد' : 'Email replied'}    style={{ fontSize: '0.85rem', color: 'var(--color-info)' }}><i className="fa-solid fa-reply-all"></i></span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ View: List ══ */}
        {!loading && view === 'list' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'الاسم' : 'Name'}</th>
                  <th>{ar ? 'النقاط' : 'Score'}</th>
                  <th>{ar ? 'المرحلة' : 'Stage'}</th>
                  <th>{ar ? 'القيمة' : 'Value'}</th>
                  <th>{ar ? 'البريد' : 'Email Stats'}</th>
                  <th>{ar ? 'آخر نشاط' : 'Last Activity'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {allLeads.map(lead => {
                  const cfg = getStageCfg(lead.status)
                  const sc  = getScoreCfg(lead.score_label)
                  return (
                    <tr key={lead.id}>
                      <td><div style={{ fontWeight: 600 }}>{lead.name}</div>{lead.email && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{lead.email}</div>}</td>
                      <td>
                        {lead.score != null ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: 60, height: 4, background: 'var(--bg-page)', borderRadius: 'var(--radius-full)' }}>
                                <div style={{ width: `${lead.score}%`, height: '100%', background: sc?.color || '#94a3b8', borderRadius: 'var(--radius-full)' }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: sc?.color }}>{lead.score}</span>
                            </div>
                            {sc && <div style={{ fontSize: '0.75rem', color: sc.color, marginTop: '4px' }}><i className={`fa-solid ${sc.icon}`}></i> {ar ? sc.ar : sc.en}</div>}
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td><span style={{ background: cfg?.color, color: '#fff', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>{ar ? cfg?.ar : cfg?.en}</span></td>
                      <td style={{ fontWeight: 600 }}>{lead.value ? `${Number(lead.value).toLocaleString()} ${ar ? 'ج' : 'EGP'}` : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {lead.email_opened  && <span title="Opened"  style={{ color: 'var(--color-success)' }}><i className="fa-solid fa-envelope-open"></i></span>}
                          {lead.email_replied && <span title="Replied" style={{ color: 'var(--color-info)' }}><i className="fa-solid fa-reply-all"></i></span>}
                          {!lead.email_opened && !lead.email_replied && <span className="text-muted">—</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lead.last_activity ? new Date(lead.last_activity).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setViewLead(lead); fetchActivities(lead.id) }}><i className="fa-solid fa-eye"></i> {ar ? 'عرض' : 'View'}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ View: Forecast ══ */}
        {view === 'forecast' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', borderTop: '4px solid #7c3aed', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
               <div className="stat-label" style={{ fontSize: '1rem' }}><i className="fa-solid fa-chart-line" style={{ marginInlineEnd: '6px' }}></i>{ar ? 'إجمالي التوقعات المرجحة' : 'Total Weighted Forecast'}</div>
               <div className="stat-value" style={{ color: '#7c3aed', fontSize: '2.5rem', marginTop: '0.5rem' }}>{Number(totalWtd).toLocaleString()} {ar ? 'ج' : 'EGP'}</div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{ar ? 'المرحلة' : 'Stage'}</th>
                    <th>{ar ? 'عدد الصفقات' : 'Deals'}</th>
                    <th>{ar ? 'القيمة الكاملة' : 'Full Value'}</th>
                    <th>{ar ? 'نسبة الاحتمال' : 'Probability'}</th>
                    <th>{ar ? 'القيمة المرجحة' : 'Weighted Value'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayForecast.map((row, i) => {
                    const cfg = getStageCfg(row.stage)
                    return (
                      <tr key={i}>
                        <td><span style={{ background: cfg?.color, color: '#fff', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>{ar ? cfg?.ar : cfg?.en || row.stage}</span></td>
                        <td style={{ fontWeight: 600 }}>{row.leads}</td>
                        <td>{Number(row.value).toLocaleString()} {ar ? 'ج' : 'EGP'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 80, height: 6, background: 'var(--bg-page)', borderRadius: 'var(--radius-full)' }}>
                              <div style={{ width: `${row.probability}%`, height: '100%', background: cfg?.color || '#94a3b8', borderRadius: 'var(--radius-full)' }} />
                            </div>
                            <span style={{ fontWeight: 600, color: cfg?.color }}>{row.probability}%</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#7c3aed' }}>{Number(row.weighted).toLocaleString()} {ar ? 'ج' : 'EGP'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ View: Automation ══ */}
        {view === 'automation' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'اسم القاعدة' : 'Rule Name'}</th>
                  <th>{ar ? 'المُشغِّل' : 'Trigger'}</th>
                  <th>{ar ? 'الإجراء' : 'Action'}</th>
                  <th>{ar ? 'الشروط' : 'Conditions'}</th>
                  <th>{ar ? 'الحالة' : 'Status'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {autoRules.map(r => {
                  const trg = TRIGGER_TYPES.find(t => t.key === r.trigger)
                  const act = ACTION_TYPES.find(a => a.key === r.action)
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td><span className="badge badge-info"><i className="fa-solid fa-bolt" style={{marginInlineEnd: 4}}></i> {ar ? trg?.ar : trg?.en || r.trigger}</span></td>
                      <td><span className="badge badge-warning"><i className="fa-solid fa-play" style={{marginInlineEnd: 4}}></i> {ar ? act?.ar : act?.en || r.action}</span></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.conditions || '—'}</td>
                      <td><span className={`badge ${r.is_active ? 'badge-success' : 'badge-muted'}`}>{r.is_active ? (ar ? 'فعّال' : 'Active') : (ar ? 'متوقف' : 'Inactive')}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon text-info" onClick={() => { setEditRule(r); setRuleForm({ name: r.name, trigger: r.trigger, action: r.action, is_active: r.is_active, conditions: r.conditions || '' }); setRuleModal(true) }}><i className="fa-solid fa-pen"></i></button>
                          <button className="btn-icon text-danger" onClick={async () => { if (confirm(ar ? 'حذف؟' : 'Delete?')) { await api.delete(`/crm/automation/${r.id}`); fetchAutoRules() } }}><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {autoRules.length === 0 && <tr><td colSpan={6} className="empty-state"><i className="fa-solid fa-robot empty-state-icon"></i><div className="empty-state-text">{ar ? 'لا توجد قواعد أتمتة' : 'No automation rules'}</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ View: Email Tracking ══ */}
        {view === 'email' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'العميل' : 'Lead'}</th>
                  <th>{ar ? 'تاريخ الإرسال' : 'Sent At'}</th>
                  <th>{ar ? 'فُتح' : 'Opened'}</th>
                  <th>{ar ? 'وقت الفتح' : 'Opened At'}</th>
                  <th>{ar ? 'رد' : 'Replied'}</th>
                  <th>{ar ? 'وقت الرد' : 'Replied At'}</th>
                </tr>
              </thead>
              <tbody>
                {emailStats.map((es, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{es.lead_name}</td>
                    <td>{es.sent_at ? new Date(es.sent_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                    <td><span className={`badge ${es.opened ? 'badge-success' : 'badge-muted'}`}>{es.opened ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No')}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{es.opened_at ? new Date(es.opened_at).toLocaleString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                    <td><span className={`badge ${es.replied ? 'badge-success' : 'badge-muted'}`}>{es.replied ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No')}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{es.replied_at ? new Date(es.replied_at).toLocaleString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                  </tr>
                ))}
                {emailStats.length === 0 && <tr><td colSpan={6} className="empty-state"><i className="fa-solid fa-envelope-open-text empty-state-icon"></i><div className="empty-state-text">{ar ? 'لا توجد بيانات تتبع' : 'No email tracking data'}</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto', width: 40, height: 40, borderWidth: 3 }} /></div>}

        {/* ══ Modal: Add Lead ══ */}
        {addModal && (
          <div className="modal-overlay" onClick={() => setAddModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title"><i className="fa-solid fa-user-plus" style={{ marginInlineEnd: '8px' }}></i>{ar ? 'إضافة عميل' : 'Add Lead'}</h2>
                <button className="btn-icon" onClick={() => setAddModal(false)}><i className="fa-solid fa-xmark"></i></button>
              </div>
              <form onSubmit={handleAdd}>
                <div className="modal-body flex-col gap-3">
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">{ar ? 'الاسم *' : 'Name *'}</label>
                      <div style={{position: 'relative'}}>
                        <i className="fa-solid fa-user text-muted" style={{position: 'absolute', top: '50%', transform: 'translateY(-50%)', [ar ? 'right' : 'left']: '12px'}}></i>
                        <input className="input" type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ [ar ? 'paddingRight' : 'paddingLeft']: '36px' }} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">{ar ? 'البريد الإلكتروني' : 'Email'}</label>
                      <div style={{position: 'relative'}}>
                        <i className="fa-solid fa-envelope text-muted" style={{position: 'absolute', top: '50%', transform: 'translateY(-50%)', [ar ? 'right' : 'left']: '12px'}}></i>
                        <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ [ar ? 'paddingRight' : 'paddingLeft']: '36px' }} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">{ar ? 'رقم الهاتف' : 'Phone'}</label>
                      <div style={{position: 'relative'}}>
                        <i className="fa-solid fa-phone text-muted" style={{position: 'absolute', top: '50%', transform: 'translateY(-50%)', [ar ? 'right' : 'left']: '12px'}}></i>
                        <input className="input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ [ar ? 'paddingRight' : 'paddingLeft']: '36px' }} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">{ar ? 'القيمة المتوقعة' : 'Expected Value'}</label>
                      <div style={{position: 'relative'}}>
                        <i className="fa-solid fa-coins text-muted" style={{position: 'absolute', top: '50%', transform: 'translateY(-50%)', [ar ? 'right' : 'left']: '12px'}}></i>
                        <input className="input" type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} style={{ [ar ? 'paddingRight' : 'paddingLeft']: '36px' }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">{ar ? 'المرحلة' : 'Stage'}</label>
                    <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      {STAGES.map(s => <option key={s} value={s}>{ar ? getStageCfg(s).ar : getStageCfg(s).en}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'ملاحظات' : 'Notes'}</label>
                    <textarea className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check"></i> {ar ? 'إضافة' : 'Add'}</>}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: View Lead + Timeline ══ */}
        {viewLead && (
          <div className="modal-overlay" onClick={() => setViewLead(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-circle-user text-muted"></i> {viewLead.name}
                  </h2>
                  {viewLead.score != null && (
                    <div style={{ fontSize: '0.85rem', marginTop: '4px', color: getScoreCfg(viewLead.score_label)?.color || 'var(--text-muted)', fontWeight: 600 }}>
                      <i className="fa-solid fa-star-half-stroke"></i> {ar ? 'النقاط:' : 'Score:'} {viewLead.score}/100 
                      {viewLead.score_label && ` — `}
                      {viewLead.score_label && <><i className={`fa-solid ${getScoreCfg(viewLead.score_label)?.icon}`}></i> {ar ? getScoreCfg(viewLead.score_label)?.ar : getScoreCfg(viewLead.score_label)?.en}</>}
                    </div>
                  )}
                </div>
                <button className="btn-icon" onClick={() => setViewLead(null)}><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '75vh' }}>
                
                {/* Lead info */}
                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem', background: 'var(--bg-page)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  {[
                    { icon: 'fa-bars-progress', label: ar ? 'المرحلة' : 'Stage', value: <span style={{ background: getStageCfg(viewLead.status).color, color: '#fff', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}>{ar ? getStageCfg(viewLead.status).ar : getStageCfg(viewLead.status).en}</span> },
                    { icon: 'fa-envelope', label: ar ? 'البريد' : 'Email',  value: viewLead.email },
                    { icon: 'fa-phone', label: ar ? 'الهاتف' : 'Phone',  value: viewLead.phone },
                    { icon: 'fa-coins', label: ar ? 'القيمة' : 'Value',  value: viewLead.value ? <span className="text-success fw-bold">{Number(viewLead.value).toLocaleString()} {ar ? 'ج' : 'EGP'}</span> : null },
                    { icon: 'fa-note-sticky', label: ar ? 'ملاحظات' : 'Notes', value: viewLead.notes },
                  ].filter(r => r.value).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <span className="text-muted" style={{ width: 120, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><i className={`fa-solid ${r.icon}`}></i> {r.label}</span>
                      <span className="fw-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Add activity */}
                <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.05rem' }}><i className="fa-solid fa-calendar-plus text-primary"></i> {ar ? 'إضافة نشاط' : 'Add Activity'}</div>
                <form onSubmit={addActivity}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <select className="input" value={activityForm.type} onChange={e => setActivityForm(f => ({ ...f, type: e.target.value }))} style={{ width: 160 }}>
                      {ACTIVITY_TYPES.map(t => <option key={t.key} value={t.key}>{ar ? t.ar : t.en}</option>)}
                    </select>
                    <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder={ar ? 'وصف النشاط...' : 'Activity description...'} value={activityForm.description} onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} required />
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-plus"></i> {ar ? 'إضافة' : 'Add'}</>}</button>
                  </div>
                </form>

                {/* Timeline */}
                <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.05rem' }}><i className="fa-solid fa-timeline text-primary"></i> {ar ? 'سجل النشاط' : 'Activity Timeline'}</div>
                <div className="flex-col gap-2">
                  {activities.map(a => {
                    return (
                      <div key={a.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: a.auto ? 'var(--color-info-light)' : 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, boxShadow: 'var(--shadow-sm)', color: a.auto ? 'var(--color-info)' : 'var(--text-secondary)' }}>
                          <i className={`fa-solid ${getActIcon(a.type)}`}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{a.description}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-user-pen"></i> {a.created_by || (a.auto ? (ar ? 'نظام تلقائي' : 'Auto') : '')}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleString(ar ? 'ar-EG' : 'en-US')}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {activities.length === 0 && <div className="empty-state" style={{ padding: '2rem' }}><i className="fa-solid fa-clock-rotate-left empty-state-icon"></i><div className="empty-state-text">{ar ? 'لا توجد أنشطة بعد' : 'No activities yet'}</div></div>}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => handleDelete(viewLead.id)}><i className="fa-solid fa-trash"></i> {ar ? 'حذف العميل' : 'Delete Lead'}</button>
                <button className="btn btn-secondary" onClick={() => setViewLead(null)}>{ar ? 'إغلاق' : 'Close'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Modal: Automation Rule ══ */}
        {ruleModal && (
          <div className="modal-overlay" onClick={() => setRuleModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
              <div className="modal-header">
                <h2 className="modal-title"><i className="fa-solid fa-bolt text-warning" style={{ marginInlineEnd: '8px' }}></i> {editRule ? (ar ? 'تعديل قاعدة' : 'Edit Rule') : (ar ? 'قاعدة جديدة' : 'New Rule')}</h2>
                <button className="btn-icon" onClick={() => setRuleModal(false)}><i className="fa-solid fa-xmark"></i></button>
              </div>
              <form onSubmit={handleSaveRule}>
                <div className="modal-body flex-col gap-3">
                  <div className="input-group">
                    <label className="input-label">{ar ? 'اسم القاعدة *' : 'Rule Name *'}</label>
                    <input className="input" value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">{ar ? 'المُشغِّل *' : 'Trigger *'}</label>
                      <select className="input" value={ruleForm.trigger} onChange={e => setRuleForm(f => ({ ...f, trigger: e.target.value }))}>
                        {TRIGGER_TYPES.map(t => <option key={t.key} value={t.key}>{ar ? t.ar : t.en}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">{ar ? 'الإجراء *' : 'Action *'}</label>
                      <select className="input" value={ruleForm.action} onChange={e => setRuleForm(f => ({ ...f, action: e.target.value }))}>
                        {ACTION_TYPES.map(a => <option key={a.key} value={a.key}>{ar ? a.ar : a.en}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'شروط إضافية' : 'Additional Conditions'}</label>
                    <textarea className="input" rows={2} value={ruleForm.conditions} onChange={e => setRuleForm(f => ({ ...f, conditions: e.target.value }))} placeholder={ar ? 'مثال: stage=qualified' : 'e.g. stage=qualified'} />
                  </div>
                  
                  <div style={{ padding: '1rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input type="checkbox" checked={ruleForm.is_active} onChange={e => setRuleForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 18, height: 18 }} />
                      {ar ? 'القاعدة فعّالة (Active)' : 'Rule is active'}
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setRuleModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check"></i> {ar ? 'حفظ' : 'Save'}</>}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}