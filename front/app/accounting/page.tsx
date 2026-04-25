'use client'

// ══════════════════════════════════════════════════════════
// app/accounting/page.tsx — صفحة المحاسبة (محدّثة)
// API endpoints المستخدمة:
//   GET    /api/accounts                  → دليل الحسابات
//   POST   /api/accounts                  → إضافة حساب
//   GET    /api/accounts/trial-balance    → ميزان المراجعة
//   GET    /api/journal-entries           → قائمة القيود
//   POST   /api/journal-entries           → إنشاء قيد
//   GET    /api/journal-entries/{id}      → تفاصيل قيد + lines
//   PUT    /api/journal-entries/{id}      → تحديث (Post)
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

// ── Types ──────────────────────────────────────────────────
type Account = {
  id: number
  name: string
  name_en?: string
  code: string
  type: string
  normal_balance?: string
  balance: number
  is_active?: boolean
}

type JournalLine = {
  account_id: number
  account?: Account
  debit: number
  credit: number
  description?: string
}

type JournalEntry = {
  id: number
  ref: string
  description: string
  total_debit: number
  total_credit: number
  date: string
  status: string
  type?: string
  lines?: JournalLine[]
}

// ✅ TrialBalance type يعكس شكل الـ response الحقيقي من الباك
type TrialBalanceRow = {
  account_id?: number
  code?: string
  name?: string
  type?: string
  debit?: number
  credit?: number
  balance?: number
}

type TrialBalanceResponse = {
  accounts: TrialBalanceRow[]
  total_debit: number
  total_credit: number
  is_balanced: boolean
}

type BankStatement = {
  id: number
  bank_name: string
  account_number?: string
  date: string
  amount: number
  type: string
  description?: string
  reference?: string
  status?: string
}

// ── Constants ──────────────────────────────────────────────
const TABS = ['accounts', 'journal', 'trial-balance', 'bank-statements']

const ACCOUNT_TYPES = [
  { value: 'asset',     ar: 'أصول',       en: 'Asset' },
  { value: 'liability', ar: 'خصوم',       en: 'Liability' },
  { value: 'equity',    ar: 'حقوق ملكية', en: 'Equity' },
  { value: 'revenue',   ar: 'إيرادات',    en: 'Revenue' },
  { value: 'expense',   ar: 'مصروفات',    en: 'Expense' },
]

const EMPTY_LINE: JournalLine = { account_id: 0, debit: 0, credit: 0, description: '' }

// ══════════════════════════════════════════════════════════
export default function AccountingPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [isMounted,    setIsMounted]    = useState(false)
  const [activeTab,    setActiveTab]    = useState('accounts')
  const [accounts,     setAccounts]     = useState<Account[]>([])
  const [journals,     setJournals]     = useState<JournalEntry[]>([])

  // ✅ trialBalance محدد بالـ Type الصح بدل any
  const [trialBalance, setTrialBalance] = useState<TrialBalanceResponse | null>(null)
  const [loading,      setLoading]      = useState(true)

  // ── Account modal ──────────────────────────────────────
  const [accModal,  setAccModal]  = useState(false)
  const [accSaving, setAccSaving] = useState(false)
  const [accErr,    setAccErr]    = useState('')
  const [accForm,   setAccForm]   = useState({ name: '', code: '', type: 'asset' })

  // ── Journal Entry create modal ─────────────────────────
  const [jeModal,  setJeModal]  = useState(false)
  const [jeSaving, setJeSaving] = useState(false)
  const [jeErr,    setJeErr]    = useState('')
  const [jeForm,   setJeForm]   = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }] as JournalLine[],
  })

  // ── Journal Entry details modal ────────────────────────
  const [detailModal,   setDetailModal]   = useState(false)
  const [detailEntry,   setDetailEntry]   = useState<JournalEntry | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [posting,       setPosting]       = useState(false)
  const [postErr,       setPostErr]       = useState('')  // ✅ error state للـ post

  // ── Pagination ─────────────────────────────────────────
  const [jePage,    setJePage]    = useState(1)
  const [jeTotal,   setJeTotal]   = useState(0)
  const [jeLastPage, setJeLastPage] = useState(1)  // ✅ last_page من Laravel

  // ── Bank Statements ────────────────────────────────────
  const [bankStmts, setBankStmts] = useState<BankStatement[]>([])
  const [bankLoad,  setBankLoad]  = useState(true)
  const [bankModal, setBankModal] = useState(false)
  const [bankSave,  setBankSave]  = useState(false)
  const [bankErr,   setBankErr]   = useState('')
  const [bankForm,  setBankForm]  = useState({
    bank_name: '',
    account_number: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'credit',
    description: '',
    reference: ''
  })

  useEffect(() => { setIsMounted(true) }, [])

  // ── Fetchers ───────────────────────────────────────────
  const fetchAccounts = async () => {
    setLoading(true)
    const res = await api.get<any>('/accounts?per_page=100')
    if (res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setAccounts(list)
    }
    setLoading(false)
  }

  const fetchJournals = async () => {
    setLoading(true)
    const res = await api.get<any>(`/journal-entries?per_page=20&page=${jePage}`)
    if (res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setJournals(list)
      setJeTotal(res.data.total || 0)
      // ✅ نستخدم last_page من Laravel pagination بدل حساب manual
      setJeLastPage(res.data.last_page || 1)
    }
    setLoading(false)
  }

  const fetchTrialBalance = async () => {
    setLoading(true)
    const res = await api.get<any>('/accounts/trial-balance')
    // ✅ الباك بيرجع { data: { accounts, total_debit, total_credit, is_balanced } }
    // لو الـ api wrapper بيرجع res.data = الـ data field في الـ response
    if (res.data) {
      // handle لو الـ wrapper بيرجع { accounts, total_debit, ... } مباشرة
      // أو بيرجعهم جوه data
      const payload = res.data.accounts ? res.data : res.data.data
      if (payload?.accounts) {
        setTrialBalance(payload as TrialBalanceResponse)
      }
    }
    setLoading(false)
  }

  const fetchBankStatements = async () => {
    setBankLoad(true)
    const res = await api.get<any>('/bank-statements?per_page=50')
    if (res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setBankStmts(list)
    }
    setBankLoad(false)
  }

  useEffect(() => {
    if (activeTab === 'accounts')      fetchAccounts()
    if (activeTab === 'journal')       fetchJournals()
    if (activeTab === 'trial-balance') fetchTrialBalance()
    if (activeTab === 'bank-statements') fetchBankStatements()
  }, [activeTab, jePage])

  // ── Account submit ─────────────────────────────────────
  const handleAccSubmit = async (e: FormEvent) => {
    e.preventDefault(); setAccErr('')
    if (!accForm.name || !accForm.code) { setAccErr(t('required_field')); return }
    setAccSaving(true)
    const res = await api.post('/accounts', accForm)
    setAccSaving(false)
    if (res.error) { setAccErr(res.error); return }
    setAccModal(false)
    fetchAccounts()
  }

  // ── Journal Entry helpers ──────────────────────────────
  const totalDebit  = jeForm.lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0)
  const totalCredit = jeForm.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  const addLine    = () => setJeForm(f => ({ ...f, lines: [...f.lines, { ...EMPTY_LINE }] }))
  const removeLine = (i: number) => setJeForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))
  const updateLine = (i: number, field: keyof JournalLine, val: any) =>
    setJeForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }))

  // ── Journal Entry submit ───────────────────────────────
  const handleJeSubmit = async (e: FormEvent) => {
    e.preventDefault(); setJeErr('')
    if (!jeForm.description.trim()) { setJeErr(ar('الوصف مطلوب', 'Description required')); return }
    if (!isBalanced)                { setJeErr(ar('المدين ≠ الدائن — القيد غير متوازن', 'Debit ≠ Credit — entry not balanced')); return }
    if (jeForm.lines.some(l => !l.account_id)) { setJeErr(ar('اختر حساباً لكل سطر', 'Select account for each line')); return }

    setJeSaving(true)
    const payload = {
      date:        jeForm.date,
      description: jeForm.description,
      lines:       jeForm.lines.map(l => ({
        account_id:  Number(l.account_id),
        debit:       Number(l.debit)  || 0,
        credit:      Number(l.credit) || 0,
        description: l.description || '',
      })),
    }
    const res = await api.post('/journal-entries', payload)
    setJeSaving(false)
    if (res.error) { setJeErr(res.error); return }
    setJeModal(false)
    setJeForm({ date: new Date().toISOString().split('T')[0], description: '', lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }] })
    fetchJournals()
  }

  // ── Journal Entry details ──────────────────────────────
  const openDetail = async (je: JournalEntry) => {
    setDetailModal(true)
    setDetailLoading(true)
    setDetailEntry(null)
    setPostErr('')  // ✅ reset post error
    const res = await api.get<JournalEntry>(`/journal-entries/${je.id}`)
    if (res.data) setDetailEntry(res.data)
    setDetailLoading(false)
  }

  // ── Post journal entry ─────────────────────────────────
  const handlePost = async () => {
    if (!detailEntry) return
    setPosting(true)
    setPostErr('')  // ✅ reset error قبل الـ request
    const res = await api.put(`/journal-entries/${detailEntry.id}`, { status: 'posted' })
    setPosting(false)
    if (res.error) {
      // ✅ عرض الـ error لو الـ post فشل
      setPostErr(res.error)
      return
    }
    setDetailEntry(prev => prev ? { ...prev, status: 'posted' } : prev)
    fetchJournals()
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

  const tabLabels: Record<string, { ar: string; en: string }> = {
    'accounts':      { ar: 'الحسابات',       en: 'Chart of Accounts' },
    'journal':       { ar: 'قيود اليومية',   en: 'Journal Entries' },
    'trial-balance': { ar: 'ميزان المراجعة', en: 'Trial Balance' },
    'bank-statements': { ar: 'كشوف البنك',  en: 'Bank Statements' },
    'purchases_Invoices': { ar: 'فواتير المشتريات',  en: 'Purchase Invoices' },
  }

  const handleBankSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBankErr('')
    if (!bankForm.bank_name || !bankForm.date || !bankForm.amount) {
      setBankErr(ar('الحقول المطلوبة ناقصة', 'Required fields missing'))
      return
    }
    setBankSave(true)
    const res = await api.post('/bank-statements', {
      bank_name: bankForm.bank_name,
      account_number: bankForm.account_number || null,
      date: bankForm.date,
      amount: Number(bankForm.amount),
      type: bankForm.type,
      description: bankForm.description || null,
      reference: bankForm.reference || null
    })
    setBankSave(false)
    if (res.error) {
      setBankErr(res.error)
      return
    }
    setBankModal(false)
    setBankForm({
      bank_name: '',
      account_number: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      type: 'credit',
      description: '',
      reference: ''
    })
    await fetchBankStatements()
  }

  // ✅ استخدام القيم الجاهزة من الباك مباشرة
  const trialRows        = trialBalance?.accounts     || []
  const trialTotalDebit  = trialBalance?.total_debit  ?? 0
  const trialTotalCredit = trialBalance?.total_credit ?? 0
  const trialIsBalanced  = trialBalance?.is_balanced  ?? false

  // ══════════════════════════════════════════════════════
  return (
    <ERPLayout pageTitle={t('accounting')}>

      {/* ── Tabs ──────────────────────────────────────── */}
      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {lang === 'ar' ? tabLabels[tab].ar : tabLabels[tab].en}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════
          TAB 1: Chart of Accounts
      ════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <>
          <div className="toolbar">
            <span className="fw-semibold text-secondary">
              {ar(`${accounts.length} حساب`, `${accounts.length} accounts`)}
            </span>
            <button type="button" className="btn btn-primary" onClick={() => { setAccForm({ name: '', code: '', type: 'asset' }); setAccErr(''); setAccModal(true) }}>
              + {ar('حساب جديد', 'New Account')}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : accounts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🧾</div>
                <p className="empty-state-text">{t('no_data')}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('code')}</th>
                      <th>{t('name')}</th>
                      <th>{t('type')}</th>
                      <th>{ar('الرصيد الطبيعي', 'Normal Balance')}</th>
                      <th>{ar('الرصيد', 'Balance')}</th>
                      <th>{ar('الحالة', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => (
                      <tr key={acc.id}>
                        <td className="fw-semibold text-muted">{acc.code}</td>
                        <td className="fw-semibold">{acc.name}</td>
                        <td><span className={`badge ${typeBadge(acc.type)}`}>{typeLabel(acc.type)}</span></td>
                        <td className="text-muted">{acc.normal_balance || '—'}</td>
                        <td className={`fw-semibold ${acc.balance < 0 ? 'text-danger' : ''}`}>{fmt(acc.balance)}</td>
                        <td>
                          <span className={`badge ${acc.is_active !== false ? 'badge-success' : 'badge-muted'}`}>
                            {acc.is_active !== false ? ar('نشط', 'Active') : ar('موقوف', 'Inactive')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════
          TAB 2: Journal Entries
      ════════════════════════════════════════════════ */}
      {activeTab === 'journal' && (
        <>
          <div className="toolbar">
            <span className="fw-semibold text-secondary">
              {ar(`${jeTotal} قيد`, `${jeTotal} entries`)}
            </span>
            <button type="button" className="btn btn-primary" onClick={() => {
              setJeForm({ date: new Date().toISOString().split('T')[0], description: '', lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }] })
              setJeErr('')
              setJeModal(true)
            }}>
              + {ar('قيد جديد', 'New Entry')}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : journals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📒</div>
                <p className="empty-state-text">{t('no_data')}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{ar('المرجع', 'Reference')}</th>
                      <th>{t('description')}</th>
                      <th>{ar('إجمالي مدين', 'Total Debit')}</th>
                      <th>{ar('إجمالي دائن', 'Total Credit')}</th>
                      <th>{t('date')}</th>
                      <th>{t('status')}</th>
                      <th>{ar('الإجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.map(j => (
                      <tr key={j.id}>
                        <td className="fw-semibold">{j.ref || `#${j.id}`}</td>
                        <td className="text-muted">{j.description}</td>
                        <td>{fmt(j.total_debit)}</td>
                        <td>{fmt(j.total_credit)}</td>
                        <td className="text-muted">{fmtDate(j.date)}</td>
                        <td>
                          <span className={`badge ${j.status === 'posted' ? 'badge-success' : 'badge-warning'}`}>
                            {j.status === 'posted' ? ar('مرحّل', 'Posted') : ar('مسودة', 'Draft')}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => openDetail(j)}>
                            🔍 {ar('تفاصيل', 'Details')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ✅ Pagination صح — بنستخدم jeLastPage من Laravel */}
            {jeTotal > 20 && (
              <div className="sales-pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setJePage(p => Math.max(1, p - 1))}
                  disabled={jePage === 1}
                >
                  {ar('← السابق', '← Prev')}
                </button>
                <span className="text-muted">{ar(`صفحة ${jePage} من ${jeLastPage}`, `Page ${jePage} of ${jeLastPage}`)}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setJePage(p => p + 1)}
                  disabled={jePage >= jeLastPage}
                >
                  {ar('التالي →', 'Next →')}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════
          TAB 3: Trial Balance
      ════════════════════════════════════════════════ */}
      {activeTab === 'trial-balance' && (
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : !trialBalance ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚖️</div>
              <p className="empty-state-text">{t('no_data')}</p>
            </div>
          ) : trialRows.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{ar('كود الحساب', 'Code')}</th>
                    <th>{ar('اسم الحساب', 'Account Name')}</th>
                    <th>{ar('نوع الحساب', 'Type')}</th>
                    <th style={{ textAlign: 'end' }}>{ar('مدين', 'Debit')}</th>
                    <th style={{ textAlign: 'end' }}>{ar('دائن', 'Credit')}</th>
                    <th style={{ textAlign: 'end' }}>{ar('الرصيد', 'Balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {trialRows.map((row, i) => (
                    <tr key={i}>
                      <td className="fw-semibold text-muted">{row.code || '—'}</td>
                      <td className="fw-semibold">{row.name || '—'}</td>
                      <td><span className={`badge ${typeBadge(row.type || '')}`}>{typeLabel(row.type || '')}</span></td>
                      <td style={{ textAlign: 'end' }}>{row.debit ? fmt(row.debit) : '—'}</td>
                      <td style={{ textAlign: 'end' }}>{row.credit ? fmt(row.credit) : '—'}</td>
                      <td style={{ textAlign: 'end', fontWeight: 600, color: (row.balance ?? 0) < 0 ? 'var(--color-danger)' : 'inherit' }}>
                        {fmt(row.balance ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, background: 'var(--bg-secondary)' }}>
                    <td colSpan={3}>{ar('الإجمالي', 'Total')}</td>
                    <td style={{ textAlign: 'end' }}>{fmt(trialTotalDebit)}</td>
                    <td style={{ textAlign: 'end' }}>{fmt(trialTotalCredit)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '0.5rem' }}>
                      {trialIsBalanced ? (
                        <span className="badge badge-success">✅ {ar('الميزان متوازن', 'Balanced')}</span>
                      ) : (
                        <span className="badge badge-danger">
                          ⚠️ {ar(`الميزان غير متوازن — الفرق: ${fmt(Math.abs(trialTotalDebit - trialTotalCredit))}`, `Not Balanced — Diff: ${fmt(Math.abs(trialTotalDebit - trialTotalCredit))}`)}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">⚖️</div>
              <p className="empty-state-text">{ar('لا توجد حسابات بقيود مرحّلة', 'No accounts with posted entries')}</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          TAB 4: Bank Statements
      ════════════════════════════════════════════════ */}
      {activeTab === 'bank-statements' && (
        <>
          <div className="toolbar">
            <div className="toolbar-actions">
              <h3 style={{margin:0}}>{lang==='ar'?'كشوف البنك':'Bank Statements'}</h3>
            </div>
            <button className="btn btn-primary" onClick={()=>setBankModal(true)}>+ {lang==='ar'?'إضافة كشف':'Add Statement'}</button>
          </div>
          <div className="card" style={{padding:0}}>
            {bankLoad ? (
              <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:12}}>
                {Array(5).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:44}}/>)}
              </div>
            ) : bankStmts.length===0 ? (
              <div className="empty-state"><div className="empty-state-icon">🏦</div><p className="empty-state-text">{lang==='ar'?'لا توجد كشوف حساب':'No bank statements'}</p></div>
            ) : (
              <div className="table-container"><table className="table">
                <thead><tr>
                  <th>{lang==='ar'?'البنك':'Bank'}</th>
                  <th>{lang==='ar'?'رقم الحساب':'Account #'}</th>
                  <th>{lang==='ar'?'التاريخ':'Date'}</th>
                  <th>{lang==='ar'?'المبلغ':'Amount'}</th>
                  <th>{lang==='ar'?'النوع':'Type'}</th>
                  <th>{lang==='ar'?'الوصف':'Description'}</th>
                  <th>{lang==='ar'?'المرجع':'Reference'}</th>
                  <th>{t('actions')}</th>
                </tr></thead>
                <tbody>{bankStmts.map((b:any)=>(
                  <tr key={b.id}>
                    <td className="fw-semibold">{b.bank_name}</td>
                    <td className="text-muted text-small">{b.account_number||'—'}</td>
                    <td>{b.date?new Date(b.date).toLocaleDateString(lang==='ar'?'ar-EG':'en-US'):'—'}</td>
                    <td className="fw-semibold">{fmt(b.amount||0)}</td>
                    <td><span className={b.type==='credit'?'badge badge-success':'badge badge-danger'}>{b.type==='credit'?(lang==='ar'?'دائن':'Credit'):(lang==='ar'?'مدين':'Debit')}</span></td>
                    <td className="text-muted">{b.description||'—'}</td>
                    <td className="text-muted text-small">{b.reference||'—'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={async()=>{await api.delete('/bank-statements/'+b.id);setBankStmts(p=>p.filter((x:any)=>x.id!==b.id))}}>{t('delete')}</button></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: New Account
      ════════════════════════════════════════════════ */}
      {accModal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setAccModal(false)}>
          <div style={{ maxWidth: 500, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('حساب جديد', 'New Account')}</h3>
              <button type="button" className="btn-icon" onClick={() => setAccModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAccSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{t('name')} *</label>
                    <input className="input" value={accForm.name} onChange={e => setAccForm({ ...accForm, name: e.target.value })} autoFocus required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('code')} *</label>
                    <input className="input" value={accForm.code} onChange={e => setAccForm({ ...accForm, code: e.target.value })} required />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('type')}</label>
                    <select className="input" value={accForm.type} onChange={e => setAccForm({ ...accForm, type: e.target.value })}>
                      {ACCOUNT_TYPES.map(at => <option key={at.value} value={at.value}>{ar(at.ar, at.en)}</option>)}
                    </select>
                  </div>
                </div>
                {accErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {accErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAccModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={accSaving}>{accSaving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ════════════════════════════════════════════════
          MODAL: New Journal Entry (multi-line)
      ════════════════════════════════════════════════ */}
      {jeModal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setJeModal(false)}>
          <div style={{ maxWidth: 780, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('قيد يومية جديد', 'New Journal Entry')}</h3>
              <button type="button" className="btn-icon" onClick={() => setJeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleJeSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>
                <div className="form-grid form-grid-2" style={{ marginBottom: '1.25rem' }}>
                  <div className="input-group">
                    <label className="input-label">{t('date')} *</label>
                    <input className="input" type="date" value={jeForm.date} onChange={e => setJeForm({ ...jeForm, date: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('description')} *</label>
                    <input className="input" value={jeForm.description} onChange={e => setJeForm({ ...jeForm, description: e.target.value })} placeholder={ar('وصف القيد', 'Entry description')} required />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 6, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'start', fontWeight: 600 }}>{ar('الحساب', 'Account')}</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'start', fontWeight: 600 }}>{ar('البيان', 'Description')}</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'end', fontWeight: 600 }}>{ar('مدين', 'Debit')}</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'end', fontWeight: 600 }}>{ar('دائن', 'Credit')}</th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {jeForm.lines.map((line, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <select
                              className="input"
                              value={line.account_id || ''}
                              onChange={e => updateLine(i, 'account_id', Number(e.target.value))}
                              style={{ minWidth: 160 }}
                            >
                              <option value="">{ar('اختر حساباً', 'Select account')}</option>
                              {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input
                              className="input"
                              value={line.description || ''}
                              onChange={e => updateLine(i, 'description', e.target.value)}
                              placeholder={ar('بيان', 'Note')}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.debit || ''}
                              onChange={e => updateLine(i, 'debit', e.target.value)}
                              style={{ textAlign: 'end', maxWidth: 110 }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.credit || ''}
                              onChange={e => updateLine(i, 'credit', e.target.value)}
                              style={{ textAlign: 'end', maxWidth: 110 }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.5rem' }}>
                            {jeForm.lines.length > 2 && (
                              <button type="button" onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                        <td colSpan={2} style={{ padding: '0.625rem 0.75rem' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                            + {ar('سطر جديد', 'Add Line')}
                          </button>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'end' }}>{fmt(totalDebit)}</td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'end' }}>{fmt(totalCredit)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {totalDebit > 0 && (
                    <span className={`badge ${isBalanced ? 'badge-success' : 'badge-danger'}`}>
                      {isBalanced
                        ? ar('✅ القيد متوازن', '✅ Balanced')
                        : ar(`⚠️ الفرق: ${fmt(Math.abs(totalDebit - totalCredit))}`, `⚠️ Diff: ${fmt(Math.abs(totalDebit - totalCredit))}`)}
                    </span>
                  )}
                </div>

                {jeErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {jeErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setJeModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={jeSaving || !isBalanced}>
                  {jeSaving ? t('loading') : ar('حفظ كمسودة', 'Save as Draft')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ════════════════════════════════════════════════
          MODAL: Journal Entry Details + Post
      ════════════════════════════════════════════════ */}
      {detailModal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setDetailModal(false)}>
          <div style={{ maxWidth: 700, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3 className="modal-title">{detailEntry?.ref || ar('تفاصيل القيد', 'Entry Details')}</h3>
                {detailEntry && (
                  <span className={`badge ${detailEntry.status === 'posted' ? 'badge-success' : 'badge-warning'}`}>
                    {detailEntry.status === 'posted' ? ar('مرحّل', 'Posted') : ar('مسودة', 'Draft')}
                  </span>
                )}
              </div>
              <button type="button" className="btn-icon" onClick={() => setDetailModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {detailLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
                </div>
              ) : detailEntry ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.875rem 1rem' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('date')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{fmtDate(detailEntry.date)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ar('المرجع', 'Reference')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{detailEntry.ref}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('description')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{detailEntry.description}</p>
                    </div>
                  </div>

                  {detailEntry.lines && detailEntry.lines.length > 0 ? (
                    <div style={{ border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 6, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                            <th style={{ padding: '0.625rem 0.75rem', textAlign: 'start', fontWeight: 600 }}>{ar('الحساب', 'Account')}</th>
                            <th style={{ padding: '0.625rem 0.75rem', textAlign: 'start', fontWeight: 600 }}>{ar('البيان', 'Description')}</th>
                            <th style={{ padding: '0.625rem 0.75rem', textAlign: 'end', fontWeight: 600 }}>{ar('مدين', 'Debit')}</th>
                            <th style={{ padding: '0.625rem 0.75rem', textAlign: 'end', fontWeight: 600 }}>{ar('دائن', 'Credit')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailEntry.lines.map((line, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                              <td style={{ padding: '0.625rem 0.75rem' }}>
                                <span className="fw-semibold">{line.account?.code}</span>
                                <span style={{ marginInlineStart: '0.5rem', color: 'var(--text-muted)' }}>{line.account?.name}</span>
                              </td>
                              <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)' }}>{line.description || '—'}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'end', fontWeight: line.debit > 0 ? 600 : 400 }}>
                                {line.debit > 0 ? fmt(line.debit) : '—'}
                              </td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'end', fontWeight: line.credit > 0 ? 600 : 400 }}>
                                {line.credit > 0 ? fmt(line.credit) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                            <td colSpan={2} style={{ padding: '0.625rem 0.75rem' }}>{ar('الإجمالي', 'Total')}</td>
                            <td style={{ padding: '0.625rem 0.75rem', textAlign: 'end' }}>{fmt(detailEntry.total_debit)}</td>
                            <td style={{ padding: '0.625rem 0.75rem', textAlign: 'end' }}>{fmt(detailEntry.total_credit)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">{ar('لا توجد سطور', 'No lines found')}</p>
                  )}

                  {/* ✅ عرض post error لو الترحيل فشل */}
                  {postErr && (
                    <div style={{ color: 'var(--color-danger)', background: 'rgba(220,38,38,0.08)', padding: '0.625rem 0.875rem', borderRadius: 6, marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                      ⚠️ {postErr}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted">{ar('لا توجد بيانات', 'No data')}</p>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDetailModal(false)}>{t('close')}</button>
              {detailEntry && detailEntry.status !== 'posted' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={posting}
                  onClick={handlePost}
                >
                  {posting ? t('loading') : ar('✅ ترحيل القيد', '✅ Post Entry')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ════════════════════════════════════════════════
          MODAL: Add Bank Statement
      ════════════════════════════════════════════════ */}
      {bankModal && isMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setBankModal(false)}>
          <div style={{ maxWidth: 560, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🏦 {ar('إضافة كشف بنكي', 'Add Bank Statement')}</h3>
              <button type="button" className="btn-icon" onClick={() => setBankModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBankSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{ar('اسم البنك', 'Bank Name')} *</label>
                    <input className="input" value={bankForm.bank_name} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('رقم الحساب', 'Account Number')}</label>
                    <input className="input" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('التاريخ', 'Date')} *</label>
                    <input className="input" type="date" value={bankForm.date} onChange={e => setBankForm({...bankForm, date: e.target.value})} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('المبلغ', 'Amount')} *</label>
                    <input className="input" type="number" min="0" step="0.01" value={bankForm.amount} onChange={e => setBankForm({...bankForm, amount: e.target.value})} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('النوع', 'Type')}</label>
                    <select className="input" value={bankForm.type} onChange={e => setBankForm({...bankForm, type: e.target.value})}>
                      <option value="credit">{ar('دائن', 'Credit')}</option>
                      <option value="debit">{ar('مدين', 'Debit')}</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('المرجع', 'Reference')}</label>
                    <input className="input" value={bankForm.reference} onChange={e => setBankForm({...bankForm, reference: e.target.value})} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('الوصف', 'Description')}</label>
                    <input className="input" value={bankForm.description} onChange={e => setBankForm({...bankForm, description: e.target.value})} />
                  </div>
                </div>
                {bankErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {bankErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBankModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={bankSave}>{bankSave ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </ERPLayout>
  )
}