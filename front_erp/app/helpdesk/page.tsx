'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { StatCard, Badge, EmptyState, SearchInput, Modal, ToastContainer } from '../../components/ui'
import Link from 'next/link'

type Ticket = {
  id: string; ref: string; subject: string; description: string
  status: 'open'|'in_progress'|'resolved'|'closed'
  priority: 'low'|'medium'|'high'|'urgent'
  category: string; customer?: { name: string }
  assigned_to?: { name: string }; created_at: string; is_overdue: boolean
}
type CannedResponse = { id: string; name: string; category: string; body: string }

const STATUS: Record<string, { ar: string; color: any; icon: string }> = {
  open:        { ar:'مفتوحة',       color:'danger',  icon:'🔴' },
  in_progress: { ar:'قيد المعالجة', color:'warning', icon:'🟡' },
  resolved:    { ar:'محلولة',       color:'success', icon:'🟢' },
  closed:      { ar:'مغلقة',        color:'gray',    icon:'⚫' },
}
const PRIORITY: Record<string, { ar: string; color: any }> = {
  low:    { ar:'منخفضة', color:'info'    },
  medium: { ar:'متوسطة', color:'warning' },
  high:   { ar:'عالية',  color:'danger'  },
  urgent: { ar:'عاجلة',  color:'danger'  },
}

export default function HelpdeskPage() {
  const { toasts, show, remove } = useToast()
  const [tab, setTab] = useState<'tickets'|'canned'>('tickets')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [canned,  setCanned]  = useState<CannedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selected,   setSelected]   = useState<Ticket | null>(null)
  const [replyText,  setReplyText]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [showCannedForm, setShowCannedForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ subject:'',description:'',priority:'medium',category:'' })
  const [cannedForm, setCannedForm] = useState({ name:'',category:'',body:'' })

  const loadAll = async () => {
    setLoading(true)
    const [tRes, cRes] = await Promise.all([
      api.get('/helpdesk/tickets?per_page=100'),
      api.get('/helpdesk/canned-responses?per_page=100'),
    ])
    if (tRes.data) setTickets(extractArray(tRes.data))
    if (cRes.data) setCanned(extractArray(cRes.data))
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [])

  const changeStatus = async (id: string, status: string) => {
    const res = await api.patch(`/helpdesk/tickets/${id}/status`, { status })
    if (res.error) { show(res.error,'error'); return }
    show('تم تحديث الحالة'); setTickets(p => p.map(t => t.id===id?{...t,status:status as any}:t))
    if (selected?.id===id) setSelected(t => t?{...t,status:status as any}:null)
  }
  const sendReply = async () => {
    if (!selected || !replyText.trim()) return
    setSaving(true)
    const res = await api.post(`/helpdesk/tickets/${selected.id}/reply`, { message: replyText })
    setSaving(false)
    if (res.error) { show(res.error,'error'); return }
    show('تم إرسال الرد ✅'); setReplyText('')
  }
  const autoAssign = async (id: string) => {
    const res = await api.post(`/helpdesk/tickets/${id}/auto-assign`)
    if (!res.error) { show('تم التعيين التلقائي ✅'); loadAll() } else show(res.error,'error')
  }
  const saveTicket = async () => {
    if (!ticketForm.subject) { show('الموضوع مطلوب','error'); return }
    setSaving(true)
    const res = await api.post('/helpdesk/tickets', ticketForm)
    setSaving(false)
    if (res.error) { show(res.error,'error'); return }
    show('تم إنشاء التذكرة ✅'); setShowTicketForm(false); loadAll()
  }
  const saveCanned = async () => {
    if (!cannedForm.name || !cannedForm.body) { show('الاسم والمحتوى مطلوبان','error'); return }
    setSaving(true)
    const res = await api.post('/helpdesk/canned-responses', cannedForm)
    setSaving(false)
    if (res.error) { show(res.error,'error'); return }
    show('تمت الإضافة ✅'); setShowCannedForm(false); setCannedForm({name:'',category:'',body:''}); loadAll()
  }

  const filteredTickets = tickets.filter(t => {
    const ms = !search || t.subject?.includes(search) || t.ref?.includes(search) || t.customer?.name?.includes(search)
    const mt = statusFilter==='all' || t.status===statusFilter
    const mp = priorityFilter==='all' || t.priority===priorityFilter
    return ms && mt && mp
  })

  const INP: React.CSSProperties = { width:'100%',padding:'0.6rem 1rem',background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:'0.875rem',fontFamily:'inherit',outline:'none' }

  return (
    <ERPLayout pageTitle="الدعم الفني">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div><h1 className="page-title">🎧 الدعم الفني</h1><p className="page-subtitle">التذاكر • الردود الجاهزة</p></div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <Link href="/helpdesk/analytics" className="btn btn-secondary btn-sm">📊 التحليلات</Link>
          <Link href="/helpdesk/workflows" className="btn btn-secondary btn-sm">⚙️ سير العمل</Link>
          {tab==='tickets' && <button className="btn btn-primary btn-sm" onClick={()=>setShowTicketForm(true)}>+ تذكرة جديدة</button>}
          {tab==='canned'  && <button className="btn btn-primary btn-sm" onClick={()=>setShowCannedForm(true)}>+ رد جاهز</button>}
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom:'1.25rem' }}>
        <StatCard icon="🎫" label="إجمالي التذاكر" value={tickets.length} />
        <StatCard icon="🔴" label="مفتوحة"    value={tickets.filter(t=>t.status==='open').length}     accent="var(--color-danger)" />
        <StatCard icon="✅" label="محلولة"    value={tickets.filter(t=>t.status==='resolved').length}  accent="var(--color-success)" />
        <StatCard icon="⚠️" label="SLA منتهكة" value={tickets.filter(t=>t.is_overdue).length}         accent="var(--color-warning)" />
      </div>
      <div className="tabs">
        <button className={`tab ${tab==='tickets'?'active':''}`} onClick={()=>setTab('tickets')}>🎫 التذاكر ({tickets.length})</button>
        <button className={`tab ${tab==='canned'?'active':''}`}  onClick={()=>setTab('canned')}>💬 الردود الجاهزة ({canned.length})</button>
      </div>
      {loading ? (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {Array(5).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:80 }} />)}
        </div>
      ) : (
        <>
          {tab==='tickets' && (
            <div style={{ display:'flex',gap:'1rem' }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap' }}>
                  <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم، موضوع، عميل..." />
                  <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ ...INP,width:'auto',minWidth:130 }}>
                    <option value="all">كل الحالات</option>
                    {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.ar}</option>)}
                  </select>
                  <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} style={{ ...INP,width:'auto',minWidth:130 }}>
                    <option value="all">كل الأولويات</option>
                    {Object.entries(PRIORITY).map(([k,v])=><option key={k} value={k}>{v.ar}</option>)}
                  </select>
                </div>
                {filteredTickets.length===0 ? <EmptyState icon="🎫" title="لا توجد تذاكر" description="انتظار طلبات الدعم..." /> : (
                  <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                    {filteredTickets.map(t=>(
                      <div key={t.id} onClick={()=>setSelected(t)} style={{ padding:'1rem',borderRadius:'var(--radius-lg)',cursor:'pointer',border:`1px solid ${selected?.id===t.id?'var(--color-primary)':t.is_overdue?'var(--color-danger)':'var(--border)'}`,background:selected?.id===t.id?'var(--color-primary-light)':'var(--bg-card)',transition:'all 0.15s' }}>
                        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8 }}>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap' }}>
                              <span style={{ fontSize:'0.72rem',fontFamily:'monospace',color:'var(--text-muted)' }}>{t.ref}</span>
                              <Badge color={STATUS[t.status]?.color??'gray'}>{STATUS[t.status]?.icon} {STATUS[t.status]?.ar}</Badge>
                              <Badge color={PRIORITY[t.priority]?.color??'gray'}>{PRIORITY[t.priority]?.ar}</Badge>
                              {t.is_overdue && <Badge color="danger">⚠️ SLA</Badge>}
                            </div>
                            <div style={{ fontWeight:700,fontSize:'0.9rem',marginBottom:4 }}>{t.subject}</div>
                            <div style={{ fontSize:'0.75rem',color:'var(--text-muted)',display:'flex',gap:10,flexWrap:'wrap' }}>
                              {t.customer?.name && <span>👤 {t.customer.name}</span>}
                              {t.category && <span>🏷️ {t.category}</span>}
                              {t.assigned_to && <span>👷 {t.assigned_to.name}</span>}
                              <span>📅 {new Date(t.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                          </div>
                          {t.status!=='resolved'&&t.status!=='closed' && (
                            <div style={{ display:'flex',gap:4,flexShrink:0 }}>
                              <button onClick={e=>{e.stopPropagation();autoAssign(t.id)}} className="btn btn-sm" style={{ background:'var(--color-secondary-light)',color:'var(--color-secondary)' }}>🤖</button>
                              <button onClick={e=>{e.stopPropagation();changeStatus(t.id,'resolved')}} className="btn btn-sm" style={{ background:'var(--color-success-light)',color:'var(--color-success)' }}>✅</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selected && (
                <div style={{ width:360,flexShrink:0,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 200px)',position:'sticky',top:80 }}>
                  <div style={{ padding:'1rem',borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:700,marginBottom:4 }}>{selected.subject}</div>
                    <div style={{ fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:10 }}>{selected.ref} {selected.customer?.name&&`• ${selected.customer.name}`}</div>
                    <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                      {Object.keys(STATUS).map(s=>(
                        <button key={s} onClick={()=>changeStatus(selected.id,s)} className="btn btn-sm" style={{ background:selected.status===s?'var(--color-primary)':'transparent',color:selected.status===s?'#fff':'var(--text-secondary)',border:'1px solid var(--border)' }}>
                          {STATUS[s].icon} {STATUS[s].ar}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding:'1rem',background:'var(--bg-hover)',fontSize:'0.875rem',color:'var(--text-secondary)',flex:1,overflowY:'auto' }}>{selected.description}</div>
                  <div style={{ padding:'1rem',borderTop:'1px solid var(--border)' }}>
                    {canned.length>0 && (
                      <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:8 }}>
                        {canned.slice(0,4).map(c=>(
                          <button key={c.id} onClick={()=>setReplyText(c.body)} style={{ fontSize:'0.72rem',padding:'2px 8px',borderRadius:'var(--radius-full)',background:'var(--color-primary-light)',color:'var(--color-primary)',border:'none',cursor:'pointer' }}>💬 {c.name}</button>
                        ))}
                      </div>
                    )}
                    <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={4} placeholder="اكتب ردك هنا..." style={{ ...INP,resize:'none' as any,marginBottom:8 }} />
                    <button className="btn btn-primary" style={{ width:'100%' }} onClick={sendReply} disabled={saving||!replyText.trim()}>
                      {saving?'⏳ جارٍ الإرسال...':'📤 إرسال الرد'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab==='canned' && (
            canned.length===0 ? <EmptyState icon="💬" title="لا توجد ردود جاهزة" /> : (
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {canned.map(c=>(
                  <div key={c.id} style={{ padding:'1rem',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                        <span style={{ fontWeight:700 }}>{c.name}</span>
                        {c.category && <Badge color="info">{c.category}</Badge>}
                      </div>
                      <p style={{ fontSize:'0.875rem',color:'var(--text-secondary)',whiteSpace:'pre-wrap' }}>{c.body}</p>
                    </div>
                    <button onClick={async()=>{await api.delete(`/helpdesk/canned-responses/${c.id}`);setCanned(p=>p.filter(x=>x.id!==c.id));show('تم الحذف')}} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-danger)',fontSize:'0.8rem',flexShrink:0 }}>حذف</button>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
      <Modal open={showTicketForm} onClose={()=>setShowTicketForm(false)} title="تذكرة دعم جديدة"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowTicketForm(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={saveTicket} disabled={saving}>{saving?'⏳...':'إنشاء'}</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">الموضوع *</label>
            <input style={INP} value={ticketForm.subject} onChange={e=>setTicketForm(p=>({...p,subject:e.target.value}))} /></div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem' }}>
            <div className="input-group"><label className="input-label">الأولوية</label>
              <select style={INP} value={ticketForm.priority} onChange={e=>setTicketForm(p=>({...p,priority:e.target.value}))}>
                {Object.entries(PRIORITY).map(([k,v])=><option key={k} value={k}>{v.ar}</option>)}
              </select></div>
            <div className="input-group"><label className="input-label">الفئة</label>
              <select style={INP} value={ticketForm.category} onChange={e=>setTicketForm(p=>({...p,category:e.target.value}))}>
                <option value="">اختر فئة</option>
                {['تقني','مالي','شحن','المنتجات','العضوية','أخرى'].map(c=><option key={c}>{c}</option>)}
              </select></div>
          </div>
          <div className="input-group"><label className="input-label">التفاصيل *</label>
            <textarea rows={4} style={INP} value={ticketForm.description} onChange={e=>setTicketForm(p=>({...p,description:e.target.value}))} /></div>
        </div>
      </Modal>
      <Modal open={showCannedForm} onClose={()=>setShowCannedForm(false)} title="إضافة رد جاهز"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowCannedForm(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={saveCanned} disabled={saving}>{saving?'⏳...':'حفظ'}</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">اسم الرد *</label>
            <input style={INP} value={cannedForm.name} onChange={e=>setCannedForm(p=>({...p,name:e.target.value}))} placeholder="مثال: ترحيب" /></div>
          <div className="input-group"><label className="input-label">الفئة</label>
            <input style={INP} value={cannedForm.category} onChange={e=>setCannedForm(p=>({...p,category:e.target.value}))} /></div>
          <div className="input-group"><label className="input-label">نص الرد *</label>
            <textarea rows={5} style={INP} value={cannedForm.body} onChange={e=>setCannedForm(p=>({...p,body:e.target.value}))} /></div>
        </div>
      </Modal>
    </ERPLayout>
  )
}
