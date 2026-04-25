'use client'

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

type BankStatement = {
  id: number
  account_id: number
  account?: { id: number; name: string; code?: string }
  transaction_date: string
  description: string
  debit: number
  credit: number
  balance: number
  reference?: string
  is_reconciled: boolean
  journal_entry_id?: number
}

type Account = { id: number; name: string; code?: string }

export default function BankReconciliationPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [statements,   setStatements]   = useState<BankStatement[]>([])
  const [accounts,     setAccounts]     = useState<Account[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAcct,   setFilterAcct]   = useState('')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [modal,        setModal]        = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [formErr,      setFormErr]      = useState('')
  const [deleteId,     setDeleteId]     = useState<number | null>(null)
  const [selectedIds,  setSelectedIds]  = useState<number[]>([])
  const [bulkLoading,  setBulkLoading]  = useState(false)

  const [form, setForm] = useState({
    account_id:       '',
    transaction_date: new Date().toISOString().split('T')[0],
    description:      '',
    debit:            '',
    credit:           '',
    balance:          '',
    reference:        '',
  })

  const ea = (d: any): any[] => {
    if (!d) return []
    if (Array.isArray(d)) return d
    if (Array.isArray(d.data)) return d.data
    if (d.data && Array.isArray(d.data.data)) return d.data.data
    return []
  }

  const fetchStatements = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '50' })
    if (dateFrom) p.set('from', dateFrom)
    if (dateTo)   p.set('to', dateTo)
    const res = await api.get(`/bank-statements?${p}`)
    if (res.data) {
      let list: BankStatement[] = ea(res.data)
      if (search)                  list = list.filter(s => s.description?.toLowerCase().includes(search.toLowerCase()) || s.reference?.toLowerCase().includes(search.toLowerCase()))
      if (filterAcct)              list = list.filter(s => String(s.account_id) === filterAcct)
      if (filterStatus === 'reconciled')   list = list.filter(s => s.is_reconciled)
      if (filterStatus === 'unreconciled') list = list.filter(s => !s.is_reconciled)
      setStatements(list)
    }
    setLoading(false)
  }

  useEffect(() => { fetchStatements() }, [search, dateFrom, dateTo, filterStatus, filterAcct])

  useEffect(() => {
    api.get('/accounting/accounts?per_page=200').then(r => setAccounts(ea(r.data)))
  }, [])

  const stats = {
    total:        statements.length,
    reconciled:   statements.filter(s => s.is_reconciled).length,
    unreconciled: statements.filter(s => !s.is_reconciled).length,
    totalDebit:   statements.reduce((s, x) => s + Number(x.debit  || 0), 0),
    totalCredit:  statements.reduce((s, x) => s + Number(x.credit || 0), 0),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.account_id)            { setFormErr(ar('الحساب مطلوب', 'Account is required')); return }
    if (!form.description)           { setFormErr(ar('البيان مطلوب', 'Description is required')); return }
    if (!form.debit && !form.credit) { setFormErr(ar('أدخل مدين أو دائن', 'Enter debit or credit')); return }
    setSaving(true)
    const res = await api.post('/bank-statements', {
      account_id:       Number(form.account_id),
      transaction_date: form.transaction_date,
      description:      form.description,
      debit:            Number(form.debit)   || 0,
      credit:           Number(form.credit)  || 0,
      balance:          Number(form.balance) || 0,
      reference:        form.reference || null,
    })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    resetForm()
    fetchStatements()
  }

  const resetForm = () => setForm({
    account_id: '', transaction_date: new Date().toISOString().split('T')[0],
    description: '', debit: '', credit: '', balance: '', reference: '',
  })

  const handleReconcile = async (id: number, reconcile: boolean) => {
    await api.post('/bank-statements/reconcile', {
      statement_id: id,
      status: reconcile ? 'matched' : 'unmatched',
    })
    fetchStatements()
  }

  const handleBulkReconcile = async () => {
    if (!selectedIds.length) return
    setBulkLoading(true)
    await Promise.all(selectedIds.map(id =>
      api.post('/bank-statements/reconcile', { statement_id: id, status: 'matched' })
    ))
    setSelectedIds([])
    setBulkLoading(false)
    fetchStatements()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/bank-statements/${deleteId}`)
    setDeleteId(null)
    fetchStatements()
  }

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const fmt     = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  return (
    <ERPLayout pageTitle={ar('التسوية البنكية', 'Bank Reconciliation')}>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: ar('إجمالي الحركات', 'Total'),        value: stats.total,        color: '#1d4ed8', isMoney: false },
          { label: ar('مطابقة',          'Reconciled'),   value: stats.reconciled,   color: '#15803d', isMoney: false },
          { label: ar('غير مطابقة',      'Unmatched'),    value: stats.unreconciled, color: '#b45309', isMoney: false },
          { label: ar('إجمالي المدين',   'Total Debit'),  value: stats.totalDebit,   color: '#dc2626', isMoney: true  },
          { label: ar('إجمالي الدائن',   'Total Credit'), value: stats.totalCredit,  color: '#0891b2', isMoney: true  },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: '1rem', borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: c.isMoney ? '1rem' : '1.5rem', fontWeight: 700, color: c.color }}>
              {c.isMoney ? fmt(c.value as number) : c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div className="toolbar-actions" style={{ flexWrap: 'wrap', gap: '0.5rem', flex: 1 }}>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder={ar('بحث بالبيان أو المرجع...', 'Search description or ref...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={filterAcct} onChange={e => setFilterAcct(e.target.value)}>
            <option value="">{ar('كل الحسابات', 'All Accounts')}</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.code ? `${a.code} - ` : ''}{a.name}</option>)}
          </select>
          <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{ar('كل الحالات', 'All Status')}</option>
            <option value="reconciled">{ar('مطابقة', 'Reconciled')}</option>
            <option value="unreconciled">{ar('غير مطابقة', 'Unmatched')}</option>
          </select>
          <input className="input" type="date" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <input className="input" type="date" style={{ width: 'auto' }} value={dateTo}   onChange={e => setDateTo(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {selectedIds.length > 0 && (
            <button className="btn btn-success" onClick={handleBulkReconcile} disabled={bulkLoading}>
              {bulkLoading ? '...' : `✓ ${ar('تسوية المحدد', 'Reconcile')} (${selectedIds.length})`}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { resetForm(); setFormErr(''); setModal(true) }}>
            + {ar('حركة جديدة', 'New Entry')}
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : statements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏦</div>
            <p className="empty-state-text">{ar('لا توجد حركات بنكية', 'No bank transactions found')}</p>
            <button className="btn btn-primary" onClick={() => { resetForm(); setModal(true) }}>
              + {ar('أضف حركة', 'Add Entry')}
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === statements.filter(s => !s.is_reconciled).length}
                      onChange={e => setSelectedIds(e.target.checked ? statements.filter(s => !s.is_reconciled).map(s => s.id) : [])}
                    />
                  </th>
                  <th>{ar('التاريخ',  'Date')}</th>
                  <th>{ar('الحساب',   'Account')}</th>
                  <th>{ar('البيان',   'Description')}</th>
                  <th>{ar('المرجع',   'Reference')}</th>
                  <th style={{ textAlign: 'end' }}>{ar('مدين',   'Debit')}</th>
                  <th style={{ textAlign: 'end' }}>{ar('دائن',   'Credit')}</th>
                  <th style={{ textAlign: 'end' }}>{ar('الرصيد', 'Balance')}</th>
                  <th>{ar('الحالة',   'Status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {statements.map(s => (
                  <tr key={s.id} style={{ opacity: s.is_reconciled ? 0.7 : 1 }}>
                    <td>
                      {!s.is_reconciled && (
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                      )}
                    </td>
                    <td className="text-muted">{fmtDate(s.transaction_date)}</td>
                    <td className="fw-semibold">{s.account?.name || `#${s.account_id}`}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.description || '—'}
                    </td>
                    <td className="text-muted">{s.reference || '—'}</td>
                    <td style={{ textAlign: 'end', color: '#dc2626', fontWeight: 600 }}>
                      {Number(s.debit)  > 0 ? fmt(Number(s.debit))  : '—'}
                    </td>
                    <td style={{ textAlign: 'end', color: '#15803d', fontWeight: 600 }}>
                      {Number(s.credit) > 0 ? fmt(Number(s.credit)) : '—'}
                    </td>
                    <td style={{ textAlign: 'end', fontWeight: 600 }}>{fmt(Number(s.balance))}</td>
                    <td>
                      <span className={`badge ${s.is_reconciled ? 'badge-success' : 'badge-warning'}`}>
                        {s.is_reconciled ? ar('مطابق', 'Matched') : ar('غير مطابق', 'Unmatched')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!s.is_reconciled ? (
                          <button className="btn btn-success btn-sm" onClick={() => handleReconcile(s.id, true)} title={ar('تسوية', 'Reconcile')}>✓</button>
                        ) : (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleReconcile(s.id, false)} title={ar('إلغاء التسوية', 'Undo')}>↩</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(s.id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                  <td colSpan={5} style={{ padding: '0.75rem 1rem' }}>{ar('الإجمالي', 'Total')}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'end', color: '#dc2626' }}>{fmt(stats.totalDebit)}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'end', color: '#15803d' }}>{fmt(stats.totalCredit)}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'end', color: stats.totalCredit - stats.totalDebit >= 0 ? '#15803d' : '#dc2626' }}>
                    {fmt(Math.abs(stats.totalCredit - stats.totalDebit))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setModal(false)}>
          <div style={{ maxWidth: 560, width: '95%', background: 'var(--bg-card,#fff)', color: 'var(--text-color,#000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🏦 {ar('حركة بنكية جديدة', 'New Bank Entry')}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                <div className="form-grid form-grid-2">

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('الحساب البنكي', 'Bank Account')} *</label>
                    <select className="input" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} required>
                      <option value="">{ar('اختر الحساب', 'Select Account')}</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.code ? `${a.code} - ` : ''}{a.name}</option>)}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الحركة', 'Date')} *</label>
                    <input className="input" type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} required />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('المرجع', 'Reference')}</label>
                    <input className="input" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder={ar('رقم الشيك / المرجع', 'Cheque # / Ref')} />
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('البيان', 'Description')} *</label>
                    <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ color: '#dc2626' }}>{ar('مدين (سحب)', 'Debit')}</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.debit}
                      onChange={e => setForm({ ...form, debit: e.target.value, credit: e.target.value ? '' : form.credit })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ color: '#15803d' }}>{ar('دائن (إيداع)', 'Credit')}</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.credit}
                      onChange={e => setForm({ ...form, credit: e.target.value, debit: e.target.value ? '' : form.debit })} />
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('الرصيد بعد الحركة', 'Balance After')}</label>
                    <input className="input" type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
                  </div>

                </div>

                {(form.debit || form.credit) && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{form.debit ? ar('سحب:', 'Debit:') : ar('إيداع:', 'Credit:')}</span>
                    <span style={{ fontWeight: 700, color: form.debit ? '#dc2626' : '#15803d' }}>
                      {fmt(Number(form.debit || form.credit))}
                    </span>
                  </div>
                )}

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

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setDeleteId(null)}>
          <div style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card,#fff)', color: 'var(--text-color,#000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
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