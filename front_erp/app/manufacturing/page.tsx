'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type WorkOrder = {
  id: number
  reference?: string
  product_name?: string
  product?: { id: number; name: string; sku?: string }
  qty_planned?: number
  qty_produced?: number
  quantity?: number
  status: string
  planned_date?: string
  scheduled_date?: string
  notes?: string
  created_at: string
}

type Product = { id: number; name: string; sku?: string }

const STATUSES = ['draft', 'in_progress', 'done', 'cancelled']

export default function ManufacturingPage() {
  const { t, lang } = useI18n()
  const [items,    setItems]    = useState<WorkOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [modal,    setModal]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')

  const [form, setForm] = useState({
    product_id: '', qty_planned: '', planned_date: '', notes: ''
  })

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }), ...(statusF && { status: statusF }) })
    const res = await api.get<{ data: WorkOrder[] }>(`/manufacturing/work-orders?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as WorkOrder[] : []))
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search, statusF])
  useEffect(() => {
    api.get<{ data: Product[] }>('/products?per_page=100').then(r => {
      if (r.data) setProducts(r.data.data || (Array.isArray(r.data) ? r.data as Product[] : []))
    })
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.product_id || !form.qty_planned) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/manufacturing/work-orders', {
      product_id:  Number(form.product_id),
      qty_planned: Number(form.qty_planned),
      planned_date: form.planned_date || null,
      notes: form.notes,
    })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ product_id: '', qty_planned: '', planned_date: '', notes: '' })
    fetchItems()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/manufacturing/work-orders/${deleteId}`)
    setDeleteId(null)
    setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const statusLabels: Record<string, { ar: string; en: string }> = {
    draft:       { ar: 'مسودة',         en: 'Draft' },
    planned:     { ar: 'مخطط',          en: 'Planned' },
    in_progress: { ar: 'جاري التنفيذ',  en: 'In Progress' },
    done:        { ar: 'مكتمل',         en: 'Done' },
    completed:   { ar: 'مكتمل',         en: 'Completed' },
    cancelled:   { ar: 'ملغي',          en: 'Cancelled' },
  }
  const statusBadge = (s: string) => ({ draft: 'badge-muted', planned: 'badge-info', in_progress: 'badge-warning', done: 'badge-success', completed: 'badge-success', cancelled: 'badge-danger' }[s] || 'badge-muted')
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'
  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'التصنيع' : 'Manufacturing'}>
      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder={lang === 'ar' ? 'بحث في أوامر العمل...' : 'Search work orders...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{lang === 'ar' ? statusLabels[s]?.ar : statusLabels[s]?.en}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + {lang === 'ar' ? 'أمر عمل جديد' : 'New Work Order'}
        </button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🏭</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>#</th>
                <th>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                <th>{lang === 'ar' ? 'الكمية المخططة' : 'Qty Planned'}</th>
                <th>{lang === 'ar' ? 'الكمية المنتجة' : 'Qty Produced'}</th>
                <th>{t('status')}</th>
                <th>{lang === 'ar' ? 'تاريخ الجدولة' : 'Planned Date'}</th>
                <th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="text-muted">{item.reference || `#${item.id}`}</td>
                    <td className="fw-semibold">{item.product?.name || item.product_name || '—'}</td>
                    <td>{fmt(item.qty_planned || item.quantity || 0)}</td>
                    <td>{fmt(item.qty_produced || 0)}</td>
                    <td><span className={`badge ${statusBadge(item.status)}`}>{lang === 'ar' ? statusLabels[item.status]?.ar : statusLabels[item.status]?.en || item.status}</span></td>
                    <td className="text-muted">{fmtDate(item.planned_date || item.scheduled_date || '')}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{lang === 'ar' ? 'أمر عمل جديد' : 'New Work Order'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{lang === 'ar' ? 'المنتج' : 'Product'} *</label>
                    <select className="input" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required>
                      <option value="">{lang === 'ar' ? '-- اختر منتج --' : '-- Select Product --'}</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
                    </select>
                    {products.length === 0 && <small style={{ color: 'var(--color-warning)', fontSize: '0.8rem' }}>⚠️ {lang === 'ar' ? 'لا توجد منتجات — أضف من صفحة المخزون أولاً' : 'No products — add from Inventory first'}</small>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الكمية المخططة' : 'Qty Planned'} *</label>
                    <input className="input" type="number" min="0.01" step="0.01" value={form.qty_planned} onChange={e => setForm({ ...form, qty_planned: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'تاريخ الجدولة' : 'Planned Date'}</label>
                    <input className="input" type="date" value={form.planned_date} onChange={e => setForm({ ...form, planned_date: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('notes')}</label>
                    <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
                  </div>
                </div>
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
