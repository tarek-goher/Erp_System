'use client'

// ══════════════════════════════════════════════════════════
// app/budgets/page.tsx — الميزانيات التقديرية
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET    /api/budgets           → قائمة الميزانيات
//   POST   /api/budgets           → إضافة ميزانية
//   PUT    /api/budgets/{id}      → تعديل ميزانية
//   DELETE /api/budgets/{id}      → حذف ميزانية
//   GET    /api/budgets/{id}/vs   → مقارنة الميزانية مع الفعلي
//   GET    /api/accounts          → قائمة الحسابات
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Budget = {
  id: number
  name: string
  account_id: number
  amount: number
  period_start: string
  period_end: string
  notes: string | null
  account?: { id: number; name: string; code: string }
  created_at: string
}

type BudgetVs = {
  budget: number
  spent: number
  remaining: number
  percentage: number
}

type Account = { id: number; name: string; code: string }

const EMPTY_FORM = {
  name: '',
  account_id: '',
  amount: '',
  period_start: '',
  period_end: '',
  notes: '',
}

export default function BudgetsPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [budgets,    setBudgets]    = useState<Budget[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [accounts,   setAccounts]   = useState<Account[]>([])

  const [modal,      setModal]      = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formErr,    setFormErr]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [deleteId,   setDeleteId]   = useState<number | null>(null)

  const [vsModal,    setVsModal]    = useState(false)
  const [vsData,     setVsData]     = useState<BudgetVs | null>(null)
  const [vsLoading,  setVsLoading]  = useState(false)
  const [vsBudget,   setVsBudget]   = useState<Budget | null>(null)

  const fetchBudgets = async () => {
    setLoading(true)
    const res = await api.get<{ data: Budget[]; total: number }>(`/budgets?page=${page}&per_page=15`)
    if (res.data) { setBudgets(res.data.data || []); setTotal(res.data.total || 0) }
    setLoading(false)
  }

  const fetchAccounts = async () => {
    const res = await api.get<{ data: Account[] }>('/accounts?per_page=100')
    if (res.data?.data) setAccounts(res.data.data)
  }

  useEffect(() => { fetchBudgets() }, [page])
  useEffect(() => { fetchAccounts() }, [])

  const openAdd = () => {
    setEditBudget(null)
    setForm({ ...EMPTY_FORM, period_start: new Date().toISOString().split('T')[0] })
    setFormErr('')
    setModal(true)
  }

  const openEdit = (b: Budget) => {
    setEditBudget(b)
    setForm({
      name: b.name,
      account_id: String(b.account_id),
      amount: String(b.amount),
      period_start: b.period_start,
      period_end: b.period_end,
      notes: b.notes || '',
    })
    setFormErr('')
    setModal(true)
  }

  const openVs = async (b: Budget) => {
    setVsBudget(b)
    setVsLoading(true)
    setVsModal(true)
    const res = await api.get<BudgetVs>(`/budgets/${b.id}/vs`)
    if (res.data) setVsData(res.data)
    setVsLoading(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.name.trim())     { setFormErr(ar('الاسم مطلوب',     'Name is required'));         return }
    if (!form.account_id)      { setFormErr(ar('الحساب مطلوب',    'Account is required'));       return }
    if (!form.amount)          { setFormErr(ar('المبلغ مطلوب',    'Amount is required'));        return }
    if (!form.period_start)    { setFormErr(ar('تاريخ البداية مطلوب', 'Start date is required')); return }
    if (!form.period_end)      { setFormErr(ar('تاريخ النهاية مطلوب', 'End date is required'));   return }

    setSaving(true)
    const payload = {
      name:         form.name,
      account_id:   Number(form.account_id),
      amount:       Number(form.amount),
      period_start: form.period_start,
      period_end:   form.period_end,
      notes:        form.notes || null,
    }
    const res = editBudget
      ? await api.put(`/budgets/${editBudget.id}`, payload)
      : await api.post('/budgets', payload)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    fetchBudgets()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/budgets/${deleteId}`)
    setDeleteId(null)
    fetchBudgets()
  }

  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : '—'

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  return (
    <ERPLayout pageTitle={ar('الميزانيات', 'Budgets')}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-actions" />
        <button className="btn btn-primary" onClick={openAdd}>
          + {ar('ميزانية جديدة', 'New Budget')}
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : budgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-text">{ar('لا توجد ميزانيات', 'No budgets found')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{ar('اسم الميزانية', 'Budget Name')}</th>
                  <th>{ar('الحساب', 'Account')}</th>
                  <th>{ar('المبلغ', 'Amount')}</th>
                  <th>{ar('الفترة', 'Period')}</th>
                  <th>{ar('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map(b => (
                  <tr key={b.id}>
                    <td className="text-muted">{b.id}</td>
                    <td className="fw-semibold">{b.name}</td>
                    <td className="text-muted">{b.account?.name || '—'}</td>
                    <td>{fmt(b.amount)}</td>
                    <td className="text-muted">{fmtDate(b.period_start)} – {fmtDate(b.period_end)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openVs(b)}>
                          📊 {ar('مقارنة', 'Compare')}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>{t('edit')}</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(b.id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="sales-pagination">
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              {ar('← السابق', '← Prev')}
            </button>
            <span className="text-muted">{ar(`صفحة ${page}`, `Page ${page}`)}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={budgets.length < 15}>
              {ar('التالي →', 'Next →')}
            </button>
          </div>
        )}
      </div>

      {/* ── Modal: Budget vs Actual ────────────────────────── */}
      {vsModal && (
        <div className="modal-overlay" onClick={() => { setVsModal(false); setVsData(null) }}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {ar('الميزانية مقابل الفعلي', 'Budget vs Actual')}
                {vsBudget && <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.875rem', marginInlineStart: '0.5rem' }}>— {vsBudget.name}</span>}
              </h3>
              <button className="btn-icon" onClick={() => { setVsModal(false); setVsData(null) }}>✕</button>
            </div>
            <div className="modal-body">
              {vsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
                </div>
              ) : vsData ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                      { label: ar('الميزانية',   'Budget'),      value: fmt(vsData.budget),    icon: '🎯', color: 'var(--color-primary)' },
                      { label: ar('المنصرف',     'Spent'),       value: fmt(vsData.spent),     icon: '💸', color: 'var(--color-danger)' },
                      { label: ar('المتبقي',     'Remaining'),   value: fmt(vsData.remaining), icon: '💰', color: vsData.remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
                      { label: ar('نسبة الصرف',  'Spent %'),     value: `${vsData.percentage}%`, icon: '📈', color: vsData.percentage > 100 ? 'var(--color-danger)' : 'var(--text-primary)' },
                    ].map(card => (
                      <div key={card.label} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{card.icon}</span>
                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: card.color }}>{card.value}</p>
                        <p className="stat-label" style={{ margin: 0 }}>{card.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* شريط التقدم */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>{ar('نسبة الصرف', 'Spending Progress')}</span>
                      <span>{vsData.percentage}%</span>
                    </div>
                    <div style={{ height: 10, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(vsData.percentage, 100)}%`,
                        background: vsData.percentage > 100 ? 'var(--color-danger)' : vsData.percentage > 80 ? 'var(--color-warning)' : 'var(--color-success)',
                        borderRadius: 99,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    {vsData.percentage > 100 && (
                      <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        ⚠️ {ar('تجاوزت الميزانية المحددة!', 'Budget exceeded!')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted">{ar('لا توجد بيانات', 'No data available')}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setVsModal(false); setVsData(null) }}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: إضافة / تعديل ──────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editBudget ? ar('تعديل ميزانية', 'Edit Budget') : ar('ميزانية جديدة', 'New Budget')}
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('اسم الميزانية', 'Budget Name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={ar('مثال: ميزانية المبيعات 2025', 'e.g. Sales Budget 2025')} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('الحساب', 'Account')} *</label>
                    <select className="input" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })}>
                      <option value="">{ar('اختر حساباً', 'Select account')}</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('المبلغ', 'Amount')} *</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('من تاريخ', 'Period Start')} *</label>
                    <input className="input" type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('إلى تاريخ', 'Period End')} *</label>
                    <input className="input" type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} />
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('ملاحظات', 'Notes')}</label>
                    <textarea className="input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
                  </div>
                </div>

                {formErr && (
                  <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {formErr}</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: تأكيد الحذف ─────────────────────────────── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('تأكيد الحذف', 'Confirm Delete')}</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body"><p>{ar('هل أنت متأكد من حذف هذه الميزانية؟', 'Are you sure you want to delete this budget?')}</p></div>
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
