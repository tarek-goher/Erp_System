'use client'

// ══════════════════════════════════════════════════════════
// app/crm/page.tsx — CRM (Enhanced)
// NEW: Lead Scoring, Automation, Email Tracking,
//      Forecasting, Smart Activities Timeline
// API: GET /api/crm/kanban
//      PUT /api/crm/leads/{id}/stage
//      GET /api/crm/stats
//      POST/DELETE /api/crm/leads
//      GET /api/crm/leads/{id}/activities
//      POST /api/crm/leads/{id}/activities
//      GET /api/crm/automation
//      POST/PUT/DELETE /api/crm/automation
//      GET /api/crm/forecast
//      GET /api/crm/email-tracking
// ══════════════════════════════════════════════════════════

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

const SCORE_CFG = { hot: { ar: '🔥 ساخن', en: '🔥 Hot', color: '#dc2626' }, warm: { ar: '🌤️ دافئ', en: '🌤️ Warm', color: '#d97706' }, cold: { ar: '🧊 بارد', en: '🧊 Cold', color: '#2563eb' } }

export default function CRMPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [view,     setView]     = useState<'kanban' | 'list' | 'forecast' | 'automation' | 'email'>('kanban')
  const [kanban,   setKanban]   = useState<KanbanCol[]>([])
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [dragging, setDragging] = useState<Lead | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // Lead modals
  const [addModal,      setAddModal]      = useState(false)
  const [viewLead,      setViewLead]      = useState<Lead | null>(null)
  const [activities,    setActivities]    = useState<Activity[]>([])
  const [activityForm,  setActivityForm]  = useState({ type: 'call', description: '' })

  // Automation
  const [autoRules,     setAutoRules]     = useState<AutoRule[]>([])
  const [ruleModal,     setRuleModal]     = useState(false)
  const [editRule,      setEditRule]      = useState<AutoRule | null>(null)
  const [ruleForm,      setRuleForm]      = useState({ name: '', trigger: 'stage_change', action: 'send_email', is_active: true, conditions: '' })

  // Forecast
  const [forecastRows, setForecastRows] = useState<ForecastRow[]>([])

  // Email tracking
  const [emailStats, setEmailStats] = useState<EmailStat[]>([])

  const [form, setForm] = useState({ name: '', email: '', phone: '', value: '', source: 'direct', status: 'new', notes: '' })

  const fetchData = async () => {
    setLoading(true)
    const [kRes, sRes] = await Promise.all([api.get<KanbanCol[]>('/crm/kanban'), api.get<Stats>('/crm/stats')])
    if (kRes.data) setKanban(extractArray(kRes.data))
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
      const next = prev.map(c => ({ ...c, leads: c.leads.filter(l => l.id !== dragging.id) }))
      return next.map(c => c.stage === stage ? { ...c, leads: [{ ...dragging, status: stage }, ...c.leads] } : c)
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
    if (!confirm(ar ? 'حذف؟' : 'Delete?')) return
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

  const allLeads   = kanban.flatMap(c => c.leads)
  const totalWtd   = forecastRows.reduce((s, r) => s + r.weighted, 0)

  const ACTIVITY_TYPES = [
    { key: 'call',    ar: '📞 مكالمة', en: '📞 Call' },
    { key: 'email',   ar: '✉️ بريد',  en: '✉️ Email' },
    { key: 'meeting', ar: '🤝 اجتماع', en: '🤝 Meeting' },
    { key: 'note',    ar: '📝 ملاحظة', en: '📝 Note' },
    { key: 'task',    ar: '✅ مهمة',   en: '✅ Task' },
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

  return (
    <ERPLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{ar ? 'إدارة العملاء (CRM)' : 'CRM'}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* View switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: 3, gap: 2 }}>
              {(['kanban', 'list', 'forecast', 'automation', 'email'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', fontSize: '0.78rem' }}>
                  {{ kanban: ar ? 'كانبان' : 'Kanban', list: ar ? 'قائمة' : 'List', forecast: ar ? 'توقعات' : 'Forecast', automation: ar ? 'أتمتة' : 'Automation', email: ar ? 'البريد' : 'Emails' }[v]}
                </button>
              ))}
            </div>
            {view === 'automation' && <button className="btn btn-primary" onClick={() => { setEditRule(null); setRuleForm({ name: '', trigger: 'stage_change', action: 'send_email', is_active: true, conditions: '' }); setRuleModal(true) }}>+ {ar ? 'قاعدة جديدة' : 'New Rule'}</button>}
            {(view === 'kanban' || view === 'list') && <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ {ar ? 'إضافة' : 'Add Lead'}</button>}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', marginBottom: '1.5rem' }}>
            {[
              { label: ar ? 'الإجمالي' : 'Total',      value: stats.total_leads,   color: '#2563eb' },
              { label: ar ? 'مؤهل' : 'Qualified',      value: stats.qualified,     color: '#7c3aed' },
              { label: ar ? 'مكتسب' : 'Won',           value: stats.won,           color: '#16a34a' },
              { label: ar ? 'نسبة الفوز' : 'Win Rate', value: `${stats.win_rate}%`, color: '#16a34a' },
              { label: ar ? 'Pipeline' : 'Pipeline',   value: `${Number(stats.pipeline_value || 0).toLocaleString()} ${ar ? 'ج' : 'EGP'}`, color: '#d97706' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ══ View: Kanban ══ */}
        {!loading && view === 'kanban' && (
          <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.875rem', minWidth: `${STAGES.length * 260}px` }}>
              {kanban.map(col => {
                const cfg = STAGE_CFG[col.stage]
                return (
                  <div key={col.stage} onDragOver={e => onDragOver(e, col.stage)} onDragLeave={() => setDragOver(null)} onDrop={e => onDrop(e, col.stage)}
                    style={{ width: 248, flexShrink: 0, background: dragOver === col.stage ? 'var(--bg-selected)' : 'var(--bg-page)', borderRadius: 'var(--radius-lg)', border: dragOver === col.stage ? `2px dashed ${cfg.color}` : '2px solid transparent', transition: 'all 0.2s' }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: `3px solid ${cfg.color}`, background: 'var(--bg-card)', borderRadius: `var(--radius-lg) var(--radius-lg) 0 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: cfg.color, fontSize: '0.9rem' }}>{ar ? cfg.ar : cfg.en}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cfg.probability}%</span>
                        <span style={{ background: cfg.color, color: '#fff', borderRadius: '999px', padding: '0 8px', fontSize: '0.78rem', fontWeight: 700 }}>{col.count}</span>
                      </div>
                    </div>
                    {col.total_value > 0 && (
                      <div style={{ padding: '0.4rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
                        {Number(col.total_value).toLocaleString()} {ar ? 'ج' : 'EGP'}
                      </div>
                    )}
                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 80 }}>
                      {col.leads.map(lead => {
                        const sc = lead.score_label ? SCORE_CFG[lead.score_label] : null
                        return (
                          <div key={lead.id} draggable onDragStart={e => onDragStart(e, lead)} onClick={() => { setViewLead(lead); fetchActivities(lead.id) }}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', cursor: 'grab', opacity: dragging?.id === lead.id ? 0.4 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lead.name}</div>
                              {sc && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: sc.color }}>{ar ? sc.ar : sc.en}</span>}
                            </div>
                            {lead.email && <div className="text-muted" style={{ fontSize: '0.78rem' }}>{lead.email}</div>}
                            {lead.score != null && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <div style={{ flex: 1, height: 3, background: 'var(--bg-page)', borderRadius: 999 }}>
                                  <div style={{ width: `${lead.score}%`, height: '100%', background: sc?.color || '#94a3b8', borderRadius: 999 }} />
                                </div>
                                <span style={{ fontSize: '0.68rem', color: sc?.color || 'var(--text-muted)', fontWeight: 600 }}>{lead.score}</span>
                              </div>
                            )}
                            {lead.value != null && <div style={{ marginTop: 6, fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>{Number(lead.value).toLocaleString()} {ar ? 'ج' : 'EGP'}</div>}
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                              {lead.email_opened  && <span title={ar ? 'فتح البريد' : 'Email opened'}  style={{ fontSize: '0.7rem', color: '#16a34a' }}>👁️</span>}
                              {lead.email_replied && <span title={ar ? 'تم الرد' : 'Email replied'}    style={{ fontSize: '0.7rem', color: '#2563eb' }}>↩️</span>}
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
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'الاسم' : 'Name'}</th>
                  <th>{ar ? 'النقاط' : 'Score'}</th>
                  <th>{ar ? 'المرحلة' : 'Stage'}</th>
                  <th>{ar ? 'القيمة' : 'Value'}</th>
                  <th>{ar ? 'البريد' : 'Email'}</th>
                  <th>{ar ? 'آخر نشاط' : 'Last Activity'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {allLeads.map(lead => {
                  const cfg = STAGE_CFG[lead.status]
                  const sc  = lead.score_label ? SCORE_CFG[lead.score_label] : null
                  return (
                    <tr key={lead.id}>
                      <td><div style={{ fontWeight: 600 }}>{lead.name}</div>{lead.email && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{lead.email}</div>}</td>
                      <td>
                        {lead.score != null ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: 48, height: 4, background: 'var(--bg-page)', borderRadius: 999 }}>
                                <div style={{ width: `${lead.score}%`, height: '100%', background: sc?.color || '#94a3b8', borderRadius: 999 }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: sc?.color }}>{lead.score}</span>
                            </div>
                            {sc && <div style={{ fontSize: '0.7rem', color: sc.color }}>{ar ? sc.ar : sc.en}</div>}
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td><span style={{ background: cfg?.color, color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600 }}>{ar ? cfg?.ar : cfg?.en}</span></td>
                      <td>{lead.value ? `${Number(lead.value).toLocaleString()} ${ar ? 'ج' : 'EGP'}` : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {lead.email_opened  && <span title="Opened"  style={{ color: '#16a34a' }}>👁️</span>}
                          {lead.email_replied && <span title="Replied" style={{ color: '#2563eb' }}>↩️</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.last_activity ? new Date(lead.last_activity).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setViewLead(lead); fetchActivities(lead.id) }}>{ar ? 'عرض' : 'View'}</button>
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
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card" style={{ borderTop: '3px solid #7c3aed' }}>
                <div className="stat-value" style={{ color: '#7c3aed' }}>{Number(totalWtd).toLocaleString()} {ar ? 'ج' : 'EGP'}</div>
                <div className="stat-label">{ar ? 'إجمالي التوقعات المرجحة' : 'Total Weighted Forecast'}</div>
              </div>
            </div>
            <div className="card">
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
                  {(forecastRows.length ? forecastRows : STAGES.filter(s => s !== 'lost').map(s => {
                    const col = kanban.find(c => c.stage === s)
                    const prob = STAGE_CFG[s].probability
                    return { stage: s, leads: col?.count || 0, value: col?.total_value || 0, probability: prob, weighted: Math.round((col?.total_value || 0) * prob / 100) }
                  })).map((row, i) => {
                    const cfg = STAGE_CFG[row.stage]
                    return (
                      <tr key={i}>
                        <td><span style={{ background: cfg?.color, color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600 }}>{ar ? cfg?.ar : cfg?.en || row.stage}</span></td>
                        <td style={{ fontWeight: 600 }}>{row.leads}</td>
                        <td>{Number(row.value).toLocaleString()} {ar ? 'ج' : 'EGP'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--bg-page)', borderRadius: 999 }}>
                              <div style={{ width: `${row.probability}%`, height: '100%', background: cfg?.color || '#94a3b8', borderRadius: 999 }} />
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
          <div className="card">
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
                      <td><span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{ar ? trg?.ar : trg?.en || r.trigger}</span></td>
                      <td><span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{ar ? act?.ar : act?.en || r.action}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.conditions || '—'}</td>
                      <td><span className={`badge ${r.is_active ? 'badge-success' : 'badge-muted'}`}>{r.is_active ? (ar ? 'فعّال' : 'Active') : (ar ? 'متوقف' : 'Inactive')}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => { setEditRule(r); setRuleForm({ name: r.name, trigger: r.trigger, action: r.action, is_active: r.is_active, conditions: r.conditions || '' }); setRuleModal(true) }}>{ar ? 'تعديل' : 'Edit'}</button>
                          <button className="btn btn-sm btn-danger" onClick={async () => { if (confirm(ar ? 'حذف؟' : 'Delete?')) { await api.delete(`/crm/automation/${r.id}`); fetchAutoRules() } }}>{ar ? 'حذف' : 'Delete'}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {autoRules.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد قواعد أتمتة' : 'No automation rules'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ View: Email Tracking ══ */}
        {view === 'email' && (
          <div className="card">
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
                    <td>{new Date(es.sent_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</td>
                    <td><span className={`badge ${es.opened ? 'badge-success' : 'badge-muted'}`}>{es.opened ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No')}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{es.opened_at ? new Date(es.opened_at).toLocaleString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                    <td><span className={`badge ${es.replied ? 'badge-success' : 'badge-muted'}`}>{es.replied ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No')}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{es.replied_at ? new Date(es.replied_at).toLocaleString(ar ? 'ar-EG' : 'en-US') : '—'}</td>
                  </tr>
                ))}
                {emailStats.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد بيانات تتبع' : 'No email tracking data'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

        {/* ══ Modal: Add Lead ══ */}
        {addModal && (
          <div className="modal-overlay" onClick={() => setAddModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h2>{ar ? 'إضافة Lead' : 'Add Lead'}</h2><button className="modal-close" onClick={() => setAddModal(false)}>×</button></div>
              <form onSubmit={handleAdd}>
                <div className="modal-body">
                  <div className="form-grid">
                    {[
                      { label: ar ? 'الاسم *' : 'Name *', key: 'name', type: 'text', required: true },
                      { label: ar ? 'البريد' : 'Email', key: 'email', type: 'email' },
                      { label: ar ? 'الهاتف' : 'Phone', key: 'phone', type: 'tel' },
                      { label: ar ? 'القيمة المتوقعة' : 'Expected Value', key: 'value', type: 'number' },
                    ].map(f => (
                      <div key={f.key} className="form-group">
                        <label className="form-label">{f.label}</label>
                        <input className="form-input" type={f.type} required={f.required} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">{ar ? 'المرحلة' : 'Stage'}</label>
                      <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STAGES.map(s => <option key={s} value={s}>{ar ? STAGE_CFG[s].ar : STAGE_CFG[s].en}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'ملاحظات' : 'Notes'}</label>
                    <textarea className="form-textarea" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'إضافة' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: View Lead + Timeline ══ */}
        {viewLead && (
          <div className="modal-overlay" onClick={() => setViewLead(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0 }}>{viewLead.name}</h2>
                  {viewLead.score != null && (
                    <div style={{ fontSize: '0.8rem', marginTop: 2, color: viewLead.score_label ? SCORE_CFG[viewLead.score_label].color : 'var(--text-muted)' }}>
                      {ar ? 'نقاط التأهيل:' : 'Lead Score:'} {viewLead.score}/100 {viewLead.score_label ? `— ${ar ? SCORE_CFG[viewLead.score_label].ar : SCORE_CFG[viewLead.score_label].en}` : ''}
                    </div>
                  )}
                </div>
                <button className="modal-close" onClick={() => setViewLead(null)}>×</button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Lead info */}
                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: ar ? 'المرحلة' : 'Stage', value: <span style={{ background: STAGE_CFG[viewLead.status]?.color, color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: '0.85rem' }}>{ar ? STAGE_CFG[viewLead.status]?.ar : STAGE_CFG[viewLead.status]?.en}</span> },
                    { label: ar ? 'البريد' : 'Email',  value: viewLead.email },
                    { label: ar ? 'الهاتف' : 'Phone',  value: viewLead.phone },
                    { label: ar ? 'القيمة' : 'Value',  value: viewLead.value ? `${Number(viewLead.value).toLocaleString()} ${ar ? 'ج' : 'EGP'}` : null },
                    { label: ar ? 'ملاحظات' : 'Notes', value: viewLead.notes },
                  ].filter(r => r.value).map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                      <span className="text-muted">{r.label}</span><span>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Add activity */}
                <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>📅 {ar ? 'إضافة نشاط' : 'Add Activity'}</div>
                <form onSubmit={addActivity}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <select className="form-select" value={activityForm.type} onChange={e => setActivityForm(f => ({ ...f, type: e.target.value }))} style={{ maxWidth: 140 }}>
                      {ACTIVITY_TYPES.map(t => <option key={t.key} value={t.key}>{ar ? t.ar : t.en}</option>)}
                    </select>
                    <input className="form-input" style={{ flex: 1 }} placeholder={ar ? 'وصف النشاط...' : 'Activity description...'} value={activityForm.description} onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} required />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{ar ? 'إضافة' : 'Add'}</button>
                  </div>
                </form>

                {/* Timeline */}
                <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>🕐 {ar ? 'سجل النشاط' : 'Activity Timeline'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activities.map(a => {
                    const act = ACTIVITY_TYPES.find(t => t.key === a.type)
                    return (
                      <div key={a.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: a.auto ? 'var(--color-primary-light, #eff6ff)' : 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{act ? (ar ? act.ar.split(' ')[0] : act.en.split(' ')[0]) : '•'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.description}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.created_by || (a.auto ? (ar ? 'نظام تلقائي' : 'Auto') : '')}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleString(ar ? 'ar-EG' : 'en-US')}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {activities.length === 0 && <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد أنشطة بعد' : 'No activities yet'}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => handleDelete(viewLead.id)}>{ar ? 'حذف' : 'Delete'}</button>
                <button className="btn btn-secondary" onClick={() => setViewLead(null)}>{ar ? 'إغلاق' : 'Close'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Modal: Automation Rule ══ */}
        {ruleModal && (
          <div className="modal-overlay" onClick={() => setRuleModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header"><h2>⚡ {editRule ? (ar ? 'تعديل قاعدة' : 'Edit Rule') : (ar ? 'قاعدة جديدة' : 'New Rule')}</h2><button className="modal-close" onClick={() => setRuleModal(false)}>×</button></div>
              <form onSubmit={handleSaveRule}>
                <div className="modal-body">
                  <div className="form-group"><label className="form-label">{ar ? 'اسم القاعدة *' : 'Rule Name *'}</label><input className="form-input" value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} required /></div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'المُشغِّل *' : 'Trigger *'}</label>
                      <select className="form-select" value={ruleForm.trigger} onChange={e => setRuleForm(f => ({ ...f, trigger: e.target.value }))}>
                        {TRIGGER_TYPES.map(t => <option key={t.key} value={t.key}>{ar ? t.ar : t.en}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الإجراء *' : 'Action *'}</label>
                      <select className="form-select" value={ruleForm.action} onChange={e => setRuleForm(f => ({ ...f, action: e.target.value }))}>
                        {ACTION_TYPES.map(a => <option key={a.key} value={a.key}>{ar ? a.ar : a.en}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label className="form-label">{ar ? 'شروط إضافية' : 'Additional Conditions'}</label><textarea className="form-textarea" rows={2} value={ruleForm.conditions} onChange={e => setRuleForm(f => ({ ...f, conditions: e.target.value }))} placeholder={ar ? 'مثال: stage=qualified' : 'e.g. stage=qualified'} /></div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={ruleForm.is_active} onChange={e => setRuleForm(f => ({ ...f, is_active: e.target.checked }))} />
                    {ar ? 'القاعدة فعّالة' : 'Rule is active'}
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setRuleModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}