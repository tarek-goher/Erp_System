'use client'

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { Badge, EmptyState, ToastContainer, Modal } from '../../../components/ui'

interface FormField {
  name: string
  type: 'text' | 'textarea' | 'select' | 'date' | 'file' | 'number' | 'email'
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
}

interface ServiceCatalog {
  id: number
  name: string
  description: string
  icon: string
  category: 'IT' | 'HR' | 'Admin' | 'Finance' | 'Other'
  form_schema: { fields: FormField[] }
  default_priority: string
  default_assigned_role: string
  sla_hours: number
  requires_approval: boolean
  is_active: boolean
}

const CAT_ICONS: Record<string, string> = { IT: '💻', HR: '👥', Admin: '📋', Finance: '💰', Other: '⭐' }
const CAT_COLORS: Record<string, string> = {
  IT: 'var(--color-info)', HR: 'var(--color-primary)',
  Admin: 'var(--color-warning)', Finance: 'var(--color-success)', Other: 'var(--color-secondary)',
}

const MOCK_SERVICES: ServiceCatalog[] = [
  { id: 1, name: 'طلب جهاز جديد', description: 'طلب كمبيوتر أو لابتوب جديد', icon: '💻', category: 'IT', form_schema: { fields: [{ name: 'device_type', label: 'نوع الجهاز', type: 'select', required: true }] }, default_priority: 'medium', default_assigned_role: 'IT', sla_hours: 48, requires_approval: true, is_active: true },
  { id: 2, name: 'إجازة سنوية', description: 'طلب إجازة سنوية مدفوعة', icon: '🏖️', category: 'HR', form_schema: { fields: [] }, default_priority: 'low', default_assigned_role: 'HR', sla_hours: 24, requires_approval: true, is_active: true },
  { id: 3, name: 'دعم تقني', description: 'مشكلة تقنية تحتاج دعم', icon: '🔧', category: 'IT', form_schema: { fields: [] }, default_priority: 'high', default_assigned_role: 'IT', sla_hours: 4, requires_approval: false, is_active: true },
]

const EMPTY_FORM = {
  name: '', description: '', icon: '', category: 'IT' as ServiceCatalog['category'],
  default_priority: 'medium', default_assigned_role: '', sla_hours: 24,
  requires_approval: false, is_active: true, form_schema: { fields: [] as FormField[] },
}
const EMPTY_FIELD = { type: 'text' as FormField['type'], label: '', name: '', required: false }

export default function ServiceCatalogPage() {
  const { toasts, show, remove } = useToast()
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [newField, setNewField] = useState({ ...EMPTY_FIELD })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await api.get('/service-catalog')
    const raw = res.data
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : null)
    if (list) { setServices(list); setIsMock(false) }
    else { setServices(MOCK_SERVICES); setIsMock(true) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY_FORM, form_schema: { fields: [] } }); setNewField({ ...EMPTY_FIELD }); setShowForm(true) }
  const openEdit = (s: ServiceCatalog) => {
    setEditId(s.id)
    setForm({ name: s.name, description: s.description, icon: s.icon, category: s.category, default_priority: s.default_priority, default_assigned_role: s.default_assigned_role, sla_hours: s.sla_hours, requires_approval: s.requires_approval, is_active: s.is_active, form_schema: { fields: [...(s.form_schema?.fields || [])] } })
    setNewField({ ...EMPTY_FIELD })
    setShowForm(true)
  }

  const addField = () => {
    if (!newField.label || !newField.name) { show('اسم الحقل والعنوان مطلوبان', 'error'); return }
    setForm(p => ({ ...p, form_schema: { fields: [...p.form_schema.fields, newField as FormField] } }))
    setNewField({ ...EMPTY_FIELD })
  }

  const removeField = (idx: number) => {
    setForm(p => ({ ...p, form_schema: { fields: p.form_schema.fields.filter((_, i) => i !== idx) } }))
  }

  const save = async () => {
    if (!form.name.trim()) { show('اسم الخدمة مطلوب', 'error'); return }
    setSaving(true)
    const res = editId
      ? await api.put(`/service-catalog/${editId}`, form)
      : await api.post('/service-catalog', form)
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(editId ? 'تم التحديث ✅' : 'تم الإضافة ✅')
    setShowForm(false)
    if (!isMock) { await load() }
    else {
      if (editId) setServices(p => p.map(s => s.id === editId ? { ...s, ...form } as ServiceCatalog : s))
      else setServices(p => [...p, { id: Date.now(), ...form } as ServiceCatalog])
    }
  }

  const destroy = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return
    const res = await api.delete(`/service-catalog/${id}`)
    if (!res.error) setServices(p => p.filter(s => s.id !== id))
    else show(res.error || 'حدث خطأ', 'error')
  }

  const toggleActive = async (s: ServiceCatalog) => {
    const res = await api.put(`/service-catalog/${s.id}`, { ...s, is_active: !s.is_active })
    if (!res.error) setServices(p => p.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x))
    else show(res.error || 'حدث خطأ', 'error')
  }

  const INP: React.CSSProperties = {
    width: '100%', padding: '0.6rem 1rem',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <ERPLayout pageTitle="كتالوج الخدمات">
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="page-header">
        <div>
          <h1 className="page-title">📦 كتالوج الخدمات</h1>
          <p className="page-subtitle">إدارة الخدمات والنماذج الديناميكية</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMock && (
            <span style={{ padding: '4px 10px', background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              ⚠️ بيانات تجريبية
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ خدمة جديدة</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        {[
          { label: 'إجمالي', value: services.length, color: 'var(--color-primary)' },
          { label: 'نشطة', value: services.filter(s => s.is_active).length, color: 'var(--color-success)' },
          { label: 'معطّلة', value: services.filter(s => !s.is_active).length, color: 'var(--color-danger)' },
          { label: 'تتطلب موافقة', value: services.filter(s => s.requires_approval).length, color: 'var(--color-warning)' },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : services.length === 0 ? (
        <EmptyState icon="📦" title="لا توجد خدمات بعد" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {services.map(s => (
            <div key={s.id} style={{
              padding: '1.25rem', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              borderTop: `4px solid ${CAT_COLORS[s.category] || 'var(--color-primary)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon || CAT_ICONS[s.category]}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{CAT_ICONS[s.category]} {s.category}</div>
                  </div>
                </div>
                <Badge color={s.is_active ? 'success' : 'gray'}>{s.is_active ? 'نشطة' : 'معطّلة'}</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, minHeight: 32 }}>{s.description}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>⏱️ {s.sla_hours}h</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>📋 {s.form_schema?.fields?.length || 0} حقول</span>
                {s.requires_approval && <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-full)', color: 'var(--color-warning)' }}>✅ موافقة</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(s)}>✏️ تعديل</button>
                <button className="btn btn-sm" onClick={() => toggleActive(s)}
                  style={{ flex: 1, background: s.is_active ? 'var(--color-danger-light)' : 'var(--color-success-light)', color: s.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {s.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => destroy(s.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'تعديل الخدمة' : 'خدمة جديدة'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳...' : 'حفظ'}</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">اسم الخدمة *</label>
            <input style={INP} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">الفئة</label>
            <select style={INP} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as any }))}>
              <option value="IT">💻 IT</option>
              <option value="HR">👥 HR</option>
              <option value="Admin">📋 Admin</option>
              <option value="Finance">💰 Finance</option>
              <option value="Other">⭐ Other</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">أيقونة (emoji)</label>
            <input style={INP} value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="💻" />
          </div>
          <div className="input-group">
            <label className="input-label">ساعات SLA</label>
            <input type="number" min="1" style={INP} value={form.sla_hours}
              onChange={e => setForm(p => ({ ...p, sla_hours: parseInt(e.target.value) || 24 }))} />
          </div>
          <div className="input-group">
            <label className="input-label">الأولوية الافتراضية</label>
            <select style={INP} value={form.default_priority} onChange={e => setForm(p => ({ ...p, default_priority: e.target.value }))}>
              <option value="low">منخفض</option>
              <option value="medium">متوسط</option>
              <option value="high">عالي</option>
              <option value="urgent">عاجل</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">الدور الافتراضي للتعيين</label>
            <input style={INP} value={form.default_assigned_role}
              onChange={e => setForm(p => ({ ...p, default_assigned_role: e.target.value }))} placeholder="IT, HR, ..." />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">الوصف</label>
            <textarea rows={2} style={{ ...INP, resize: 'vertical' }} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
              <span className="input-label" style={{ margin: 0 }}>مفعّلة</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.requires_approval} onChange={e => setForm(p => ({ ...p, requires_approval: e.target.checked }))} />
              <span className="input-label" style={{ margin: 0 }}>تتطلب موافقة</span>
            </label>
          </div>

          {/* Dynamic Fields */}
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label" style={{ marginBottom: 8 }}>حقول النموذج الديناميكي</label>
            {form.form_schema.fields.map((field, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', marginBottom: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>
                  <strong>{field.label}</strong> <span style={{ color: 'var(--text-muted)' }}>({field.type})</span>
                  {field.required && <span style={{ color: 'var(--color-danger)', marginRight: 4 }}>*</span>}
                </span>
                <button type="button" onClick={() => removeField(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '1rem' }}>🗑️</button>
              </div>
            ))}
            <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>اسم الحقل</label>
                  <input style={{ ...INP, padding: '0.4rem 0.6rem' }} value={newField.name}
                    onChange={e => setNewField(p => ({ ...p, name: e.target.value }))} placeholder="field_name" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>العنوان</label>
                  <input style={{ ...INP, padding: '0.4rem 0.6rem' }} value={newField.label}
                    onChange={e => setNewField(p => ({ ...p, label: e.target.value }))} placeholder="Label" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>النوع</label>
                  <select style={{ ...INP, padding: '0.4rem 0.6rem' }} value={newField.type}
                    onChange={e => setNewField(p => ({ ...p, type: e.target.value as any }))}>
                    <option value="text">نص</option>
                    <option value="email">بريد</option>
                    <option value="number">رقم</option>
                    <option value="textarea">نص طويل</option>
                    <option value="select">قائمة</option>
                    <option value="date">تاريخ</option>
                    <option value="file">ملف</option>
                  </select>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={addField} style={{ whiteSpace: 'nowrap' }}>+ إضافة</button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </ERPLayout>
  )
}
