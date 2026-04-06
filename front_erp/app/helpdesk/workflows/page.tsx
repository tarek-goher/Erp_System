'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { Badge, EmptyState, ToastContainer, Modal } from '../../../components/ui'

type Workflow = { id: string; name: string; trigger: string; conditions: string; actions: string; is_active: boolean; executions?: number }

const TRIGGERS = ['ticket_created','ticket_updated','ticket_assigned','sla_breach','first_response','ticket_resolved']
const TRIGGER_LABELS: Record<string, string> = {
  ticket_created:'عند إنشاء تذكرة', ticket_updated:'عند تحديث تذكرة',
  ticket_assigned:'عند تعيين التذكرة', sla_breach:'عند خرق SLA',
  first_response:'عند أول رد', ticket_resolved:'عند حل التذكرة',
}

const MOCK_WORKFLOWS: Workflow[] = [
  { id:'1', name:'التعيين التلقائي للتذاكر العاجلة', trigger:'ticket_created', conditions:'priority=urgent', actions:'assign_to:team_lead,send_notification', is_active:true, executions:47 },
  { id:'2', name:'تصعيد SLA', trigger:'sla_breach', conditions:'priority=high', actions:'notify_manager,increase_priority', is_active:true, executions:12 },
  { id:'3', name:'إشعار العميل عند الحل', trigger:'ticket_resolved', conditions:'', actions:'send_email:customer', is_active:false, executions:183 },
]

export default function WorkflowsPage() {
  const { toasts, show, remove } = useToast()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading]     = useState(true)
  const [isMock, setIsMock]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({ name:'', trigger:'ticket_created', conditions:'', actions:'' })

  const load = async () => {
    setLoading(true)
    const res = await api.get('/helpdesk/workflows')
    const raw = res.data; const list = Array.isArray(raw)?raw:(Array.isArray(raw?.data)?raw.data:null)
    if (list) { setWorkflows(list); setIsMock(false) } else { setWorkflows(MOCK_WORKFLOWS); setIsMock(true) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditId(null); setForm({name:'',trigger:'ticket_created',conditions:'',actions:''}); setShowForm(true) }
  const openEdit = (w: Workflow) => { setEditId(w.id); setForm({name:w.name,trigger:w.trigger,conditions:w.conditions,actions:w.actions}); setShowForm(true) }

  const save = async () => {
    if (!form.name || !form.actions) { show('الاسم والإجراءات مطلوبان', 'error'); return }
    setSaving(true)
    const res = editId ? await api.put(`/helpdesk/workflows/${editId}`, form) : await api.post('/helpdesk/workflows', form)
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(editId?'تم التحديث ✅':'تم الإضافة ✅'); setShowForm(false)
    if (!isMock) await load()
    else {
      if (editId) setWorkflows(p => p.map(w => w.id===editId?{...w,...form}:w))
      else setWorkflows(p => [...p, {id:Date.now().toString(),...form,is_active:true,executions:0}])
    }
  }

  const toggleActive = async (w: Workflow) => {
    const res = await api.post(`/helpdesk/workflows/${w.id}/toggle`)
    if (!res.error) setWorkflows(p => p.map(x => x.id===w.id?{...x,is_active:!x.is_active}:x))
    else show(res.error, 'error')
  }

  const destroy = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    const res = await api.delete(`/helpdesk/workflows/${id}`)
    if (!res.error) setWorkflows(p => p.filter(w => w.id!==id))
    else show(res.error, 'error')
  }

  const duplicate = (w: Workflow) => {
    setWorkflows(p => [...p, {...w,id:Date.now().toString(),name:`نسخة من ${w.name}`,is_active:false,executions:0}])
    show('تم النسخ ✅')
  }

  const INP: React.CSSProperties = {
    width:'100%', padding:'0.6rem 1rem', background:'var(--bg-input)',
    border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
    color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'inherit', outline:'none',
  }

  return (
    <ERPLayout pageTitle="سير العمل التلقائي">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div><h1 className="page-title">⚙️ سير العمل التلقائي</h1><p className="page-subtitle">أتمتة المهام وتصعيد التذاكر تلقائياً</p></div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          {isMock && <span style={{ padding:'4px 10px',background:'var(--color-warning-light)',color:'var(--color-warning)',borderRadius:'var(--radius-full)',fontSize:'0.75rem',fontWeight:600 }}>⚠️ بيانات تجريبية</span>}
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ سير عمل جديد</button>
        </div>
      </div>
      <div style={{ display:'flex',gap:16,marginBottom:'1.5rem',padding:'1rem',background:'var(--bg-card)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)' }}>
        {[
          { label:'إجمالي', value:workflows.length, color:'var(--color-primary)' },
          { label:'نشطة',   value:workflows.filter(w=>w.is_active).length,  color:'var(--color-success)' },
          { label:'معطّلة', value:workflows.filter(w=>!w.is_active).length, color:'var(--color-danger)' },
          { label:'إجمالي التنفيذات', value:workflows.reduce((s,w)=>s+(w.executions??0),0), color:'var(--color-warning)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center',flex:1 }}>
            <div style={{ fontSize:'1.4rem',fontWeight:800,color:s.color }}>{s.value.toLocaleString('ar-EG')}</div>
            <div style={{ fontSize:'0.75rem',color:'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {loading ? (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {Array(4).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:100 }} />)}
        </div>
      ) : workflows.length===0 ? <EmptyState icon="⚙️" title="لا توجد سير عمل" /> : (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {workflows.map(w => (
            <div key={w.id} style={{ padding:'1.25rem',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',borderInlineStart:`4px solid ${w.is_active?'var(--color-success)':'var(--border)'}` }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                    <span style={{ fontWeight:700,fontSize:'0.95rem' }}>{w.name}</span>
                    <Badge color={w.is_active?'success':'gray'}>{w.is_active?'نشط':'معطّل'}</Badge>
                    {w.executions!==undefined && <span style={{ fontSize:'0.75rem',color:'var(--text-muted)' }}>🔄 {w.executions} تنفيذ</span>}
                  </div>
                  <div style={{ display:'flex',gap:16,flexWrap:'wrap',fontSize:'0.8rem',color:'var(--text-secondary)' }}>
                    <span>⚡ <strong>المحفّز:</strong> {TRIGGER_LABELS[w.trigger]??w.trigger}</span>
                    {w.conditions && <span>🔍 <strong>الشروط:</strong> {w.conditions}</span>}
                    <span>🎯 <strong>الإجراءات:</strong> {w.actions}</span>
                  </div>
                </div>
                <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                  <button className="btn btn-sm" style={{ background:'var(--color-info-light)',color:'var(--color-info)' }} onClick={() => duplicate(w)}>نسخ</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(w)}>تعديل</button>
                  <button className="btn btn-sm" onClick={() => toggleActive(w)} style={{ background:w.is_active?'var(--color-danger-light)':'var(--color-success-light)',color:w.is_active?'var(--color-danger)':'var(--color-success)' }}>
                    {w.is_active?'تعطيل':'تفعيل'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => destroy(w.id)}>حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId?'تعديل سير العمل':'سير عمل جديد'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'⏳...':'حفظ'}</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">اسم سير العمل *</label>
            <input style={INP} value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
          <div className="input-group"><label className="input-label">المحفّز (Trigger)</label>
            <select style={INP} value={form.trigger} onChange={e => setForm(p=>({...p,trigger:e.target.value}))}>
              {TRIGGERS.map(t => <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">الشروط (اختياري)</label>
            <input style={INP} value={form.conditions} onChange={e => setForm(p=>({...p,conditions:e.target.value}))} placeholder="priority=urgent, category=technical" /></div>
          <div className="input-group"><label className="input-label">الإجراءات *</label>
            <textarea rows={3} style={INP} value={form.actions} onChange={e => setForm(p=>({...p,actions:e.target.value}))} placeholder="assign_to:team_lead, send_notification:manager" /></div>
        </div>
      </Modal>
    </ERPLayout>
  )
}
