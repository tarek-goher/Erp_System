'use client'

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type JournalEntry = {
  id: number
  reference?: string
  date: string
  description?: string
  currency?: string
  exchange_rate?: number
  total_debit?: number
  total_credit?: number
  status: string
  created_at: string
  lines?: JournalLine[]
}

type JournalLine = {
  id?: number
  account_name?: string
  account_code?: string
  debit?: number
  credit?: number
  description?: string
  currency?: string
}

type Account = { id: number; name: string; code?: string; type?: string }

const CURRENCIES = ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP']
const STATUSES = ['draft', 'posted', 'cancelled']

export default function JournalEntriesPage() {
  const { t, lang } = useI18n()
  const [items, setItems] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [modal, setModal] = useState(false)
  const [viewItem, setViewItem] = useState<JournalEntry | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  const emptyLine = (): JournalLine => ({ account_name: '', debit: 0, credit: 0, description: '', currency: 'EGP' })

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    currency: 'EGP',
    exchange_rate: '1',
    lines: [emptyLine(), emptyLine()],
  })

  const ar = lang === 'ar'

  const fetch = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }), ...(statusF && { status: statusF }) })
    const res = await api.get<{ data: JournalEntry[] }>(`/accounting/journal-entries?${p}`)
    if (res.data) setItems(res.data.data || (Array.isArray(res.data) ? res.data as JournalEntry[] : []))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [search, statusF])
  useEffect(() => {
    api.get<{ data: Account[] }>('/accounting/accounts?per_page=200').then(r => {
      if (r.data) setAccounts(r.data.data || (Array.isArray(r.data) ? r.data as Account[] : []))
    })
  }, [])

  const totalDebit = form.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = form.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const handleAddLine = () => setForm(f => ({ ...f, lines: [...f.lines, emptyLine()] }))
  const handleRemoveLine = (i: number) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))
  const handleLineChange = (i: number, field: keyof JournalLine, val: string) =>
    setForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!isBalanced) { setFormErr(ar ? 'المدين لا يساوي الدائن' : 'Debit must equal Credit'); return }
    if (form.lines.length < 2) { setFormErr(ar ? 'يجب إضافة سطرين على الأقل' : 'At least 2 lines required'); return }
    setSaving(true)
    const res = await api.post('/accounting/journal-entries', {
      date: form.date,
      description: form.description,
      currency: form.currency,
      exchange_rate: Number(form.exchange_rate) || 1,
      lines: form.lines.map(l => ({
        account_name: l.account_name,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description,
        currency: l.currency || form.currency,
      })),
    })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    setForm({ date: new Date().toISOString().split('T')[0], description: '', currency: 'EGP', exchange_rate: '1', lines: [emptyLine(), emptyLine()] })
    fetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/accounting/journal-entries/${deleteId}`)
    setDeleteId(null)
    setItems(prev => prev.filter(i => i.id !== deleteId))
  }

  const fmt = (n?: number) => n != null ? new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 }).format(n) : '—'
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'

  const statusLabel: Record<string, { ar: string; en: string }> = {
    draft:     { ar: 'مسودة',   en: 'Draft' },
    posted:    { ar: 'مرحّل',   en: 'Posted' },
    cancelled: { ar: 'ملغي',    en: 'Cancelled' },
  }
  const statusBadge = (s: string) => ({ draft: 'badge-muted', posted: 'badge-success', cancelled: 'badge-danger' }[s] || 'badge-muted')

  return (
    <ERPLayout pageTitle={ar ? 'قيود اليومية' : 'Journal Entries'}>
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
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {ar ? 'قيد جديد' : 'New Entry'}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📒</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>#</th>
                <th>{ar ? 'التاريخ' : 'Date'}</th>
                <th>{ar ? 'الوصف' : 'Description'}</th>
                <th>{ar ? 'العملة' : 'Currency'}</th>
                <th>{ar ? 'إجمالي مدين' : 'Total Debit'}</th>
                <th>{ar ? 'إجمالي دائن' : 'Total Credit'}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="text-muted">{item.reference || `JE-${item.id}`}</td>
                    <td>{fmtDate(item.date)}</td>
                    <td className="fw-semibold">{item.description || '—'}</td>
                    <td><span className="badge badge-info">{item.currency || 'EGP'}</span></td>
                    <td>{fmt(item.total_debit)}</td>
                    <td>{fmt(item.total_credit)}</td>
                    <td><span className={`badge ${statusBadge(item.status)}`}>{ar ? statusLabel[item.status]?.ar : statusLabel[item.status]?.en || item.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setViewItem(item)}>{t('view')}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(item.id)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Entry Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar ? 'قيد يومية جديد' : 'New Journal Entry'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-3" style={{ marginBottom: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'التاريخ' : 'Date'} *</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'العملة' : 'Currency'}</label>
                    <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'سعر الصرف' : 'Exchange Rate'}</label>
                    <input className="input" type="number" step="0.0001" min="0.0001" value={form.exchange_rate} onChange={e => setForm(f => ({ ...f, exchange_rate: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('description')}</label>
                    <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>

                {/* Journal Lines */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead><tr>
                      <th>{ar ? 'الحساب' : 'Account'}</th>
                      <th>{ar ? 'وصف' : 'Description'}</th>
                      <th>{ar ? 'مدين' : 'Debit'}</th>
                      <th>{ar ? 'دائن' : 'Credit'}</th>
                      <th></th>
                    </tr></thead>
                    <tbody>
                      {form.lines.map((line, i) => (
                        <tr key={i}>
                          <td>
                            <input
                              className="input"
                              style={{ minWidth: 160 }}
                              list={`accounts-${i}`}
                              value={line.account_name}
                              onChange={e => handleLineChange(i, 'account_name', e.target.value)}
                              placeholder={ar ? 'اسم الحساب' : 'Account name'}
                            />
                            <datalist id={`accounts-${i}`}>
                              {accounts.map(a => <option key={a.id} value={a.name}>{a.code ? `(${a.code}) ` : ''}{a.name}</option>)}
                            </datalist>
                          </td>
                          <td>
                            <input className="input" value={line.description} onChange={e => handleLineChange(i, 'description', e.target.value)} placeholder={ar ? 'وصف اختياري' : 'Optional'} />
                          </td>
                          <td>
                            <input className="input" type="number" min="0" step="0.01" value={line.debit || ''} onChange={e => handleLineChange(i, 'debit', e.target.value)} style={{ width: 120 }} />
                          </td>
                          <td>
                            <input className="input" type="number" min="0" step="0.01" value={line.credit || ''} onChange={e => handleLineChange(i, 'credit', e.target.value)} style={{ width: 120 }} />
                          </td>
                          <td>
                            {form.lines.length > 2 && (
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveLine(i)}>✕</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--color-surface-alt)' }}>
                        <td colSpan={2} style={{ fontWeight: 600, padding: '0.5rem 1rem' }}>{ar ? 'الإجمالي' : 'Total'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)', padding: '0.5rem 1rem' }}>{fmt(totalDebit)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)', padding: '0.5rem 1rem' }}>{fmt(totalCredit)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddLine}>+ {ar ? 'إضافة سطر' : 'Add Line'}</button>
                  {!isBalanced && (
                    <span style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                      ⚠️ {ar ? `فرق: ${fmt(Math.abs(totalDebit - totalCredit))}` : `Difference: ${fmt(Math.abs(totalDebit - totalCredit))}`}
                    </span>
                  )}
                  {isBalanced && totalDebit > 0 && (
                    <span style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>✓ {ar ? 'متوازن' : 'Balanced'}</span>
                  )}
                </div>

                {formErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {formErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !isBalanced}>
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar ? 'تفاصيل القيد' : 'Journal Entry Details'} — {viewItem.reference || `JE-${viewItem.id}`}</h3>
              <button className="btn-icon" onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><span className="text-muted">{ar ? 'التاريخ' : 'Date'}:</span> <strong>{fmtDate(viewItem.date)}</strong></div>
                <div><span className="text-muted">{ar ? 'العملة' : 'Currency'}:</span> <strong>{viewItem.currency || 'EGP'}</strong></div>
                <div><span className="text-muted">{t('status')}:</span> <span className={`badge ${statusBadge(viewItem.status)}`}>{ar ? statusLabel[viewItem.status]?.ar : statusLabel[viewItem.status]?.en}</span></div>
              </div>
              {viewItem.description && <p style={{ marginBottom: 16 }}>{viewItem.description}</p>}
              {viewItem.lines && viewItem.lines.length > 0 ? (
                <table className="table">
                  <thead><tr>
                    <th>{ar ? 'الحساب' : 'Account'}</th>
                    <th>{ar ? 'مدين' : 'Debit'}</th>
                    <th>{ar ? 'دائن' : 'Credit'}</th>
                  </tr></thead>
                  <tbody>
                    {viewItem.lines.map((l, i) => (
                      <tr key={i}>
                        <td>{l.account_name || l.account_code || '—'}</td>
                        <td>{fmt(l.debit)}</td>
                        <td>{fmt(l.credit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted">{ar ? 'لا توجد سطور' : 'No lines'}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewItem(null)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
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
