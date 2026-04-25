'use client'

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { Badge, EmptyState, ToastContainer, Modal } from '../../../components/ui'

interface Tag {
  id: number
  name: string
  color: string
  ticket_count?: number
}

const COLORS = [
  '#2E75B6', '#C55A11', '#70AD47', '#FFC000',
  '#5B9BD5', '#ED7D31', '#A5A5A5', '#FF6B6B',
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA15E', '#BC6C25', '#C1121F', '#780000',
]

const MOCK_TAGS: Tag[] = [
  { id: 1, name: 'عاجل', color: '#C1121F', ticket_count: 12 },
  { id: 2, name: 'مهم', color: '#FFC000', ticket_count: 8 },
  { id: 3, name: 'تقني', color: '#2E75B6', ticket_count: 24 },
  { id: 4, name: 'مالي', color: '#70AD47', ticket_count: 5 },
  { id: 5, name: 'موارد بشرية', color: '#ED7D31', ticket_count: 3 },
]

const EMPTY_FORM = { name: '', color: '#2E75B6' }

export default function TagsPage() {
  const { toasts, show, remove } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await api.get('/tags')
    const raw = res.data
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : null)
    if (list) { setTags(list); setIsMock(false) }
    else { setTags(MOCK_TAGS); setIsMock(true) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true) }
  const openEdit = (t: Tag) => { setEditId(t.id); setForm({ name: t.name, color: t.color }); setShowForm(true) }

  const save = async () => {
    if (!form.name.trim()) { show('اسم الوسم مطلوب', 'error'); return }
    setSaving(true)
    const res = editId
      ? await api.put(`/tags/${editId}`, form)
      : await api.post('/tags', form)
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(editId ? 'تم التحديث ✅' : 'تم الإضافة ✅')
    setShowForm(false)
    if (!isMock) { await load() }
    else {
      if (editId) setTags(p => p.map(t => t.id === editId ? { ...t, ...form } : t))
      else setTags(p => [...p, { id: Date.now(), ...form, ticket_count: 0 }])
    }
  }

  const destroy = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الوسم؟')) return
    const res = await api.delete(`/tags/${id}`)
    if (!res.error) setTags(p => p.filter(t => t.id !== id))
    else show(res.error || 'حدث خطأ', 'error')
  }

  const INP: React.CSSProperties = {
    width: '100%', padding: '0.6rem 1rem',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <ERPLayout pageTitle="الوسوم">
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="page-header">
        <div>
          <h1 className="page-title">🏷️ الوسوم</h1>
          <p className="page-subtitle">إدارة وسوم التذاكر والتصنيفات</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMock && (
            <span style={{ padding: '4px 10px', background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              ⚠️ بيانات تجريبية
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ وسم جديد</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{tags.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>إجمالي الوسوم</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {tags.reduce((s, t) => s + (t.ticket_count || 0), 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>إجمالي الاستخدامات</div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : tags.length === 0 ? (
        <EmptyState icon="🏷️" title="لا توجد وسوم بعد" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {tags.map(tag => (
            <div key={tag.id} style={{
              padding: '1.25rem', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              borderTop: `4px solid ${tag.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tag.name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                🎫 {tag.ticket_count ?? 0} تذكرة
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(tag)}>✏️ تعديل</button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => destroy(tag.id)}>🗑️ حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'تعديل الوسم' : 'وسم جديد'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳...' : 'حفظ'}</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">اسم الوسم *</label>
            <input style={INP} value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="مثال: عاجل، مهم، تقني" />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">اللون</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 10 }}>
              {COLORS.map(color => (
                <button key={color} type="button"
                  onClick={() => setForm(p => ({ ...p, color }))}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: color, border: form.color === color ? '3px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer', transform: form.color === color ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: form.color, border: '1px solid var(--border)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>معاينة: {form.name || 'اسم الوسم'}</span>
            </div>
          </div>
        </div>
      </Modal>
    </ERPLayout>
  )
}
