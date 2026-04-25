'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Expense = {
  id: number
  reference?: string
  employee_name?: string
  category?: string
  amount?: number
  currency?: string
  date?: string
  description?: string
  status: string
  approved_by?: string
  created_at: string
}

const STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'paid']
const CATEGORIES = ['travel', 'meals', 'accommodation', 'office_supplies', 'training', 'other']

export default function ExpensesPage() {
  const { t, lang } = useI18n()
  const ar = lang === 'ar'
  const [items, setItems] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  const [form, setForm] = useState({ employee_name: '', category: 'travel', amount: '', currency: 'EGP', date: new Date().toISOString().split('T')[0], description: '' })

  const fetch = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }), ...(statusF && { status: statusF }) })
    const res = await api.get<{ data: Expense[] }>(`/hr/expenses?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as Expense[] : []))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [search, statusF])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.amount || !form.employee_name) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/hr/expenses', { ...form, amount: Number(form.amount) })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ employee_name: '', category: 'travel', amount: '', currency: 'EGP', date: new Date().toISOString().split('T')[0], description: '' })
    fetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/hr/expenses/${deleteId}`)
    setDeleteId(null); setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const handleApprove = async (id: number) => {
    await api.put(`/hr/expenses/${id}`, { status: 'approved' })
    fetch()
  }

  const statusLabel: Record<string, { ar: string; en: string }> = {
    draft:     { ar: 'مسودة',       en: 'Draft' },
    submitted: { ar: 'مقدّم',        en: 'Submitted' },
    approved:  { ar: 'معتمد',        en: 'Approved' },
    rejected:  { ar: 'مرفوض',       en: 'Rejected' },
    paid:      { ar: 'مدفوع',        en: 'Paid' },
  }
  const statusBadge = (s: string) => ({
    draft: 'badge-muted', submitted: 'badge-info', approved: 'badge-success', rejected: 'badge-danger', paid: 'badge-primary'
  }[s] || 'badge-muted')

  const categoryLabel: Record<string, { ar: string; en: string }> = {
    travel:          { ar: 'سفر',             en: 'Travel' },
    meals:           { ar: 'وجبات',           en: 'Meals' },
    accommodation:   { ar: 'إقامة',           en: 'Accommodation' },
    office_supplies: { ar: 'مستلزمات مكتبية', en: 'Office Supplies' },
    training:        { ar: 'تدريب',           en: 'Training' },
    other:           { ar: 'أخرى',            en: 'Other' },
  }

  const fmt = (n?: number) => n != null ? new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n) : '—'
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'
  const totalAmount = items.filter(i => i.status === 'approved').reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <ERPLayout pageTitle={ar ? 'مصروفات الموظفين' : 'Employee Expenses'}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: ar ? 'إجمالي المصروفات' : 'Total Expenses', value: items.length, icon: '🧾' },
          { label: ar ? 'في الانتظار' : 'Pending', value: items.filter(i => i.status === 'submitted').length, icon: '⏳' },
          { label: ar ? 'معتمدة' : 'Approved', value: items.filter(i => i.status === 'approved').length, icon: '✅' },
          { label: ar ? 'إجمالي المبالغ المعتمدة' : 'Approved Amount', value: fmt(totalAmount), icon: '💰' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '2rem' }}>{c.icon}</span>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>{c.label}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder={ar ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{ar ? statusLabel[s]?.ar : statusLabel[s]?.en}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {ar ? 'مصروف جديد' : 'New Expense'}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🧾</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>#</th>
                <th>{t('employee')}</th>
                <th>{ar ? 'الفئة' : 'Category'}</th>
                <th>{t('amount')}</th>
                <th>{t('date')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="text-muted">{item.reference || `EXP-${item.id}`}</td>
                    <td className="fw-semibold">{item.employee_name || '—'}</td>
                    <td>{item.category ? (ar ? categoryLabel[item.category]?.ar : categoryLabel[item.category]?.en) || item.category : '—'}</td>
                    <td>{fmt(item.amount)} {item.currency || ''}</td>
                    <td className="text-muted">{fmtDate(item.date)}</td>
                    <td><span className={`badge ${statusBadge(item.status)}`}>{ar ? statusLabel[item.status]?.ar : statusLabel[item.status]?.en || item.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {item.status === 'submitted' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleApprove(item.id)}>{t('approve')}</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button>
                    </td>
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
              <h3 className="modal-title">{ar ? 'مصروف جديد' : 'New Expense'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('employee')} *</label>
                    <input className="input" value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الفئة' : 'Category'}</label>
                    <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{ar ? categoryLabel[c]?.ar : categoryLabel[c]?.en}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('date')}</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('amount')} *</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'العملة' : 'Currency'}</label>
                    <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                      {['EGP', 'USD', 'EUR', 'SAR', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('description')}</label>
                    <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
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
