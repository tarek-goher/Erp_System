'use client'

// ══════════════════════════════════════════════════════════
// app/accounting/page.tsx — صفحة المحاسبة
// API: GET /api/accounts | GET /api/journal-entries
//      GET /api/accounts/trial-balance | GET /api/bank-statements
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Account = { id: number; name: string; code: string; type: string; balance: number }
type JournalEntry = { id: number; reference: string; description: string; total_debit: number; total_credit: number; date: string; status: string }

const TABS = ['accounts', 'journal', 'trial-balance']

export default function AccountingPage() {
  const { t, lang } = useI18n()
  const [activeTab,    setActiveTab]    = useState('accounts')
  const [accounts,     setAccounts]     = useState<Account[]>([])
  const [journals,     setJournals]     = useState<JournalEntry[]>([])
  const [trialBalance, setTrialBalance] = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [formErr,      setFormErr]      = useState('')

  const [form, setForm] = useState({ name: '', code: '', type: 'asset' })

  const ACCOUNT_TYPES = [
    { value: 'asset',     ar: 'أصول',      en: 'Asset' },
    { value: 'liability', ar: 'خصوم',      en: 'Liability' },
    { value: 'equity',    ar: 'حقوق ملكية', en: 'Equity' },
    { value: 'revenue',   ar: 'إيرادات',   en: 'Revenue' },
    { value: 'expense',   ar: 'مصروفات',   en: 'Expense' },
  ]

  const tabLabels: Record<string, { ar: string; en: string }> = {
    'accounts':      { ar: 'الحسابات',      en: 'Chart of Accounts' },
    'journal':       { ar: 'قيود اليومية',  en: 'Journal Entries' },
    'trial-balance': { ar: 'ميزان المراجعة', en: 'Trial Balance' },
  }

  // ── جلب الحسابات ──────────────────────────────────────
  const fetchAccounts = async () => {
    setLoading(true)
    const res = await api.get<{ data: Account[] }>('/accounts?per_page=50')
    if (res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setAccounts(list)
    }
    setLoading(false)
  }

  // ── جلب قيود اليومية ──────────────────────────────────
  const fetchJournals = async () => {
    setLoading(true)
    const res = await api.get<{ data: JournalEntry[] }>('/journal-entries?per_page=20')
    if (res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setJournals(list)
    }
    setLoading(false)
  }

  // ── جلب ميزان المراجعة ────────────────────────────────
  const fetchTrialBalance = async () => {
    setLoading(true)
    const res = await api.get('/accounts/trial-balance')
    if (res.data) setTrialBalance(res.data)
    setLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'accounts')      fetchAccounts()
    if (activeTab === 'journal')       fetchJournals()
    if (activeTab === 'trial-balance') fetchTrialBalance()
  }, [activeTab])

  // ── إضافة حساب ────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.name || !form.code) { setFormErr(t('required_field')); return }
    setSaving(true)
    const res = await api.post('/accounts', { name: form.name, code: form.code, type: form.type })
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false); setForm({ name: '', code: '', type: 'asset' }); fetchAccounts()
  }

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  const typeBadge = (type: string) => ({
    asset: 'badge-info', liability: 'badge-warning',
    equity: 'badge-primary', revenue: 'badge-success', expense: 'badge-danger'
  }[type] || 'badge-muted')

  const typeLabel = (type: string) => {
    const found = ACCOUNT_TYPES.find(t => t.value === type)
    return found ? (lang === 'ar' ? found.ar : found.en) : type
  }

  return (
    <ERPLayout pageTitle={t('accounting')}>
      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {lang === 'ar' ? tabLabels[tab].ar : tabLabels[tab].en}
          </button>
        ))}
      </div>

      {/* ── تاب الحسابات ─────────────────────────────── */}
      {activeTab === 'accounts' && (
        <>
          <div className="toolbar">
            <span className="fw-semibold text-secondary">
              {lang === 'ar' ? `${accounts.length} حساب` : `${accounts.length} accounts`}
            </span>
            <button className="btn btn-primary" onClick={() => setModal(true)}>+ {lang === 'ar' ? 'حساب جديد' : 'New Account'}</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : accounts.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🧾</div><p className="empty-state-text">{t('no_data')}</p></div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('code')}</th>
                      <th>{t('name')}</th>
                      <th>{t('type')}</th>
                      <th>{lang === 'ar' ? 'الرصيد' : 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => (
                      <tr key={acc.id}>
                        <td className="fw-semibold text-muted">{acc.code}</td>
                        <td className="fw-semibold">{acc.name}</td>
                        <td><span className={`badge ${typeBadge(acc.type)}`}>{typeLabel(acc.type)}</span></td>
                        <td className={`fw-semibold ${acc.balance < 0 ? 'text-danger' : ''}`}>{fmt(acc.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── تاب قيود اليومية ─────────────────────────── */}
      {activeTab === 'journal' && (
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : journals.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📒</div><p className="empty-state-text">{t('no_data')}</p></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'المرجع' : 'Reference'}</th>
                    <th>{t('description')}</th>
                    <th>{lang === 'ar' ? 'إجمالي مدين' : 'Total Debit'}</th>
                    <th>{lang === 'ar' ? 'إجمالي دائن' : 'Total Credit'}</th>
                    <th>{t('date')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map(j => (
                    <tr key={j.id}>
                      <td className="fw-semibold">{j.reference || `#${j.id}`}</td>
                      <td className="text-muted">{j.description}</td>
                      <td>{fmt(j.total_debit)}</td>
                      <td>{fmt(j.total_credit)}</td>
                      <td className="text-muted">{fmtDate(j.date)}</td>
                      <td><span className={`badge ${j.status === 'posted' ? 'badge-success' : 'badge-warning'}`}>{j.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── تاب ميزان المراجعة ───────────────────────── */}
      {activeTab === 'trial-balance' && (
        <div className="card">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : !trialBalance ? (
            <div className="empty-state"><div className="empty-state-icon">⚖️</div><p className="empty-state-text">{t('no_data')}</p></div>
          ) : (
            <div>
              <h3 className="fw-bold" style={{ marginBottom: '1rem' }}>
                {lang === 'ar' ? 'ميزان المراجعة' : 'Trial Balance'}
              </h3>
              <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(trialBalance, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Modal: حساب جديد */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{lang === 'ar' ? 'حساب جديد' : 'New Account'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{t('name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('code')} *</label>
                    <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('type')}</label>
                    <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {ACCOUNT_TYPES.map(at => <option key={at.value} value={at.value}>{lang === 'ar' ? at.ar : at.en}</option>)}
                    </select>
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
    </ERPLayout>
  )
}
