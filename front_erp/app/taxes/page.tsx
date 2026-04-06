'use client'

// ══════════════════════════════════════════════════════════
// app/taxes/page.tsx — الضرائب + VAT Returns
// API: GET    /api/taxes           → قائمة الضرائب
//      POST   /api/taxes           → إضافة ضريبة
//      PUT    /api/taxes/{id}      → تعديل
//      DELETE /api/taxes/{id}      → حذف
//      GET    /api/taxes/vat-report?from=&to= → تقرير الـ VAT
//      GET    /api/taxes/periods   → الفترات المتاحة
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Tax = { id: number; name: string; rate: number; type: 'inclusive' | 'exclusive'; is_active: boolean }
type Period = { label: string; from: string; to: string }
type VatReport = {
  period: { from: string; to: string }
  sales: { count: number; net_sales: number; output_vat: number; gross: number }
  purchases: { count: number; net_purchases: number; input_vat: number; gross: number }
  summary: { output_vat: number; input_vat: number; net_vat_due: number; status: string }
}

export default function TaxesPage() {
  const { lang } = useI18n()

  const [taxes,    setTaxes]    = useState<Tax[]>([])
  const [periods,  setPeriods]  = useState<Period[]>([])
  const [loading,  setLoading]  = useState(true)
  const [activeTab, setActiveTab] = useState<'taxes' | 'vat'>('taxes')

  // Tax CRUD
  const [modal,  setModal]  = useState(false)
  const [editTax, setEditTax] = useState<Tax | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', rate: '', type: 'exclusive', is_active: true })

  // VAT Report
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')
  const [vatReport,  setVatReport]  = useState<VatReport | null>(null)
  const [vatLoading, setVatLoading] = useState(false)

  const fetchTaxes = async () => {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([
      api.get<Tax[]>('/taxes'),
      api.get<Period[]>('/taxes/periods'),
    ])
    if (tRes.data) setTaxes(Array.isArray(tRes.data) ? tRes.data : [])
    if (pRes.data) setPeriods(pRes.data)
    setLoading(false)
  }
  useEffect(() => { fetchTaxes() }, [])

  // ── Tax CRUD ─────────────────────────────────────────────
  const openAdd = () => {
    setEditTax(null)
    setForm({ name: '', rate: '', type: 'exclusive', is_active: true })
    setModal(true)
  }
  const openEdit = (t: Tax) => {
    setEditTax(t)
    setForm({ name: t.name, rate: String(t.rate), type: t.type, is_active: t.is_active })
    setModal(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.rate) return
    setSaving(true)
    const body = { name: form.name, rate: Number(form.rate), type: form.type, is_active: form.is_active }
    const res = editTax
      ? await api.put(`/taxes/${editTax.id}`, body)
      : await api.post('/taxes', body)
    setSaving(false)
    if (!res.error) { setModal(false); fetchTaxes() }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'حذف هذه الضريبة؟' : 'Delete this tax?')) return
    await api.delete(`/taxes/${id}`)
    fetchTaxes()
  }

  // ── VAT Report ────────────────────────────────────────────
  const loadVatReport = async () => {
    const from = selectedPeriod ? selectedPeriod.from : customFrom
    const to   = selectedPeriod ? selectedPeriod.to   : customTo
    if (!from || !to) return
    setVatLoading(true)
    const res = await api.get<VatReport>(`/taxes/vat-report?from=${from}&to=${to}`)
    if (res.data) setVatReport(res.data)
    setVatLoading(false)
  }

  const fmt = (n: number) => Number(n || 0).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 })

  return (
    <ERPLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{lang === 'ar' ? 'الضرائب والقيمة المضافة' : 'Taxes & VAT'}</h1>
          {activeTab === 'taxes' && (
            <button className="btn btn-primary" onClick={openAdd}>
              + {lang === 'ar' ? 'إضافة ضريبة' : 'Add Tax'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
          {([['taxes', lang === 'ar' ? 'الضرائب' : 'Tax Rates'], ['vat', lang === 'ar' ? 'إقرار ضريبي (VAT)' : 'VAT Return']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600,
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Tax Rates ── */}
        {activeTab === 'taxes' && (
          <div className="card">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th>{lang === 'ar' ? 'النسبة' : 'Rate'}</th>
                    <th>{lang === 'ar' ? 'النوع' : 'Type'}</th>
                    <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {taxes.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td><span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>{t.rate}%</span></td>
                      <td>
                        <span className={`badge ${t.type === 'inclusive' ? 'badge-info' : 'badge-warning'}`}>
                          {t.type === 'inclusive' ? (lang === 'ar' ? 'شاملة' : 'Inclusive') : (lang === 'ar' ? 'غير شاملة' : 'Exclusive')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${t.is_active ? 'badge-success' : 'badge-muted'}`}>
                          {t.is_active ? (lang === 'ar' ? 'فعّال' : 'Active') : (lang === 'ar' ? 'غير فعّال' : 'Inactive')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}>{lang === 'ar' ? 'تعديل' : 'Edit'}</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>{lang === 'ar' ? 'حذف' : 'Delete'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {taxes.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{lang === 'ar' ? 'لا توجد ضرائب' : 'No taxes defined'}</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: VAT Return ── */}
        {activeTab === 'vat' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>{lang === 'ar' ? 'اختر الفترة الضريبية' : 'Select Tax Period'}</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {periods.slice(0, 8).map(p => (
                  <button key={p.label}
                    onClick={() => { setSelectedPeriod(p); setCustomFrom(''); setCustomTo('') }}
                    className={`btn btn-sm ${selectedPeriod?.label === p.label ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{lang === 'ar' ? 'من' : 'From'}</label>
                  <input className="form-input" type="date" value={customFrom}
                    onChange={e => { setCustomFrom(e.target.value); setSelectedPeriod(null) }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{lang === 'ar' ? 'إلى' : 'To'}</label>
                  <input className="form-input" type="date" value={customTo}
                    onChange={e => { setCustomTo(e.target.value); setSelectedPeriod(null) }}
                  />
                </div>
                <button className="btn btn-primary" onClick={loadVatReport} disabled={vatLoading}>
                  {vatLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {lang === 'ar' ? 'جاري...' : 'Loading...'}</> : lang === 'ar' ? 'عرض التقرير' : 'Generate Report'}
                </button>
              </div>
            </div>

            {vatReport && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* مبيعات */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>
                    📦 {lang === 'ar' ? 'المبيعات (ضريبة المخرجات)' : 'Sales (Output VAT)'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                      { label: lang === 'ar' ? 'عدد الفواتير' : 'Invoice Count',  value: vatReport.sales.count },
                      { label: lang === 'ar' ? 'صافي المبيعات' : 'Net Sales',     value: `${fmt(vatReport.sales.net_sales)} ${lang === 'ar' ? 'ج' : 'EGP'}` },
                      { label: lang === 'ar' ? 'ضريبة المخرجات' : 'Output VAT',   value: `${fmt(vatReport.sales.output_vat)} ${lang === 'ar' ? 'ج' : 'EGP'}`, highlight: true },
                      { label: lang === 'ar' ? 'إجمالي المبيعات' : 'Gross Sales', value: `${fmt(vatReport.sales.gross)} ${lang === 'ar' ? 'ج' : 'EGP'}` },
                    ].map((row, i) => (
                      <div key={i} className="stat-card" style={row.highlight ? { borderTop: '3px solid var(--color-primary)' } : {}}>
                        <div className="stat-value" style={row.highlight ? { color: 'var(--color-primary)' } : {}}>{row.value}</div>
                        <div className="stat-label">{row.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* مشتريات */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>
                    🛒 {lang === 'ar' ? 'المشتريات (ضريبة المدخلات)' : 'Purchases (Input VAT)'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                      { label: lang === 'ar' ? 'عدد الفواتير' : 'Invoice Count',      value: vatReport.purchases.count },
                      { label: lang === 'ar' ? 'صافي المشتريات' : 'Net Purchases',    value: `${fmt(vatReport.purchases.net_purchases)} ${lang === 'ar' ? 'ج' : 'EGP'}` },
                      { label: lang === 'ar' ? 'ضريبة المدخلات' : 'Input VAT',         value: `${fmt(vatReport.purchases.input_vat)} ${lang === 'ar' ? 'ج' : 'EGP'}`, highlight: true },
                      { label: lang === 'ar' ? 'إجمالي المشتريات' : 'Gross Purchases', value: `${fmt(vatReport.purchases.gross)} ${lang === 'ar' ? 'ج' : 'EGP'}` },
                    ].map((row, i) => (
                      <div key={i} className="stat-card" style={row.highlight ? { borderTop: '3px solid var(--color-secondary)' } : {}}>
                        <div className="stat-value" style={row.highlight ? { color: 'var(--color-secondary)' } : {}}>{row.value}</div>
                        <div className="stat-label">{row.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ملخص */}
                <div className="card" style={{ padding: '1.5rem', borderTop: `4px solid ${vatReport.summary.status === 'payable' ? 'var(--color-danger)' : 'var(--color-success)'}` }}>
                  <h3 style={{ marginBottom: '1rem' }}>📊 {lang === 'ar' ? 'الملخص الضريبي' : 'Tax Summary'}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    {[
                      { label: lang === 'ar' ? 'ضريبة المخرجات' : 'Output VAT',  value: `${fmt(vatReport.summary.output_vat)} ${lang === 'ar' ? 'ج' : 'EGP'}`, color: 'var(--color-primary)' },
                      { label: lang === 'ar' ? 'ضريبة المدخلات' : 'Input VAT',   value: `${fmt(vatReport.summary.input_vat)} ${lang === 'ar' ? 'ج' : 'EGP'}`, color: 'var(--color-secondary)' },
                      { label: vatReport.summary.status === 'payable' ? (lang === 'ar' ? 'مستحق الدفع' : 'Net VAT Due') : (lang === 'ar' ? 'مستحق الاسترداد' : 'VAT Refund'),
                        value: `${fmt(Math.abs(vatReport.summary.net_vat_due))} ${lang === 'ar' ? 'ج' : 'EGP'}`,
                        color: vatReport.summary.status === 'payable' ? 'var(--color-danger)' : 'var(--color-success)' },
                    ].map((row, i) => (
                      <div key={i} className="stat-card" style={{ borderTop: `3px solid ${row.color}` }}>
                        <div className="stat-value" style={{ color: row.color, fontSize: '1.15rem' }}>{row.value}</div>
                        <div className="stat-label">{row.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: vatReport.summary.status === 'payable' ? 'var(--color-danger-light)' : 'var(--color-success-light)', textAlign: 'center', fontWeight: 700, fontSize: '1.05rem', color: vatReport.summary.status === 'payable' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {vatReport.summary.status === 'payable'
                      ? (lang === 'ar' ? `⚠️ يجب سداد ${fmt(vatReport.summary.net_vat_due)} ج` : `⚠️ You owe ${fmt(vatReport.summary.net_vat_due)} EGP to tax authority`)
                      : (lang === 'ar' ? `✅ مستحق لك ${fmt(Math.abs(vatReport.summary.net_vat_due))} ج استرداد` : `✅ You are owed ${fmt(Math.abs(vatReport.summary.net_vat_due))} EGP refund`)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add/Edit Tax */}
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h2>{editTax ? (lang === 'ar' ? 'تعديل الضريبة' : 'Edit Tax') : (lang === 'ar' ? 'إضافة ضريبة' : 'Add Tax')}</h2>
                <button className="modal-close" onClick={() => setModal(false)}>×</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">{lang === 'ar' ? 'اسم الضريبة *' : 'Tax Name *'}</label>
                    <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder={lang === 'ar' ? 'مثال: ضريبة القيمة المضافة 14%' : 'e.g. VAT 14%'} />
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">{lang === 'ar' ? 'النسبة (%) *' : 'Rate (%) *'}</label>
                      <input className="form-input" type="number" step="0.01" min={0} max={100} value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{lang === 'ar' ? 'النوع' : 'Type'}</label>
                      <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="exclusive">{lang === 'ar' ? 'غير شاملة (Exclusive)' : 'Exclusive'}</option>
                        <option value="inclusive">{lang === 'ar' ? 'شاملة (Inclusive)' : 'Inclusive'}</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                      {lang === 'ar' ? 'فعّال' : 'Active'}
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? '...' : lang === 'ar' ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}
