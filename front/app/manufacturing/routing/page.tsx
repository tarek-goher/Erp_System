'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type RoutingStep = {
  sequence?: number
  work_center_name?: string
  operation?: string
  duration_minutes?: number
}

type Routing = {
  id: number
  name: string
  code?: string
  product_name?: string
  product?: { id: number; name: string }
  status: string
  steps?: RoutingStep[]
  created_at: string
}

type WorkCenter = { id: number; name: string; code?: string }
type Product    = { id: number; name: string; sku?: string }

export default function RoutingPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  const [items, setItems] = useState<Routing[]>([])
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [viewItem, setViewItem] = useState<Routing | null>(null)
  const [editItem, setEditItem] = useState<Routing | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  const emptyStep = (): RoutingStep => ({ sequence: 1, work_center_name: '', operation: '', duration_minutes: 0 })
  const emptyForm = { name: '', code: '', product_id: '', status: 'active', steps: [emptyStep()] }
  const [form, setForm] = useState(emptyForm)

  const fetch = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }) })
    const res = await api.get<{ data: Routing[] }>(`/manufacturing/routings?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as Routing[] : []))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [search])
  useEffect(() => {
    api.get<{ data: WorkCenter[] }>('/manufacturing/work-centers?per_page=100').then(r => {
      if (r.data) setWorkCenters(r.data.data || (Array.isArray(r.data) ? r.data as WorkCenter[] : []))
    })
    api.get<{ data: Product[] }>('/products?per_page=100').then(r => {
      if (r.data) setProducts(r.data.data || (Array.isArray(r.data) ? r.data as Product[] : []))
    })
  }, [])

  const openNew = () => { setEditItem(null); setForm(emptyForm); setFormErr(''); setModal(true) }
  const openEdit = (item: Routing) => {
    setEditItem(item)
    setForm({ name: item.name, code: item.code || '', product_id: '', status: item.status, steps: item.steps?.length ? item.steps : [emptyStep()] })
    setFormErr(''); setModal(true)
  }

  const handleAddStep = () => setForm(f => ({ ...f, steps: [...f.steps, { ...emptyStep(), sequence: f.steps.length + 1 }] }))
  const handleRemoveStep = (i: number) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))
  const handleStepChange = (i: number, field: keyof RoutingStep, val: string) =>
    setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.name) { setFormErr(t('required_field')); return }
    setSaving(true)
    const body = { name: form.name, code: form.code, product_id: form.product_id ? Number(form.product_id) : null, status: form.status, steps: form.steps }
    const res = editItem ? await api.put(`/manufacturing/routings/${editItem.id}`, body) : await api.post('/manufacturing/routings', body)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false); fetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/manufacturing/routings/${deleteId}`)
    setDeleteId(null); setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const statusBadge = (s: string) => ({ active: 'badge-success', inactive: 'badge-muted', archived: 'badge-muted' }[s] || 'badge-muted')

  return (
    <ERPLayout pageTitle={ar ? 'مسارات التصنيع' : 'Manufacturing Routing'}>
      <div className="toolbar">
        <div className="search-bar">
          <span>🔍</span>
          <input placeholder={ar ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ {ar ? 'مسار جديد' : 'New Routing'}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔀</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>{t('name')}</th>
                <th>{ar ? 'الكود' : 'Code'}</th>
                <th>{t('product')}</th>
                <th>{ar ? 'عدد الخطوات' : 'Steps'}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.name}</td>
                    <td className="text-muted">{item.code || '—'}</td>
                    <td>{item.product?.name || item.product_name || '—'}</td>
                    <td>{item.steps?.length ?? '—'}</td>
                    <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setViewItem(item)}>{t('view')}</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>{t('edit')}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 750 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? (ar ? 'تعديل مسار' : 'Edit Routing') : (ar ? 'مسار تصنيع جديد' : 'New Routing')}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">{t('name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الكود' : 'Code'}</label>
                    <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('product')}</label>
                    <select className="input" value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}>
                      <option value="">{ar ? '-- اختر منتج --' : '-- Select Product --'}</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('status')}</label>
                    <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">{ar ? 'نشط' : 'Active'}</option>
                      <option value="inactive">{ar ? 'غير نشط' : 'Inactive'}</option>
                    </select>
                  </div>
                </div>

                <h4 style={{ marginBottom: 8 }}>{ar ? 'خطوات التصنيع' : 'Manufacturing Steps'}</h4>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead><tr>
                      <th style={{ width: 50 }}>#</th>
                      <th>{ar ? 'مركز العمل' : 'Work Center'}</th>
                      <th>{ar ? 'العملية' : 'Operation'}</th>
                      <th>{ar ? 'المدة (دقيقة)' : 'Duration (min)'}</th>
                      <th></th>
                    </tr></thead>
                    <tbody>
                      {form.steps.map((step, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            <input className="input" list={`wc-${i}`} value={step.work_center_name} onChange={e => handleStepChange(i, 'work_center_name', e.target.value)} placeholder={ar ? 'مركز العمل' : 'Work center'} />
                            <datalist id={`wc-${i}`}>
                              {workCenters.map(wc => <option key={wc.id} value={wc.name} />)}
                            </datalist>
                          </td>
                          <td><input className="input" value={step.operation} onChange={e => handleStepChange(i, 'operation', e.target.value)} placeholder={ar ? 'اسم العملية' : 'Operation name'} /></td>
                          <td><input className="input" type="number" min="0" value={step.duration_minutes || ''} onChange={e => handleStepChange(i, 'duration_minutes', e.target.value)} style={{ width: 100 }} /></td>
                          <td>{form.steps.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveStep(i)}>✕</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddStep}>+ {ar ? 'إضافة خطوة' : 'Add Step'}</button>
                {formErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {formErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar ? 'تفاصيل المسار' : 'Routing Details'} — {viewItem.name}</h3>
              <button className="btn-icon" onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              {viewItem.steps && viewItem.steps.length > 0 ? (
                <table className="table">
                  <thead><tr>
                    <th>#</th>
                    <th>{ar ? 'مركز العمل' : 'Work Center'}</th>
                    <th>{ar ? 'العملية' : 'Operation'}</th>
                    <th>{ar ? 'المدة (دقيقة)' : 'Duration (min)'}</th>
                  </tr></thead>
                  <tbody>
                    {viewItem.steps.map((s, i) => (
                      <tr key={i}>
                        <td>{s.sequence || i + 1}</td>
                        <td>{s.work_center_name || '—'}</td>
                        <td>{s.operation || '—'}</td>
                        <td>{s.duration_minutes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted">{ar ? 'لا توجد خطوات' : 'No steps'}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewItem(null)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3>{t('confirm_delete')}</h3>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </ERPLayout>
  )
}
