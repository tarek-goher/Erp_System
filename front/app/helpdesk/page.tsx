'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { Modal, ToastContainer } from '../../components/ui'
import Link from 'next/link'

type Ticket = {
  id: string; ref: string; subject: string; description: string
  status: 'open'|'in_progress'|'resolved'|'closed'
  priority: 'low'|'medium'|'high'|'urgent'
  category: string; customer?: { name: string }
  assigned_to?: { name: string }; created_at: string; is_overdue: boolean
}
type CannedResponse = { id: string; name: string; category: string; body: string }

const STATUS: Record<string, { ar: string; color: string; icon: string }> = {
  open:        { ar: 'مفتوحة',       color: 'danger',  icon: 'fa-folder-open' },
  in_progress: { ar: 'قيد المعالجة', color: 'warning', icon: 'fa-bars-progress' },
  resolved:    { ar: 'محلولة',       color: 'success', icon: 'fa-circle-check' },
  closed:      { ar: 'مغلقة',        color: 'muted',   icon: 'fa-lock' },
}

const PRIORITY: Record<string, { ar: string; color: string; icon: string }> = {
  low:    { ar: 'منخفضة', color: 'info',    icon: 'fa-arrow-down' },
  medium: { ar: 'متوسطة', color: 'warning', icon: 'fa-minus' },
  high:   { ar: 'عالية',  color: 'danger',  icon: 'fa-arrow-up' },
  urgent: { ar: 'عاجلة',  color: 'danger',  icon: 'fa-bolt' },
}

export default function HelpdeskPage() {
  const { toasts, show, remove } = useToast()
  const [tickets, setTickets]   = useState<Ticket[]>([])
  const [canned,  setCanned]    = useState<CannedResponse[]>([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState('')
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selected,   setSelected]   = useState<Ticket | null>(null)
  const [replyText,  setReplyText]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ subject:'',description:'',priority:'medium',category:'' })

  const loadAll = async () => {
    setLoading(true)
    const [tRes, cRes] = await Promise.all([
      api.get('/helpdesk?per_page=100'),
      api.get('/canned-responses?per_page=100'),
    ])
    if (tRes.data) setTickets(extractArray(tRes.data) || [])
    if (cRes.data) setCanned(extractArray(cRes.data) || [])
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [])

  const changeStatus = async (id: string, status: string) => {
    const res = await api.patch(`/helpdesk/${id}/status`, { status })
    if (res.error) { show(res.error,'error'); return }
    show('تم تحديث الحالة ✅')
    setTickets(p => p.map(t => t.id===id ? {...t, status:status as any} : t))
    if (selected?.id===id) setSelected(t => t ? {...t, status:status as any} : null)
  }
  const sendReply = async () => {
    if (!selected || !replyText.trim()) return
    setSaving(true)
    const res = await api.post(`/helpdesk/${selected.id}/reply`, { message: replyText })
    setSaving(false)
    if (res.error) { show(res.error,'error'); return }
    show('تم إرسال الرد ✅'); setReplyText('')
  }
  const autoAssign = async (id: string) => {
    const res = await api.post(`/helpdesk/${id}/assign`, { user_id: null })
    if (!res.error) { show('تم التعيين التلقائي ✅'); loadAll() } else show(res.error,'error')
  }
  const saveTicket = async () => {
    if (!ticketForm.subject) { show('الموضوع مطلوب','error'); return }
    setSaving(true)
    const res = await api.post('/helpdesk', ticketForm)
    setSaving(false)
    if (res.error) { show(res.error,'error'); return }
    show('تم إنشاء التذكرة ✅'); setShowTicketForm(false); loadAll()
  }

  const filteredTickets = tickets.filter(t => {
    const ms = !search || t.subject?.includes(search) || t.ref?.includes(search) || t.customer?.name?.includes(search)
    const mt = statusFilter==='all' || t.status===statusFilter
    const mp = priorityFilter==='all' || t.priority===priorityFilter
    return ms && mt && mp
  })

  return (
    <ERPLayout pageTitle="الدعم الفني">
      {/* Inject FontAwesome safely */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" precedence="default" />
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="page-inner">
        {/* ══ HEADER ══ */}
        <div className="page-header">
          <div>
            <h1 className="page-title"><i className="fa-solid fa-headset text-primary" style={{ marginInlineEnd: '8px' }}></i>الدعم الفني</h1>
            <p className="page-subtitle">إدارة التذاكر ومتابعة طلبات العملاء</p>
          </div>
          <div className="toolbar-actions">
            <Link href="/helpdesk/analytics"      className="btn btn-secondary btn-sm"><i className="fa-solid fa-chart-pie"></i> التحليلات</Link>
            <Link href="/helpdesk/sla-policies"   className="btn btn-secondary btn-sm"><i className="fa-solid fa-stopwatch"></i> سياسات SLA</Link>
            <Link href="/helpdesk/workflows"      className="btn btn-secondary btn-sm"><i className="fa-solid fa-gears"></i> سير العمل</Link>
            <Link href="/helpdesk/knowledge-base" className="btn btn-secondary btn-sm"><i className="fa-solid fa-book"></i> قاعدة المعرفة</Link>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTicketForm(true)}><i className="fa-solid fa-plus"></i> تذكرة جديدة</button>
          </div>
        </div>

        {/* ══ STATS GRID ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'إجمالي التذاكر', value: tickets.length, color: '#2563eb', icon: 'fa-ticket' },
            { label: 'مفتوحة', value: tickets.filter(t=>t.status==='open').length, color: '#dc2626', icon: 'fa-folder-open' },
            { label: 'محلولة', value: tickets.filter(t=>t.status==='resolved').length, color: '#16a34a', icon: 'fa-circle-check' },
            { label: 'SLA منتهكة', value: tickets.filter(t=>t.is_overdue).length, color: '#d97706', icon: 'fa-triangle-exclamation' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
              <div className="stat-icon" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                <i className={`fa-solid ${s.icon}`}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div className="stat-value" style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>{s.value}</div>
                <div className="stat-label" style={{ fontSize: '0.85rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ MAIN CONTENT ══ */}
        {loading ? (
          <div className="flex-col gap-2">
            {Array(5).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            
            {/* TICKET LIST */}
            <div style={{ flex: 1, minWidth: 'min(100%, 500px)' }}>
              
              {/* Filters */}
              <div className="toolbar" style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: 200, margin: 0, border: 'none', background: 'var(--bg-hover)' }}>
                  <i className="fa-solid fa-search text-muted"></i>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم، موضوع، عميل..." />
                </div>
                <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
                  <option value="all">كل الحالات</option>
                  {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.ar}</option>)}
                </select>
                <select className="input" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
                  <option value="all">كل الأولويات</option>
                  {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.ar}</option>)}
                </select>
              </div>

              {/* List */}
              {filteredTickets.length === 0 ? (
                <div className="empty-state card mt-3">
                  <i className="fa-solid fa-ticket-simple empty-state-icon"></i>
                  <div className="empty-state-text fw-bold" style={{ fontSize: '1.1rem' }}>لا توجد تذاكر</div>
                  <div className="empty-state-text">انتظار طلبات الدعم...</div>
                </div>
              ) : (
                <div className="flex-col gap-2 mt-3">
                  {filteredTickets.map(t => {
                    const st = STATUS[t.status]
                    const pr = PRIORITY[t.priority]
                    const isSel = selected?.id === t.id
                    
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className="card"
                        style={{
                          padding: '1.25rem', cursor: 'pointer',
                          border: isSel ? '2px solid var(--border-focus)' : t.is_overdue ? '1px solid var(--color-danger)' : '1px solid var(--border)',
                          boxShadow: isSel ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                          background: isSel ? 'var(--bg-selected)' : 'var(--bg-card)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div className="flex-between" style={{ alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 600 }}>{t.ref}</span>
                              <span className={`badge badge-${st?.color || 'muted'}`}><i className={`fa-solid ${st?.icon}`} style={{ marginInlineEnd: 4 }}></i> {st?.ar}</span>
                              <span className={`badge badge-${pr?.color || 'muted'}`}><i className={`fa-solid ${pr?.icon}`} style={{ marginInlineEnd: 4 }}></i> {pr?.ar}</span>
                              {t.is_overdue && <span className="badge badge-danger"><i className="fa-solid fa-triangle-exclamation" style={{ marginInlineEnd: 4 }}></i> SLA</span>}
                            </div>
                            
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>{t.subject}</div>
                            
                            <div className="flex" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', gap: '12px', flexWrap: 'wrap' }}>
                              {t.customer?.name && <span><i className="fa-solid fa-user" style={{ marginInlineEnd: 4 }}></i> {t.customer.name}</span>}
                              {t.category       && <span><i className="fa-solid fa-tag" style={{ marginInlineEnd: 4 }}></i> {t.category}</span>}
                              {t.assigned_to    && <span><i className="fa-solid fa-user-gear" style={{ marginInlineEnd: 4 }}></i> {t.assigned_to.name}</span>}
                              <span><i className="fa-solid fa-calendar-day" style={{ marginInlineEnd: 4 }}></i> {new Date(t.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                          </div>
                          
                          {/* Quick Actions */}
                          {t.status !== 'resolved' && t.status !== 'closed' && (
                            <div className="flex gap-1" style={{ flexShrink: 0 }}>
                              <button onClick={e => { e.stopPropagation(); autoAssign(t.id) }} className="btn-icon" style={{ background: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }} title="تعيين تلقائي">
                                <i className="fa-solid fa-robot"></i>
                              </button>
                              <button onClick={e => { e.stopPropagation(); changeStatus(t.id, 'resolved') }} className="btn-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }} title="تحديد كمحلول">
                                <i className="fa-solid fa-check"></i>
                              </button>
                              <button onClick={e => { e.stopPropagation(); changeStatus(t.id, 'closed') }} className="btn-icon" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }} title="إغلاق">
                                <i className="fa-solid fa-lock"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* DETAIL PANEL */}
            {selected && (
              <div className="card" style={{
                width: '100%', maxWidth: 420, flexShrink: 0, padding: 0,
                display: 'flex', flexDirection: 'column',
                maxHeight: 'calc(100vh - 120px)', position: 'sticky', top: '80px',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-table-head)' }}>
                  <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', flex: 1, paddingInlineEnd: '1rem' }}>{selected.subject}</div>
                    <button onClick={() => setSelected(null)} className="btn-icon text-muted" style={{ flexShrink: 0 }}><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>
                    <i className="fa-solid fa-hashtag"></i> {selected.ref} {selected.customer?.name && ` • ${selected.customer.name}`}
                  </div>
                  
                  {/* Status Toggle Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.keys(STATUS).map(s => {
                      const st = STATUS[s]
                      const isActive = selected.status === s
                      return (
                        <button
                          key={s}
                          onClick={() => changeStatus(selected.id, s)}
                          className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            background: isActive ? `var(--color-${st.color})` : 'transparent',
                            borderColor: isActive ? `var(--color-${st.color})` : 'var(--border)',
                            color: isActive ? '#fff' : 'var(--text-secondary)'
                          }}
                        >
                          <i className={`fa-solid ${st.icon}`}></i> {st.ar}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Description Body */}
                <div style={{ padding: '1.5rem', background: 'var(--bg-card)', fontSize: '0.95rem', color: 'var(--text-primary)', flex: 1, overflowY: 'auto', lineHeight: 1.7 }}>
                  <div className="fw-bold mb-2 text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}><i className="fa-solid fa-align-left" style={{ marginInlineEnd: 6 }}></i> تفاصيل المشكلة</div>
                  {selected.description}
                </div>

                {/* Reply Footer */}
                <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-table-head)' }}>
                  {canned.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {canned.slice(0, 4).map(c => (
                        <button
                          key={c.id}
                          onClick={() => setReplyText(c.body)}
                          className="badge badge-primary"
                          style={{ border: 'none', cursor: 'pointer', padding: '4px 10px' }}
                        >
                          <i className="fa-solid fa-comment-dots" style={{ marginInlineEnd: 4 }}></i> {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="اكتب ردك هنا..."
                    className="input"
                    style={{ resize: 'none', marginBottom: '10px' }}
                  />
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={sendReply} disabled={saving || !replyText.trim()}>
                    {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-paper-plane"></i> إرسال الرد</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TICKET FORM MODAL ══ */}
        <Modal
          open={showTicketForm}
          onClose={() => setShowTicketForm(false)}
          title={<><i className="fa-solid fa-ticket text-primary" style={{ marginInlineEnd: 8 }}></i> تذكرة دعم جديدة</>}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowTicketForm(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveTicket} disabled={saving}>{saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check"></i> إنشاء التذكرة</>}</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">الموضوع *</label>
              <input className="input" value={ticketForm.subject} onChange={e => setTicketForm(p => ({...p, subject: e.target.value}))} placeholder="وصف مختصر للمشكلة..." />
            </div>
            
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">الأولوية</label>
                <select className="input" value={ticketForm.priority} onChange={e => setTicketForm(p => ({...p, priority: e.target.value}))}>
                  {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.ar}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">الفئة</label>
                <select className="input" value={ticketForm.category} onChange={e => setTicketForm(p => ({...p, category: e.target.value}))}>
                  <option value="">اختر فئة...</option>
                  {['تقني','مالي','شحن','المنتجات','العضوية','أخرى'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">التفاصيل الكاملة *</label>
              <textarea rows={5} className="input" value={ticketForm.description} onChange={e => setTicketForm(p => ({...p, description: e.target.value}))} placeholder="يرجى كتابة كافة تفاصيل المشكلة هنا..." />
            </div>
          </div>
        </Modal>

      </div>
    </ERPLayout>
  )
}