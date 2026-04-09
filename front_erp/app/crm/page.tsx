'use client'

// ══════════════════════════════════════════════════════════
// app/crm/page.tsx — إدارة علاقات العملاء (Kanban Board)
// API: GET /api/crm/kanban
//      PUT /api/crm/leads/{id}/stage
//      GET /api/crm/stats
//      POST/DELETE /api/crm/leads
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent, DragEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Lead = {
  id: number
  name: string
  email?: string
  phone?: string
  value?: number
  status: string
  source?: string
  notes?: string
  assignedTo?: { name: string }
  created_at: string
}
type KanbanCol = { stage: string; count: number; total_value: number; leads: Lead[] }
type Stats = { total_leads: number; new_leads: number; qualified: number; won: number; pipeline_value: number; win_rate: number }

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const STAGE_CFG: Record<string, { ar: string; en: string; color: string }> = {
  new:         { ar: 'جديد',        en: 'New',         color: '#64748b' },
  contacted:   { ar: 'تم التواصل', en: 'Contacted',   color: '#2563eb' },
  qualified:   { ar: 'مؤهل',       en: 'Qualified',   color: '#7c3aed' },
  proposal:    { ar: 'عرض سعر',    en: 'Proposal',    color: '#d97706' },
  negotiation: { ar: 'تفاوض',       en: 'Negotiation', color: '#ea580c' },
  won:         { ar: 'مكتسب',      en: 'Won',         color: '#16a34a' },
  lost:        { ar: 'خسارة',      en: 'Lost',        color: '#dc2626' },
}

export default function CRMPage() {
  const { lang } = useI18n()
  const [kanban,   setKanban]   = useState<KanbanCol[]>([])
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [dragging, setDragging] = useState<Lead | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [view,     setView]     = useState<'kanban' | 'list'>('kanban')
  const [form, setForm] = useState({ name: '', email: '', phone: '', value: '', source: 'direct', status: 'new', notes: '' })

  const fetchData = async () => {
    setLoading(true)
    const [kRes, sRes] = await Promise.all([
      api.get<KanbanCol[]>('/crm/kanban'),
      api.get<Stats>('/crm/stats'),
    ])
    if (kRes.data) setKanban(extractArray(kRes.data))
    if (sRes.data) setStats(sRes.data)
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

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
    if (!res.error) { setModal(false); setForm({ name: '', email: '', phone: '', value: '', source: 'direct', status: 'new', notes: '' }); fetchData() }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'حذف؟' : 'Delete?')) return
    await api.delete(`/crm/leads/${id}`); setViewLead(null); fetchData()
  }

  const allLeads = kanban.flatMap(c => c.leads)

  return (
    <ERPLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{lang === 'ar' ? 'إدارة العملاء (CRM)' : 'CRM'}</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ display: 'flex', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: 3 }}>
              {(['kanban', 'list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }}>
                  {v === 'kanban' ? (lang === 'ar' ? 'كانبان' : 'Kanban') : (lang === 'ar' ? 'قائمة' : 'List')}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              + {lang === 'ar' ? 'إضافة' : 'Add Lead'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', marginBottom: '1.5rem' }}>
            {[
              { label: lang === 'ar' ? 'الإجمالي' : 'Total',       value: stats.total_leads,   color: '#2563eb' },
              { label: lang === 'ar' ? 'مؤهل' : 'Qualified',       value: stats.qualified,     color: '#7c3aed' },
              { label: lang === 'ar' ? 'مكتسب' : 'Won',            value: stats.won,           color: '#16a34a' },
              { label: lang === 'ar' ? 'نسبة الفوز' : 'Win Rate',  value: `${stats.win_rate}%`,color: '#16a34a' },
              { label: lang === 'ar' ? 'Pipeline' : 'Pipeline',    value: `${Number(stats.pipeline_value||0).toLocaleString()} ${lang === 'ar' ? 'ج' : 'EGP'}`, color: '#d97706' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Kanban */}
        {!loading && view === 'kanban' && (
          <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.875rem', minWidth: `${STAGES.length * 260}px` }}>
              {kanban.map(col => {
                const cfg = STAGE_CFG[col.stage]
                const over = dragOver === col.stage
                return (
                  <div key={col.stage}
                    onDragOver={e => onDragOver(e, col.stage)}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => onDrop(e, col.stage)}
                    style={{ width: 248, flexShrink: 0, background: over ? 'var(--bg-selected)' : 'var(--bg-page)', borderRadius: 'var(--radius-lg)', border: over ? `2px dashed ${cfg.color}` : '2px solid transparent', transition: 'all 0.2s' }}
                  >
                    <div style={{ padding: '0.75rem 1rem', borderBottom: `3px solid ${cfg.color}`, background: 'var(--bg-card)', borderRadius: `var(--radius-lg) var(--radius-lg) 0 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: cfg.color, fontSize: '0.9rem' }}>{lang === 'ar' ? cfg.ar : cfg.en}</span>
                      <span style={{ background: cfg.color, color: '#fff', borderRadius: '999px', padding: '0 8px', fontSize: '0.78rem', fontWeight: 700 }}>{col.count}</span>
                    </div>
                    {col.total_value > 0 && (
                      <div style={{ padding: '0.4rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
                        {Number(col.total_value).toLocaleString()} {lang === 'ar' ? 'ج' : 'EGP'}
                      </div>
                    )}
                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 80 }}>
                      {col.leads.map(lead => (
                        <div key={lead.id} draggable onDragStart={e => onDragStart(e, lead)} onClick={() => setViewLead(lead)}
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', cursor: 'grab', opacity: dragging?.id === lead.id ? 0.4 : 1 }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{lead.name}</div>
                          {lead.email && <div className="text-muted" style={{ fontSize: '0.78rem' }}>{lead.email}</div>}
                          {lead.value != null && <div style={{ marginTop: 6, fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>{Number(lead.value).toLocaleString()} {lang === 'ar' ? 'ج' : 'EGP'}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {!loading && view === 'list' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{lang === 'ar' ? 'المرحلة' : 'Stage'}</th>
                  <th>{lang === 'ar' ? 'القيمة' : 'Value'}</th>
                  <th>{lang === 'ar' ? 'المصدر' : 'Source'}</th>
                  <th>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {allLeads.map(lead => {
                  const cfg = STAGE_CFG[lead.status]
                  return (
                    <tr key={lead.id}>
                      <td><div style={{ fontWeight: 600 }}>{lead.name}</div>{lead.email && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{lead.email}</div>}</td>
                      <td><span style={{ background: cfg?.color, color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600 }}>{lang === 'ar' ? cfg?.ar : cfg?.en}</span></td>
                      <td>{lead.value ? `${Number(lead.value).toLocaleString()} ${lang === 'ar' ? 'ج' : 'EGP'}` : '—'}</td>
                      <td>{lead.source || '—'}</td>
                      <td><button className="btn btn-sm btn-secondary" onClick={() => setViewLead(lead)}>{lang === 'ar' ? 'عرض' : 'View'}</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

        {/* Modal: Add */}
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h2>{lang === 'ar' ? 'إضافة Lead' : 'Add Lead'}</h2><button className="modal-close" onClick={() => setModal(false)}>×</button></div>
              <form onSubmit={handleAdd}>
                <div className="modal-body">
                  <div className="form-grid">
                    {[
                      { label: lang === 'ar' ? 'الاسم *' : 'Name *', key: 'name', type: 'text', required: true },
                      { label: lang === 'ar' ? 'البريد' : 'Email', key: 'email', type: 'email' },
                      { label: lang === 'ar' ? 'الهاتف' : 'Phone', key: 'phone', type: 'tel' },
                      { label: lang === 'ar' ? 'القيمة' : 'Value', key: 'value', type: 'number' },
                    ].map(f => (
                      <div key={f.key} className="form-group">
                        <label className="form-label">{f.label}</label>
                        <input className="form-input" type={f.type} required={f.required} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">{lang === 'ar' ? 'المرحلة' : 'Stage'}</label>
                      <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STAGES.map(s => <option key={s} value={s}>{lang === 'ar' ? STAGE_CFG[s].ar : STAGE_CFG[s].en}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                    <textarea className="form-textarea" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : lang === 'ar' ? 'إضافة' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View */}
        {viewLead && (
          <div className="modal-overlay" onClick={() => setViewLead(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header"><h2>{viewLead.name}</h2><button className="modal-close" onClick={() => setViewLead(null)}>×</button></div>
              <div className="modal-body">
                {[
                  { label: lang === 'ar' ? 'المرحلة' : 'Stage',    value: <span style={{ background: STAGE_CFG[viewLead.status]?.color, color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: '0.85rem' }}>{lang === 'ar' ? STAGE_CFG[viewLead.status]?.ar : STAGE_CFG[viewLead.status]?.en}</span> },
                  { label: lang === 'ar' ? 'البريد' : 'Email',     value: viewLead.email },
                  { label: lang === 'ar' ? 'الهاتف' : 'Phone',     value: viewLead.phone },
                  { label: lang === 'ar' ? 'القيمة' : 'Value',     value: viewLead.value ? `${Number(viewLead.value).toLocaleString()} ${lang === 'ar' ? 'ج' : 'EGP'}` : null },
                  { label: lang === 'ar' ? 'ملاحظات' : 'Notes',    value: viewLead.notes },
                ].filter(r => r.value).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span className="text-muted">{r.label}</span><span>{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => handleDelete(viewLead.id)}>{lang === 'ar' ? 'حذف' : 'Delete'}</button>
                <button className="btn btn-secondary" onClick={() => setViewLead(null)}>{lang === 'ar' ? 'إغلاق' : 'Close'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}
