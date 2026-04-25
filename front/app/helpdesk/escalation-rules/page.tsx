'use client'

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { Badge, EmptyState, ToastContainer, Modal } from '../../../components/ui'

interface EscalationRule {
  id: number
  name: string
  trigger: 'sla_response_breach' | 'sla_resolution_breach' | 'no_update'
  after_hours: number
  action: 'notify_supervisor' | 'reassign' | 'change_priority' | 'send_email'
  action_data: Record<string, any>
  is_active: boolean
}

const TRIGGER_LABELS: Record<string, string> = {
  sla_response_breach: 'انتهاك SLA للرد',
  sla_resolution_breach: 'انتهاك SLA للحل',
  no_update: 'لا توجد تحديثات',
}
const TRIGGER_ICONS: Record<string, string> = {
  sla_response_breach: '⏰',
  sla_resolution_breach: '🚨',
  no_update: '⏸️',
}
const ACTION_LABELS: Record<string, string> = {
  notify_supervisor: 'إخطار المشرف',
  reassign: 'إعادة تعيين',
  change_priority: 'تغيير الأولوية',
  send_email: 'إرسال بريد',
}
const ACTION_ICONS: Record<string, string> = {
  notify_supervisor: '📢',
  reassign: '🔄',
  change_priority: '⬆️',
  send_email: '📧',
}

const MOCK_RULES: EscalationRule[] = [
  { id: 1, name: 'تصعيد انتهاك SLA الرد', trigger: 'sla_response_breach', after_hours: 2, action: 'notify_supervisor', action_data: { notify_assignee: true }, is_active: true },
  { id: 2, name: 'إعادة تعيين عند التأخير', trigger: 'no_update', after_hours: 24, action: 'reassign', action_data: {}, is_active: true },
  { id: 3, name: 'رفع أولوية انتهاك الحل', trigger: 'sla_resolution_breach', after_hours: 4, action: 'change_priority', action_data: { new_priority: 'urgent' }, is_active: false },
]

const EMPTY_FORM = {
  name: '',
  trigger: 'sla_response_breach' as EscalationRule['trigger'],
  after_hours: 1,
  action: 'notify_supervisor' as EscalationRule['action'],
  action_data: {} as Record<string, any>,
  is_active: true,
}

export default function EscalationRulesPage() {
  const { toasts, show, remove } = useToast()
  const [rules, setRules] = useState<EscalationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await api.get('/escalation-rules')
    const raw = res.data
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : null)
    if (list) { setRules(list); setIsMock(false) }
    else { setRules(MOCK_RULES); setIsMock(true) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true) }
  const openEdit = (r: EscalationRule) => {
    setEditId(r.id)
    setForm({ name: r.name, trigger: r.trigger, after_hours: r.after_hours, action: r.action, action_data: r.action_data, is_active: r.is_active })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name) { show('اسم القاعدة مطلوب', 'error'); return }
    setSaving(true)
    const res = editId
      ? await api.put(`/escalation-rules/${editId}`, form)
      : await api.post('/escalation-rules', form)
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(editId ? 'تم التحديث ✅' : 'تم الإضافة ✅')
    setShowForm(false)
    if (!isMock) { await load() }
    else {
      if (editId) setRules(p => p.map(r => r.id === editId ? { ...r, ...form } : r))
      else setRules(p => [...p, { id: Date.now(), ...form }])
    }
  }

  const toggleActive = async (r: EscalationRule) => {
    const res = await api.put(`/escalation-rules/${r.id}`, { ...r, is_active: !r.is_active })
    if (!res.error) setRules(p => p.map(x => x.id === r.id ? { ...x, is_active: !x.is_active } : x))
    else show(res.error || 'حدث خطأ', 'error')
  }

  const destroy = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return
    const res = await api.delete(`/escalation-rules/${id}`)
    if (!res.error) setRules(p => p.filter(r => r.id !== id))
    else show(res.error || 'حدث خطأ', 'error')
  }

  const INP: React.CSSProperties = {
    width: '100%', padding: '0.6rem 1rem',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <ERPLayout pageTitle="قواعد التصعيد">
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="page-header">
        <div>
          <h1 className="page-title">🚨 قواعد التصعيد</h1>
          <p className="page-subtitle">إدارة قواعد التصعيد التلقائي للتذاكر</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMock && (
            <span style={{ padding: '4px 10px', background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              ⚠️ بيانات تجريبية
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ قاعدة جديدة</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        {[
          { label: 'إجمالي', value: rules.length, color: 'var(--color-primary)' },
          { label: 'نشطة', value: rules.filter(r => r.is_active).length, color: 'var(--color-success)' },
          { label: 'معطّلة', value: rules.filter(r => !r.is_active).length, color: 'var(--color-danger)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState icon="🚨" title="لا توجد قواعد بعد" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map(rule => (
            <div key={rule.id} style={{
              padding: '1.25rem', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              borderInlineStart: `4px solid ${rule.is_active ? 'var(--color-danger)' : 'var(--border)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rule.name}</span>
                    <Badge color={rule.is_active ? 'success' : 'gray'}>{rule.is_active ? 'نشطة' : 'معطّلة'}</Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>{TRIGGER_ICONS[rule.trigger]} <strong>المحفّز:</strong> {TRIGGER_LABELS[rule.trigger]}</span>
                    <span>⏱️ <strong>بعد:</strong> {rule.after_hours} ساعة</span>
                    <span>{ACTION_ICONS[rule.action]} <strong>الإجراء:</strong> {ACTION_LABELS[rule.action]}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(rule)}>تعديل</button>
                  <button className="btn btn-sm" onClick={() => toggleActive(rule)}
                    style={{ background: rule.is_active ? 'var(--color-danger-light)' : 'var(--color-success-light)', color: rule.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {rule.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => destroy(rule.id)}>حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'تعديل القاعدة' : 'قاعدة جديدة'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳...' : 'حفظ'}</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">اسم القاعدة *</label>
            <input style={INP} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: انتهاك SLA للرد" />
          </div>
          <div className="input-group">
            <label className="input-label">المحفّز</label>
            <select style={INP} value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value as any }))}>
              <option value="sla_response_breach">⏰ انتهاك SLA للرد</option>
              <option value="sla_resolution_breach">🚨 انتهاك SLA للحل</option>
              <option value="no_update">⏸️ لا توجد تحديثات</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">بعد كم ساعة؟</label>
            <input type="number" min="1" style={INP} value={form.after_hours}
              onChange={e => setForm(p => ({ ...p, after_hours: parseInt(e.target.value) || 1 }))} />
          </div>
          <div className="input-group">
            <label className="input-label">الإجراء</label>
            <select style={INP} value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value as any }))}>
              <option value="notify_supervisor">📢 إخطار المشرف</option>
              <option value="reassign">🔄 إعادة تعيين</option>
              <option value="change_priority">⬆️ تغيير الأولوية</option>
              <option value="send_email">📧 إرسال بريد</option>
            </select>
          </div>
          {form.action === 'change_priority' && (
            <div className="input-group">
              <label className="input-label">الأولوية الجديدة</label>
              <select style={INP} value={form.action_data?.new_priority || 'urgent'}
                onChange={e => setForm(p => ({ ...p, action_data: { ...p.action_data, new_priority: e.target.value } }))}>
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">عالي</option>
                <option value="urgent">عاجل</option>
              </select>
            </div>
          )}
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
              <span className="input-label" style={{ margin: 0 }}>مفعّلة</span>
            </label>
          </div>
        </div>
      </Modal>
    </ERPLayout>
  )
}
