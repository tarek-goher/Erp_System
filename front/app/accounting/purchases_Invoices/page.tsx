'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api, extractArray } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type PurchaseInvoice = {
  id: number
  invoice_number: string
  supplier?: { id: number; name: string }
  supplier_id?: number
  date: string
  due_date?: string
  subtotal: number
  tax?: number
  discount?: number
  total: number
  status: string
  notes?: string
  reference?: string
}

type Supplier = { id: number; name: string }

const STATUSES = ['draft', 'pending', 'approved', 'paid', 'overdue', 'cancelled']

export default function PurchaseInvoicesPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [invoices,     setInvoices]     = useState<PurchaseInvoice[]>([])
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal,        setModal]        = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [formErr,      setFormErr]      = useState('')
  const [deleteId,     setDeleteId]     = useState<number | null>(null)
  const [viewInv,      setViewInv]      = useState<PurchaseInvoice | null>(null)
  const [editInv,      setEditInv]      = useState<PurchaseInvoice | null>(null)
  const [editForm,     setEditForm]     = useState({ status: '', due_date: '', notes: '' })
  const [editSaving,   setEditSaving]   = useState(false)
  const [stats,        setStats]        = useState({ total: 0, paid: 0, pending: 0, overdue: 0 })

  const [form, setForm] = useState({
    supplier_id: '', date: new Date().toISOString().split('T')[0],
    due_date: '', subtotal: '', tax: '', discount: '', status: 'pending',
    notes: '', reference: ''
  })

  const fetchInvoices = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '50' })
    if (search) p.set('search', search)
    if (statusFilter) p.set('status', statusFilter)
    const res = await api.get(`/purchase-invoices?${p}`)
    if (res.data) {
      const list = extractArray(res.data).map((inv: any) => ({
        ...inv,
        date:     inv.invoice_date ?? inv.date,
        subtotal: inv.amount       ?? inv.subtotal ?? 0,
        tax:      inv.tax_amount   ?? inv.tax      ?? 0,
        total:    inv.total        ?? inv.total_amount ?? 0,
      }))
      setInvoices(list)
      setStats({
        total:   list.length,
        paid:    list.filter((i: any) => i.status === 'paid').length,
        pending: list.filter((i: any) => ['pending','draft'].includes(i.status)).length,
        overdue: list.filter((i: any) => i.status === 'overdue').length,
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchInvoices() }, [search, statusFilter])
  useEffect(() => {
    api.get('/suppliers?per_page=200').then(r => setSuppliers(extractArray(r.data)))
  }, [])

  const subtotal   = Number(form.subtotal) || 0
  const tax        = Number(form.tax) || 0
  const discount   = Number(form.discount) || 0
  const grandTotal = subtotal + tax - discount

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.supplier_id) { setFormErr(ar('يجب اختيار المورد', 'Supplier is required')); return }
    if (!form.subtotal || subtotal <= 0) { setFormErr(ar('المبلغ مطلوب', 'Amount is required')); return }
    setSaving(true)
    const invoiceNumber = 'PI-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Date.now()).slice(-4)
    const res = await api.post('/purchase-invoices', {
      supplier_id:    Number(form.supplier_id),
      invoice_number: invoiceNumber,
      invoice_date:   form.date,
      due_date:       form.due_date || null,
      amount:         subtotal,
      tax:            tax || null,
      total:          grandTotal,
      status:         form.status,
      notes:          form.notes || null,
      reference:      form.reference || null,
    })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    resetForm()
    fetchInvoices()
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editInv) return
    setEditSaving(true)
    const res = await api.put(`/purchase-invoices/${editInv.id}`, {
      status:   editForm.status,
      due_date: editForm.due_date || null,
      notes:    editForm.notes || null,
    })
    setEditSaving(false)
    if (!res.error) {
      setEditInv(null)
      fetchInvoices()
    }
  }

  const openEdit = (inv: PurchaseInvoice) => {
    setEditInv(inv)
    setEditForm({
      status:   inv.status,
      due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
      notes:    inv.notes || '',
    })
  }

  const resetForm = () => setForm({
    supplier_id: '', date: new Date().toISOString().split('T')[0],
    due_date: '', subtotal: '', tax: '', discount: '', status: 'pending',
    notes: '', reference: ''
  })

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/purchase-invoices/${deleteId}`)
    setDeleteId(null)
    fetchInvoices()
  }

  const canEdit = (inv: PurchaseInvoice) => !['paid', 'cancelled'].includes(inv.status)

  const statusBadge = (s: string) => ({
    draft:     'badge-muted',
    pending:   'badge-warning',
    approved:  'badge-info',
    paid:      'badge-success',
    overdue:   'badge-danger',
    cancelled: 'badge-muted',
  }[s] || 'badge-muted')

  const statusLabel = (s: string) => ({
    draft:     ar('مسودة','Draft'),
    pending:   ar('معلقة','Pending'),
    approved:  ar('معتمدة','Approved'),
    paid:      ar('مدفوعة','Paid'),
    overdue:   ar('متأخرة','Overdue'),
    cancelled: ar('ملغية','Cancelled'),
  }[s] || s)

  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  return (
    <ERPLayout pageTitle={ar('فواتير المشتريات', 'Purchase Invoices')}>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: ar('إجمالي الفواتير','Total Invoices'), value: stats.total,   color: '#1d4ed8' },
          { label: ar('مدفوعة','Paid'),                    value: stats.paid,    color: '#15803d' },
          { label: ar('معلقة','Pending'),                  value: stats.pending, color: '#b45309' },
          { label: ar('متأخرة','Overdue'),                 value: stats.overdue, color: '#dc2626' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: '1rem', borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="toolbar-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder={ar('بحث برقم الفاتورة أو المورد...', 'Search by invoice # or supplier...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{ar('كل الحالات', 'All Status')}</option>
            {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setFormErr(''); setModal(true) }}>
          + {ar('فاتورة جديدة', 'New Invoice')}
        </button>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <p className="empty-state-text">{ar('لا توجد فواتير مشتريات', 'No purchase invoices')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar('رقم الفاتورة', 'Invoice #')}</th>
                  <th>{ar('المورد', 'Supplier')}</th>
                  <th>{ar('التاريخ', 'Date')}</th>
                  <th>{ar('تاريخ الاستحقاق', 'Due Date')}</th>
                  <th>{ar('الإجمالي', 'Total')}</th>
                  <th>{ar('الحالة', 'Status')}</th>
                  <th>{ar('المرجع', 'Reference')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="fw-semibold">{inv.invoice_number || `#${inv.id}`}</td>
                    <td>{inv.supplier?.name || '—'}</td>
                    <td className="text-muted">{fmtDate(inv.date)}</td>
                    <td className="text-muted">{inv.due_date ? fmtDate(inv.due_date) : '—'}</td>
                    <td className="fw-semibold">{fmt(inv.total)}</td>
                    <td><span className={`badge ${statusBadge(inv.status)}`}>{statusLabel(inv.status)}</span></td>
                    <td className="text-muted">{inv.reference || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {/* زرار العرض */}
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewInv(inv)}>
                          {ar('عرض', 'View')}
                        </button>
                        {/* زرار التعديل — بس لو مش paid أو cancelled */}
                        {canEdit(inv) && (
                          <button className="btn btn-primary btn-sm" onClick={() => openEdit(inv)}>
                            {ar('تعديل', 'Edit')}
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(inv.id)}>
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: New Invoice ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setModal(false)}>
          <div style={{ maxWidth: 600, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🧾 {ar('فاتورة شراء جديدة', 'New Purchase Invoice')}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                <div className="form-grid form-grid-2">
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('المورد', 'Supplier')} *</label>
                    <select className="input" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} required>
                      <option value="">{ar('اختر المورد', 'Select Supplier')}</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الفاتورة', 'Invoice Date')} *</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الاستحقاق', 'Due Date')}</label>
                    <input className="input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('المبلغ الفرعي', 'Subtotal')} *</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('الضريبة', 'Tax')}</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('الخصم', 'Discount')}</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('الحالة', 'Status')}</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('المرجع', 'Reference')}</label>
                    <input className="input" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('notes')}</label>
                    <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  {subtotal > 0 && <div style={{ fontSize: '0.85rem' }}>{ar('المبلغ الفرعي:', 'Subtotal:')} <strong>{fmt(subtotal)}</strong></div>}
                  {tax > 0 && <div style={{ fontSize: '0.85rem' }}>{ar('الضريبة:', 'Tax:')} <strong>{fmt(tax)}</strong></div>}
                  {discount > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>{ar('الخصم:', 'Discount:')} <strong>- {fmt(discount)}</strong></div>}
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{ar('الإجمالي:', 'Total:')} {fmt(grandTotal)}</div>
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

      {/* ── Modal: View Invoice ── */}
      {viewInv && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setViewInv(null)}>
          <div style={{ maxWidth: 500, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🧾 {ar('تفاصيل الفاتورة', 'Invoice Details')}</h3>
              <button className="btn-icon" onClick={() => setViewInv(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: ar('رقم الفاتورة', 'Invoice #'),         value: viewInv.invoice_number || `#${viewInv.id}` },
                  { label: ar('المورد', 'Supplier'),                 value: viewInv.supplier?.name || '—' },
                  { label: ar('التاريخ', 'Date'),                    value: fmtDate(viewInv.date) },
                  { label: ar('تاريخ الاستحقاق', 'Due Date'),       value: viewInv.due_date ? fmtDate(viewInv.due_date) : '—' },
                  { label: ar('المبلغ الفرعي', 'Subtotal'),         value: fmt(viewInv.subtotal) },
                  { label: ar('الضريبة', 'Tax'),                    value: fmt(viewInv.tax || 0) },
                  { label: ar('الخصم', 'Discount'),                 value: fmt(viewInv.discount || 0) },
                  { label: ar('الإجمالي', 'Total'),                 value: fmt(viewInv.total) },
                  { label: ar('الحالة', 'Status'),                  value: statusLabel(viewInv.status) },
                  { label: ar('المرجع', 'Reference'),               value: viewInv.reference || '—' },
                ].map((row, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontWeight: 600 }}>{row.value}</div>
                  </div>
                ))}
                {viewInv.notes && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{t('notes')}</div>
                    <div style={{ fontWeight: 600 }}>{viewInv.notes}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewInv(null)}>{t('cancel')}</button>
              {canEdit(viewInv) && (
                <button className="btn btn-primary" onClick={() => { setViewInv(null); openEdit(viewInv) }}>
                  {ar('تعديل', 'Edit')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Invoice ── */}
      {editInv && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setEditInv(null)}>
          <div style={{ maxWidth: 450, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ {ar('تعديل الفاتورة', 'Edit Invoice')} — {editInv.invoice_number || `#${editInv.id}`}</h3>
              <button className="btn-icon" onClick={() => setEditInv(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('الحالة', 'Status')}</label>
                    <select className="input" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('تاريخ الاستحقاق', 'Due Date')}</label>
                    <input className="input" type="date" value={editForm.due_date} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('notes')}</label>
                    <textarea className="input" rows={3} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditInv(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>{editSaving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setDeleteId(null)}>
          <div style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3 style={{ margin: 0 }}>{t('confirm_delete')}</h3>
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