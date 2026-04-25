'use client'

// ══════════════════════════════════════════════════════════
// app/accounting/general-ledger/page.tsx — دفتر الأستاذ
// API endpoints:
//   GET /api/general-ledger                  → كل الحسابات
//   GET /api/general-ledger/{accountId}      → حساب واحد
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

// ── Types ──────────────────────────────────────────────────
type LedgerLine = {
  id: number
  journal_entry_id: number
  journal_entry_ref: string
  date: string
  description: string
  line_description?: string
  debit: number
  credit: number
  running_balance: number
}

type AccountLedger = {
  account: {
    id: number
    code: string
    name: string
    type: string
    normal_balance: string
  }
  lines: LedgerLine[]
  total_debit: number
  total_credit: number
  closing_balance: number
}

type LedgerResponse = {
  ledgers: AccountLedger[]
  total_debit: number
  total_credit: number
  is_balanced: boolean
  accounts_count: number
  lines_count: number
}

type SummaryRow = {
  account_id: number
  account_code: string
  account_name: string
  account_type: string
  total_debit: number
  total_credit: number
  closing_balance: number
  lines_count: number
}

type SummaryResponse = {
  summary: SummaryRow[]
  total_debit: number
  total_credit: number
  is_balanced: boolean
}

// ── Constants ──────────────────────────────────────────────
const ACCOUNT_TYPES = [
  { value: 'asset',     ar: 'أصول',       en: 'Asset' },
  { value: 'liability', ar: 'خصوم',       en: 'Liability' },
  { value: 'equity',    ar: 'حقوق ملكية', en: 'Equity' },
  { value: 'revenue',   ar: 'إيرادات',    en: 'Revenue' },
  { value: 'expense',   ar: 'مصروفات',    en: 'Expense' },
]

const VIEW_MODES = [
  { value: 'summary', ar: 'ملخص',      en: 'Summary' },
  { value: 'full',    ar: 'تفصيلي',    en: 'Detailed' },
]

// ══════════════════════════════════════════════════════════
export default function GeneralLedgerPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [isMounted,     setIsMounted]     = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [viewMode,      setViewMode]      = useState<'summary' | 'full'>('summary')

  // ── Summary Data ───────────────────────────────────────
  const [summaryData,   setSummaryData]   = useState<SummaryResponse | null>(null)

  // ── Full/Detailed Data ─────────────────────────────────
  const [fullData,      setFullData]      = useState<LedgerResponse | null>(null)

  // ── Selected Account (for detail modal) ─────────────────
  const [selectedLedger, setSelectedLedger] = useState<AccountLedger | null>(null)
  const [detailModal,   setDetailModal]   = useState(false)

  // ── Filters ────────────────────────────────────────────
  const [fromDate,      setFromDate]      = useState('')
  const [toDate,        setToDate]        = useState('')
  const [accountType,   setAccountType]   = useState('')

  useEffect(() => { setIsMounted(true) }, [])

  // ── Fetchers ───────────────────────────────────────────
  const fetchLedger = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fromDate) params.append('from_date', fromDate)
      if (toDate) params.append('to_date', toDate)
      if (accountType && viewMode === 'full') params.append('account_type', accountType)
      params.append('format', viewMode)

      const res = await api.get<any>(`/general-ledger?${params.toString()}`)

      if (res.data) {
        if (viewMode === 'summary') {
          setSummaryData(res.data as SummaryResponse)
        } else {
          setFullData(res.data as LedgerResponse)
        }
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedger()
  }, [viewMode])

  // ── Handlers ───────────────────────────────────────────
  const handleFilter = (e: FormEvent) => {
    e.preventDefault()
    fetchLedger()
  }

  const openDetail = (ledger: AccountLedger) => {
    setSelectedLedger(ledger)
    setDetailModal(true)
  }

  // ── Formatters ─────────────────────────────────────────
  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : '—'

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  const typeBadge = (type: string) => ({
    asset: 'badge-info', liability: 'badge-warning',
    equity: 'badge-primary', revenue: 'badge-success', expense: 'badge-danger'
  }[type] || 'badge-muted')

  const typeLabel = (type: string) => {
    const found = ACCOUNT_TYPES.find(t => t.value === type)
    return found ? (lang === 'ar' ? found.ar : found.en) : type
  }

  const balanceBadge = (balance: number) => balance < 0 ? 'text-danger' : ''

  // ══════════════════════════════════════════════════════
  return (
    <ERPLayout pageTitle={ar('دفتر الأستاذ', 'General Ledger')}>

      {/* ── View Mode Selector ────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {VIEW_MODES.map(mode => (
          <button
            key={mode.value}
            className={`btn btn-sm ${viewMode === mode.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode(mode.value as any)}
          >
            {lang === 'ar' ? mode.ar : mode.en}
          </button>
        ))}
      </div>

      {/* ── Filter Form ───────────────────────────────── */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <form onSubmit={handleFilter}>
          <div className="form-grid form-grid-4" style={{ gap: '1rem', alignItems: 'flex-end' }}>
            <div className="input-group">
              <label className="input-label">{ar('من التاريخ', 'From Date')}</label>
              <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">{ar('إلى التاريخ', 'To Date')}</label>
              <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>

            {viewMode === 'full' && (
              <div className="input-group">
                <label className="input-label">{ar('نوع الحساب', 'Account Type')}</label>
                <select className="input" value={accountType} onChange={e => setAccountType(e.target.value)}>
                  <option value="">{ar('الكل', 'All')}</option>
                  {ACCOUNT_TYPES.map(at => (
                    <option key={at.value} value={at.value}>{ar(at.ar, at.en)}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary">
              🔍 {ar('بحث', 'Filter')}
            </button>
          </div>
        </form>
      </div>

      {/* ════════════════════════════════════════════════
          SUMMARY VIEW — ملخص بسيط
      ════════════════════════════════════════════════ */}
      {viewMode === 'summary' && (
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : !summaryData || summaryData.summary.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📘</div>
              <p className="empty-state-text">{t('no_data')}</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{ar('كود الحساب', 'Code')}</th>
                      <th>{ar('اسم الحساب', 'Account Name')}</th>
                      <th>{ar('النوع', 'Type')}</th>
                      <th style={{ textAlign: 'end' }}>{ar('مدين', 'Debit')}</th>
                      <th style={{ textAlign: 'end' }}>{ar('دائن', 'Credit')}</th>
                      <th style={{ textAlign: 'end' }}>{ar('الرصيد', 'Balance')}</th>
                      <th style={{ textAlign: 'end' }}>{ar('العدد', 'Count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                {summaryData.summary.map(row => (
  <tr 
    key={row.account_id} 
    style={{ cursor: 'pointer' }} 
    onClick={() => {
      setSelectedLedger({
        account: {
          id: row.account_id,
          code: row.account_code,
          name: row.account_name,
          type: row.account_type,
          normal_balance: row.account_type === 'asset' || row.account_type === 'expense' ? 'debit' : 'credit',
        },
        lines: [],
        total_debit: row.total_debit,
        total_credit: row.total_credit,
        closing_balance: row.closing_balance,
      })
      setDetailModal(true)
    }}
  >
    <td className="fw-semibold text-muted">{row.account_code}</td>
    <td className="fw-semibold">{row.account_name}</td>
    <td><span className={`badge ${typeBadge(row.account_type)}`}>{typeLabel(row.account_type)}</span></td>
    <td style={{ textAlign: 'end' }}>{fmt(row.total_debit)}</td>
    <td style={{ textAlign: 'end' }}>{fmt(row.total_credit)}</td>
    <td style={{ textAlign: 'end', fontWeight: 600 }} className={balanceBadge(row.closing_balance)}>{fmt(row.closing_balance)}</td>
    <td style={{ textAlign: 'end', color: 'var(--text-muted)' }}>{row.lines_count}</td>
  </tr>
))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700, background: 'var(--bg-secondary)' }}>
                      <td colSpan={3}>{ar('الإجمالي', 'Total')}</td>
                      <td style={{ textAlign: 'end' }}>{fmt(summaryData.total_debit)}</td>
                      <td style={{ textAlign: 'end' }}>{fmt(summaryData.total_credit)}</td>
                      <td colSpan={2} style={{ textAlign: 'center' }}>
                        <span className={`badge ${summaryData.is_balanced ? 'badge-success' : 'badge-danger'}`}>
                          {summaryData.is_balanced ? '✅ ' : '❌ '}{ar('متوازن', 'Balanced')}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          FULL VIEW — تفصيلي مع الـ Lines
      ════════════════════════════════════════════════ */}
      {viewMode === 'full' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading ? (
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : !fullData || fullData.ledgers.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📘</div>
                <p className="empty-state-text">{t('no_data')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '1rem' }}>
                {[
                  { label: ar('الحسابات', 'Accounts'),   value: fullData.accounts_count, icon: '🏦' },
                  { label: ar('القيود',  'Lines'),      value: fullData.lines_count,     icon: '📝' },
                  { label: ar('الإجمالي مدين', 'Total Debit'),  value: fmt(fullData.total_debit),  icon: '➕' },
                  { label: ar('الإجمالي دائن', 'Total Credit'), value: fmt(fullData.total_credit), icon: '➖' },
                ].map(card => (
                  <div key={card.label} className="stat-card">
                    <div className="stat-icon">{card.icon}</div>
                    <div>
                      <p className="stat-value">{card.value}</p>
                      <p className="stat-label">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Account Ledgers */}
              {fullData.ledgers.map(ledger => (
                <div key={ledger.account.id} className="card" style={{ padding: 0 }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600 }}>
                          {ledger.account.code} — {ledger.account.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span className={`badge ${typeBadge(ledger.account.type)}`}>{typeLabel(ledger.account.type)}</span>
                        </p>
                      </div>
                      <div style={{ textAlign: 'end' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ar('الرصيد', 'Balance')}</p>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }} className={balanceBadge(ledger.closing_balance)}>
                          {fmt(ledger.closing_balance)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{ar('التاريخ', 'Date')}</th>
                          <th>{ar('المرجع', 'Reference')}</th>
                          <th>{ar('البيان', 'Description')}</th>
                          <th style={{ textAlign: 'end' }}>{ar('مدين', 'Debit')}</th>
                          <th style={{ textAlign: 'end' }}>{ar('دائن', 'Credit')}</th>
                          <th style={{ textAlign: 'end' }}>{ar('الرصيد', 'Balance')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.lines.map((line, idx) => (
                          <tr key={line.id}>
                            <td className="text-muted">{fmtDate(line.date)}</td>
                            <td className="fw-semibold">{line.journal_entry_ref}</td>
                            <td className="text-muted">{line.description}</td>
                            <td style={{ textAlign: 'end' }}>{line.debit > 0 ? fmt(line.debit) : '—'}</td>
                            <td style={{ textAlign: 'end' }}>{line.credit > 0 ? fmt(line.credit) : '—'}</td>
                            <td style={{ textAlign: 'end', fontWeight: 600 }} className={balanceBadge(line.running_balance)}>
                              {fmt(line.running_balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ fontWeight: 600, background: 'var(--bg-secondary)' }}>
                          <td colSpan={3}>{ar('الإجمالي', 'Total')}</td>
                          <td style={{ textAlign: 'end' }}>{fmt(ledger.total_debit)}</td>
                          <td style={{ textAlign: 'end' }}>{fmt(ledger.total_credit)}</td>
                          <td style={{ textAlign: 'end' }}>{fmt(ledger.closing_balance)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}

              {/* Global Footer */}
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span className={`badge ${fullData.is_balanced ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  {fullData.is_balanced ? '✅ ' : '❌ '}{ar('دفتر الأستاذ متوازن', 'General Ledger is Balanced')}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: Account Detail (من Summary)
      ════════════════════════════════════════════════ */}
      {detailModal && isMounted && selectedLedger && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setDetailModal(false)}>
          <div style={{ maxWidth: 900, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedLedger.account.code} — {selectedLedger.account.name}</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span className={`badge ${typeBadge(selectedLedger.account.type)}`}>{typeLabel(selectedLedger.account.type)}</span>
                </p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setDetailModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: 0 }}>
              {selectedLedger.lines.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{ar('التاريخ', 'Date')}</th>
                        <th>{ar('المرجع', 'Reference')}</th>
                        <th>{ar('البيان', 'Description')}</th>
                        <th style={{ textAlign: 'end' }}>{ar('مدين', 'Debit')}</th>
                        <th style={{ textAlign: 'end' }}>{ar('دائن', 'Credit')}</th>
                        <th style={{ textAlign: 'end' }}>{ar('الرصيد', 'Balance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLedger.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="text-muted">{fmtDate(line.date)}</td>
                          <td className="fw-semibold">{line.journal_entry_ref}</td>
                          <td className="text-muted text-sm">{line.description}</td>
                          <td style={{ textAlign: 'end' }}>{line.debit > 0 ? fmt(line.debit) : '—'}</td>
                          <td style={{ textAlign: 'end' }}>{line.credit > 0 ? fmt(line.credit) : '—'}</td>
                          <td style={{ textAlign: 'end', fontWeight: 600 }} className={balanceBadge(line.running_balance)}>
                            {fmt(line.running_balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 600, background: 'var(--bg-secondary)' }}>
                        <td colSpan={3}>{ar('الإجمالي', 'Total')}</td>
                        <td style={{ textAlign: 'end' }}>{fmt(selectedLedger.total_debit)}</td>
                        <td style={{ textAlign: 'end' }}>{fmt(selectedLedger.total_credit)}</td>
                        <td style={{ textAlign: 'end' }}>{fmt(selectedLedger.closing_balance)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {ar('لا توجد قيود لهذا الحساب', 'No journal entries for this account')}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDetailModal(false)}>{t('close')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </ERPLayout>
  )
}