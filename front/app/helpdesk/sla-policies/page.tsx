'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { StatCard, EmptyState, Modal, ToastContainer } from '../../../components/ui'

type SlaPolicy = {
  id: string | number
  name: string
  response_hours: number
  resolution_hours: number
  is_active: boolean
  created_at: string
}

const DEFAULT_FORM = {
  name:             '',
  response_hours:   4,
  resolution_hours: 24,
  is_active:        true,
}

export default function SlaPoliciesPage() {
  const { toasts, show, remove } = useToast()

  const [policies, setPolicies] = useState<SlaPolicy[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<SlaPolicy | null>(null)
  const [form,     setForm]     = useState(DEFAULT_FORM)

  useEffect(() => { loadPolicies() }, [])

  const loadPolicies = async () => {
    setLoading(true)
    try {
      const res = await api.get('/sla-policies')
      setPolicies(res.data?.data || res.data || [])
    } catch {
      show('خطأ في تحميل البيانات', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => { setSelected(null); setForm(DEFAULT_FORM); setShowForm(true) }

  const openEdit = (policy: SlaPolicy) => {
    setSelected(policy)
    setForm({ name: policy.name, response_hours: policy.response_hours, resolution_hours: policy.resolution_hours, is_active: policy.is_active })
    setShowForm(true)
  }

  const savePolicy = async () => {
    if (!form.name) { show('اسم السياسة مطلوب', 'error'); return }
    setSaving(true)
    try {
      const res = selected
        ? await api.put(`/sla-policies/${selected.id}`, form)
        : await api.post('/sla-policies', form)
      if (res.error) { show(res.error, 'error') }
      else { show(selected ? 'تم التحديث ✅' : 'تم الإنشاء ✅', 'success'); setShowForm(false); loadPolicies() }
    } catch { show('خطأ في الحفظ', 'error') }
    finally { setSaving(false) }
  }

  const toggleActive = async (policy: SlaPolicy) => {
    try {
      const res = await api.put(`/sla-policies/${policy.id}`, { ...policy, is_active: !policy.is_active })
      if (res.error) { show(res.error, 'error') }
      else {
        setPolicies(p => p.map(pl => pl.id === policy.id ? { ...pl, is_active: !pl.is_active } : pl))
        show(policy.is_active ? 'تم التعطيل' : 'تم التفعيل', 'success')
      }
    } catch { show('خطأ', 'error') }
  }

  const deletePolicy = async (id: string | number) => {
    if (!confirm('هل أنت متأكد؟')) return
    try {
      const res = await api.delete(`/sla-policies/${id}`)
      if (res.error) { show(res.error, 'error') }
      else { show('تم الحذف', 'success'); setPolicies(p => p.filter(pl => pl.id !== id)) }
    } catch { show('خطأ في الحذف', 'error') }
  }

  const INP: React.CSSProperties = { width:'100%', padding:'0.6rem 1rem', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'inherit', outline:'none' }
  const activePolicies = policies.filter(p => p.is_active)

  return (
    <ERPLayout pageTitle="سياسات SLA">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div>
          <h1 className="page-title">⏱️ سياسات مستوى الخدمة (SLA)</h1>
          <p className="page-subtitle">تحديد أوقات الاستجابة والحل</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ سياسة جديدة</button>
      </div>
      <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
        <StatCard icon="📋" label="إجمالي السياسات" value={policies.length} />
        <StatCard icon="✅" label="سياسات فعّالة" value={activePolicies.length} accent="var(--color-success)" />
        <StatCard icon="⏰" label="متوسط وقت الرد" value={activePolicies.length > 0 ? `${Math.round(activePolicies.reduce((s,p) => s + p.response_hours, 0) / activePolicies.length)}س` : '—'} />
        <StatCard icon="🏁" label="متوسط وقت الحل" value={activePolicies.length > 0 ? `${Math.round(activePolicies.reduce((s,p) => s + p.resolution_hours, 0) / activePolicies.length)}س` : '—'} />
      </div>
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {Array(4).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:70 }} />)}
        </div>
      ) : policies.length === 0 ? (
        <EmptyState icon="⏱️" title="لا توجد سياسات SLA" description="أضف سياسة للبدء" />
      ) : (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:'1rem', padding:'0.75rem 1rem', background:'var(--bg-hover)', fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
            <span>اسم السياسة</span><span>وقت الرد</span><span>وقت الحل</span><span>الحالة</span><span>إجراءات</span>
          </div>
          {policies.map((policy, idx) => (
            <div key={policy.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:'1rem', padding:'0.875rem 1rem', alignItems:'center', borderBottom: idx < policies.length-1 ? '1px solid var(--border)' : 'none', opacity: policy.is_active ? 1 : 0.55 }}>
              <div style={{ fontWeight:600 }}>{policy.name}</div>
              <div><span style={{ fontWeight:600, color:'var(--color-primary)' }}>{policy.response_hours}</span><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}> س</span></div>
              <div><span style={{ fontWeight:600, color:'var(--color-warning)' }}>{policy.resolution_hours}</span><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}> س</span></div>
              <button onClick={() => toggleActive(policy)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontSize:'0.8rem', color: policy.is_active ? 'var(--color-success)' : 'var(--text-muted)', fontWeight:600 }}>
                {policy.is_active ? '● فعّالة' : '○ معطّلة'}
              </button>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => openEdit(policy)} className="btn btn-sm btn-secondary">✏️</button>
                <button onClick={() => deletePolicy(policy.id)} className="btn btn-sm btn-danger">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => { setShowForm(false); setSelected(null) }} title={selected ? 'تعديل سياسة SLA' : 'سياسة SLA جديدة'}
        footer={<><button className="btn btn-secondary" onClick={() => { setShowForm(false); setSelected(null) }}>إلغاء</button><button className="btn btn-primary" onClick={savePolicy} disabled={saving}>{saving ? '⏳...' : selected ? 'تحديث' : 'إنشاء'}</button></>}>
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">اسم السياسة *</label>
            <input style={INP} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: سياسة الأولوية العاجلة" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="input-group">
              <label className="input-label">وقت الرد الأول (ساعات) *</label>
              <input type="number" min={1} style={INP} value={form.response_hours} onChange={e => setForm(p => ({ ...p, response_hours: Number(e.target.value) }))} />
            </div>
            <div className="input-group">
              <label className="input-label">وقت الحل (ساعات) *</label>
              <input type="number" min={1} style={INP} value={form.resolution_hours} onChange={e => setForm(p => ({ ...p, resolution_hours: Number(e.target.value) }))} />
            </div>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:'0.875rem' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
            <span>تفعيل السياسة فور الحفظ</span>
          </label>
        </div>
      </Modal>
    </ERPLayout>
  )
}
