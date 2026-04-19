'use client'

// ══════════════════════════════════════════════════════════
// app/taxes/page.tsx — الضرائب + VAT Returns (Enhanced)
// NEW: Tax Groups, Fiscal Positions, Audit Trail, Auto Detection
// API: GET/POST/PUT/DELETE /api/taxes
//      GET/POST/PUT/DELETE /api/taxes/groups
//      GET/POST/PUT/DELETE /api/taxes/fiscal-positions
//      GET                 /api/taxes/vat-report
//      GET                 /api/taxes/periods
//      GET                 /api/taxes/audit-log
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Tax = { id: number; name: string; rate: number; type: 'inclusive' | 'exclusive'; is_active: boolean; auto_detect_category?: string }
type TaxGroup = { id: number; name: string; name_ar: string; tax_ids: number[]; taxes?: Tax[] }
type FiscalPosition = {
  id: number; name: string; name_ar: string; country?: string
  auto_apply: boolean; tax_mapping: { from_tax_id: number; to_tax_id: number }[]
}
type AuditLog = { id: number; action: string; entity: string; entity_id: number; user_name: string; changes: string; created_at: string }
type Period = { label: string; from: string; to: string }
type VatReport = {
  period: { from: string; to: string }
  sales: { count: number; net_sales: number; output_vat: number; gross: number }
  purchases: { count: number; net_purchases: number; input_vat: number; gross: number }
  summary: { output_vat: number; input_vat: number; net_vat_due: number; status: string }
}

const AUTO_CATEGORIES = ['electronics', 'food', 'clothing', 'services', 'real_estate', 'medicine']
const AUTO_CATEGORY_AR: Record<string, string> = {
  electronics: 'إلكترونيات', food: 'أغذية', clothing: 'ملابس',
  services: 'خدمات', real_estate: 'عقارات', medicine: 'أدوية',
}

export default function TaxesPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [activeTab, setActiveTab] = useState<'taxes' | 'groups' | 'fiscal' | 'vat' | 'audit'>('taxes')
  const [taxes,           setTaxes]          = useState<Tax[]>([])
  const [groups,          setGroups]         = useState<TaxGroup[]>([])
  const [fiscalPositions, setFiscalPositions] = useState<FiscalPosition[]>([])
  const [auditLogs,       setAuditLogs]      = useState<AuditLog[]>([])
  const [periods,         setPeriods]        = useState<Period[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  // Modals
  const [taxModal,     setTaxModal]     = useState(false)
  const [groupModal,   setGroupModal]   = useState(false)
  const [fiscalModal,  setFiscalModal]  = useState(false)
  const [editTax,      setEditTax]      = useState<Tax | null>(null)
  const [editGroup,    setEditGroup]    = useState<TaxGroup | null>(null)
  const [editFiscal,   setEditFiscal]   = useState<FiscalPosition | null>(null)

  const [taxForm,   setTaxForm]   = useState({ name: '', rate: '', type: 'exclusive', is_active: true, auto_detect_category: '' })
  const [groupForm, setGroupForm] = useState({ name: '', name_ar: '', tax_ids: [] as number[] })
  const [fiscalForm, setFiscalForm] = useState({ name: '', name_ar: '', country: '', auto_apply: false, tax_mapping: [] as { from_tax_id: number; to_tax_id: number }[] })

  // VAT
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')
  const [vatReport,  setVatReport]  = useState<VatReport | null>(null)
  const [vatLoading, setVatLoading] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const [tRes, gRes, fRes, pRes] = await Promise.all([
      api.get<Tax[]>('/taxes'),
      api.get<TaxGroup[]>('/taxes/groups'),
      api.get<FiscalPosition[]>('/taxes/fiscal-positions'),
      api.get<Period[]>('/taxes/periods'),
    ])
    if (tRes.data) setTaxes(Array.isArray(tRes.data) ? tRes.data : [])
    if (gRes.data) setGroups(Array.isArray(gRes.data) ? gRes.data : [])
    if (fRes.data) setFiscalPositions(Array.isArray(fRes.data) ? fRes.data : [])
    if (pRes.data) setPeriods(pRes.data)
    setLoading(false)
  }

  const fetchAudit = async () => {
    const res = await api.get<AuditLog[]>('/taxes/audit-log')
    if (res.data) setAuditLogs(Array.isArray(res.data) ? res.data : [])
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (activeTab === 'audit') fetchAudit() }, [activeTab])

  // ── Tax CRUD ─────────────────────────────────────────────
  const openAddTax = () => { setEditTax(null); setTaxForm({ name: '', rate: '', type: 'exclusive', is_active: true, auto_detect_category: '' }); setTaxModal(true) }
  const openEditTax = (t: Tax) => {
    setEditTax(t)
    setTaxForm({ name: t.name, rate: String(t.rate), type: t.type, is_active: t.is_active, auto_detect_category: t.auto_detect_category || '' })
    setTaxModal(true)
  }
  const handleSaveTax = async (e: FormEvent) => {
    e.preventDefault(); if (!taxForm.name || !taxForm.rate) return; setSaving(true)
    const body = { name: taxForm.name, rate: Number(taxForm.rate), type: taxForm.type, is_active: taxForm.is_active, auto_detect_category: taxForm.auto_detect_category || null }
    const res = editTax ? await api.put(`/taxes/${editTax.id}`, body) : await api.post('/taxes', body)
    setSaving(false); if (!res.error) { setTaxModal(false); fetchAll() }
  }
  const handleDeleteTax = async (id: number) => {
    if (!confirm(ar ? 'حذف هذه الضريبة؟' : 'Delete tax?')) return
    await api.delete(`/taxes/${id}`); fetchAll()
  }

  // ── Group CRUD ───────────────────────────────────────────
  const openAddGroup = () => { setEditGroup(null); setGroupForm({ name: '', name_ar: '', tax_ids: [] }); setGroupModal(true) }
  const openEditGroup = (g: TaxGroup) => { setEditGroup(g); setGroupForm({ name: g.name, name_ar: g.name_ar, tax_ids: g.tax_ids }); setGroupModal(true) }
  const handleSaveGroup = async (e: FormEvent) => {
    e.preventDefault(); if (!groupForm.name) return; setSaving(true)
    const res = editGroup ? await api.put(`/taxes/groups/${editGroup.id}`, groupForm) : await api.post('/taxes/groups', groupForm)
    setSaving(false); if (!res.error) { setGroupModal(false); fetchAll() }
  }
  const toggleTaxInGroup = (taxId: number) => {
    setGroupForm(f => ({ ...f, tax_ids: f.tax_ids.includes(taxId) ? f.tax_ids.filter(id => id !== taxId) : [...f.tax_ids, taxId] }))
  }

  // ── Fiscal CRUD ──────────────────────────────────────────
  const openAddFiscal = () => { setEditFiscal(null); setFiscalForm({ name: '', name_ar: '', country: '', auto_apply: false, tax_mapping: [] }); setFiscalModal(true) }
  const openEditFiscal = (fp: FiscalPosition) => { setEditFiscal(fp); setFiscalForm({ name: fp.name, name_ar: fp.name_ar, country: fp.country || '', auto_apply: fp.auto_apply, tax_mapping: fp.tax_mapping }); setFiscalModal(true) }
  const handleSaveFiscal = async (e: FormEvent) => {
    e.preventDefault(); if (!fiscalForm.name) return; setSaving(true)
    const res = editFiscal ? await api.put(`/taxes/fiscal-positions/${editFiscal.id}`, fiscalForm) : await api.post('/taxes/fiscal-positions', fiscalForm)
    setSaving(false); if (!res.error) { setFiscalModal(false); fetchAll() }
  }
  const addMapping = () => setFiscalForm(f => ({ ...f, tax_mapping: [...f.tax_mapping, { from_tax_id: 0, to_tax_id: 0 }] }))
  const removeMapping = (i: number) => setFiscalForm(f => ({ ...f, tax_mapping: f.tax_mapping.filter((_, idx) => idx !== i) }))
  const updateMapping = (i: number, key: 'from_tax_id' | 'to_tax_id', val: number) => {
    setFiscalForm(f => ({ ...f, tax_mapping: f.tax_mapping.map((m, idx) => idx === i ? { ...m, [key]: val } : m) }))
  }

  // ── VAT ──────────────────────────────────────────────────
  const loadVatReport = async () => {
    const from = selectedPeriod ? selectedPeriod.from : customFrom
    const to   = selectedPeriod ? selectedPeriod.to   : customTo
    if (!from || !to) return; setVatLoading(true)
    const res = await api.get<VatReport>(`/taxes/vat-report?from=${from}&to=${to}`)
    if (res.data) setVatReport(res.data); setVatLoading(false)
  }

  const fmt = (n: number) => Number(n || 0).toLocaleString(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 })

  const TABS = [
    ['taxes',   ar ? 'معدلات الضرائب' : 'Tax Rates'],
    ['groups',  ar ? 'مجموعات الضرائب' : 'Tax Groups'],
    ['fiscal',  ar ? 'المراكز المالية' : 'Fiscal Positions'],
    ['vat',     ar ? 'إقرار VAT' : 'VAT Return'],
    ['audit',   ar ? 'سجل المراجعة' : 'Audit Trail'],
  ] as const

  return (
    <ERPLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{ar ? 'الضرائب والقيمة المضافة' : 'Taxes & VAT'}</h1>
          {activeTab === 'taxes'  && <button className="btn btn-primary" onClick={openAddTax}>+ {ar ? 'إضافة ضريبة' : 'Add Tax'}</button>}
          {activeTab === 'groups' && <button className="btn btn-primary" onClick={openAddGroup}>+ {ar ? 'مجموعة جديدة' : 'New Group'}</button>}
          {activeTab === 'fiscal' && <button className="btn btn-primary" onClick={openAddFiscal}>+ {ar ? 'مركز مالي جديد' : 'New Position'}</button>}
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
          {TABS.map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
              padding: '0.75rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>

        {/* ── Tab: Tax Rates ── */}
        {activeTab === 'taxes' && (
          <div className="card">
            {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div> : (
              <table className="table">
                <thead>
                  <tr>
                    <th>{ar ? 'الاسم' : 'Name'}</th>
                    <th>{ar ? 'النسبة' : 'Rate'}</th>
                    <th>{ar ? 'النوع' : 'Type'}</th>
                    <th>{ar ? 'كشف تلقائي' : 'Auto-Detect'}</th>
                    <th>{ar ? 'الحالة' : 'Status'}</th>
                    <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {taxes.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td><span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>{t.rate}%</span></td>
                      <td>
                        <span className={`badge ${t.type === 'inclusive' ? 'badge-info' : 'badge-warning'}`}>
                          {t.type === 'inclusive' ? (ar ? 'شاملة' : 'Inclusive') : (ar ? 'غير شاملة' : 'Exclusive')}
                        </span>
                      </td>
                      <td>{t.auto_detect_category ? <span className="badge badge-muted">{ar ? AUTO_CATEGORY_AR[t.auto_detect_category] : t.auto_detect_category}</span> : <span className="text-muted">—</span>}</td>
                      <td><span className={`badge ${t.is_active ? 'badge-success' : 'badge-muted'}`}>{t.is_active ? (ar ? 'فعّال' : 'Active') : (ar ? 'غير فعّال' : 'Inactive')}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEditTax(t)}>{ar ? 'تعديل' : 'Edit'}</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTax(t.id)}>{ar ? 'حذف' : 'Delete'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {taxes.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{ar ? 'لا توجد ضرائب' : 'No taxes'}</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: Tax Groups ── */}
        {activeTab === 'groups' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'اسم المجموعة' : 'Group Name'}</th>
                  <th>{ar ? 'الضرائب المشمولة' : 'Included Taxes'}</th>
                  <th>{ar ? 'إجمالي النسبة' : 'Total Rate'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => {
                  const groupTaxes = taxes.filter(t => g.tax_ids.includes(t.id))
                  const totalRate  = groupTaxes.reduce((s, t) => s + t.rate, 0)
                  return (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 600 }}>{ar ? g.name_ar : g.name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {groupTaxes.map(t => <span key={t.id} className="badge badge-info" style={{ fontSize: '0.75rem' }}>{t.name} {t.rate}%</span>)}
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>{totalRate}%</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEditGroup(g)}>{ar ? 'تعديل' : 'Edit'}</button>
                          <button className="btn btn-sm btn-danger" onClick={async () => { if (confirm(ar ? 'حذف؟' : 'Delete?')) { await api.delete(`/taxes/groups/${g.id}`); fetchAll() } }}>{ar ? 'حذف' : 'Delete'}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {groups.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{ar ? 'لا توجد مجموعات' : 'No tax groups'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab: Fiscal Positions ── */}
        {activeTab === 'fiscal' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'المركز المالي' : 'Position Name'}</th>
                  <th>{ar ? 'الدولة' : 'Country'}</th>
                  <th>{ar ? 'تطبيق تلقائي' : 'Auto Apply'}</th>
                  <th>{ar ? 'تعيينات الضرائب' : 'Tax Mappings'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {fiscalPositions.map(fp => (
                  <tr key={fp.id}>
                    <td style={{ fontWeight: 600 }}>{ar ? fp.name_ar : fp.name}</td>
                    <td>{fp.country || '—'}</td>
                    <td><span className={`badge ${fp.auto_apply ? 'badge-success' : 'badge-muted'}`}>{fp.auto_apply ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No')}</span></td>
                    <td>{fp.tax_mapping.length} {ar ? 'تعيين' : 'mapping(s)'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEditFiscal(fp)}>{ar ? 'تعديل' : 'Edit'}</button>
                        <button className="btn btn-sm btn-danger" onClick={async () => { if (confirm(ar ? 'حذف؟' : 'Delete?')) { await api.delete(`/taxes/fiscal-positions/${fp.id}`); fetchAll() } }}>{ar ? 'حذف' : 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {fiscalPositions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{ar ? 'لا توجد مراكز مالية' : 'No fiscal positions'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab: VAT Return ── */}
        {activeTab === 'vat' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>{ar ? 'اختر الفترة الضريبية' : 'Select Tax Period'}</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {periods.slice(0, 8).map(p => (
                  <button key={p.label} onClick={() => { setSelectedPeriod(p); setCustomFrom(''); setCustomTo('') }}
                    className={`btn btn-sm ${selectedPeriod?.label === p.label ? 'btn-primary' : 'btn-secondary'}`}>{p.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{ar ? 'من' : 'From'}</label>
                  <input className="form-input" type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setSelectedPeriod(null) }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{ar ? 'إلى' : 'To'}</label>
                  <input className="form-input" type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setSelectedPeriod(null) }} />
                </div>
                <button className="btn btn-primary" onClick={loadVatReport} disabled={vatLoading}>
                  {vatLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {ar ? 'جاري...' : 'Loading...'}</> : ar ? 'عرض التقرير' : 'Generate Report'}
                </button>
              </div>
            </div>

            {vatReport && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {[
                  { title: `📦 ${ar ? 'المبيعات (ضريبة المخرجات)' : 'Sales (Output VAT)'}`, color: 'var(--color-primary)', rows: [
                    { label: ar ? 'عدد الفواتير' : 'Invoice Count', value: vatReport.sales.count },
                    { label: ar ? 'صافي المبيعات' : 'Net Sales',    value: `${fmt(vatReport.sales.net_sales)} ${ar ? 'ج' : 'EGP'}` },
                    { label: ar ? 'ضريبة المخرجات' : 'Output VAT',  value: `${fmt(vatReport.sales.output_vat)} ${ar ? 'ج' : 'EGP'}`, highlight: true },
                    { label: ar ? 'إجمالي المبيعات' : 'Gross',      value: `${fmt(vatReport.sales.gross)} ${ar ? 'ج' : 'EGP'}` },
                  ]},
                  { title: `🛒 ${ar ? 'المشتريات (ضريبة المدخلات)' : 'Purchases (Input VAT)'}`, color: 'var(--color-secondary)', rows: [
                    { label: ar ? 'عدد الفواتير' : 'Invoice Count',     value: vatReport.purchases.count },
                    { label: ar ? 'صافي المشتريات' : 'Net Purchases',   value: `${fmt(vatReport.purchases.net_purchases)} ${ar ? 'ج' : 'EGP'}` },
                    { label: ar ? 'ضريبة المدخلات' : 'Input VAT',       value: `${fmt(vatReport.purchases.input_vat)} ${ar ? 'ج' : 'EGP'}`, highlight: true },
                    { label: ar ? 'إجمالي المشتريات' : 'Gross',         value: `${fmt(vatReport.purchases.gross)} ${ar ? 'ج' : 'EGP'}` },
                  ]},
                ].map((section, si) => (
                  <div key={si} className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: section.color }}>{section.title}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {section.rows.map((row, i) => (
                        <div key={i} className="stat-card" style={(row as any).highlight ? { borderTop: `3px solid ${section.color}` } : {}}>
                          <div className="stat-value" style={(row as any).highlight ? { color: section.color } : {}}>{row.value}</div>
                          <div className="stat-label">{row.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="card" style={{ padding: '1.5rem', borderTop: `4px solid ${vatReport.summary.status === 'payable' ? 'var(--color-danger)' : 'var(--color-success)'}` }}>
                  <h3 style={{ marginBottom: '1rem' }}>📊 {ar ? 'الملخص الضريبي' : 'Tax Summary'}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    {[
                      { label: ar ? 'ضريبة المخرجات' : 'Output VAT', value: `${fmt(vatReport.summary.output_vat)} ${ar ? 'ج' : 'EGP'}`, color: 'var(--color-primary)' },
                      { label: ar ? 'ضريبة المدخلات' : 'Input VAT',  value: `${fmt(vatReport.summary.input_vat)} ${ar ? 'ج' : 'EGP'}`, color: 'var(--color-secondary)' },
                      { label: vatReport.summary.status === 'payable' ? (ar ? 'مستحق الدفع' : 'Net VAT Due') : (ar ? 'مستحق الاسترداد' : 'VAT Refund'),
                        value: `${fmt(Math.abs(vatReport.summary.net_vat_due))} ${ar ? 'ج' : 'EGP'}`,
                        color: vatReport.summary.status === 'payable' ? 'var(--color-danger)' : 'var(--color-success)' },
                    ].map((row, i) => (
                      <div key={i} className="stat-card" style={{ borderTop: `3px solid ${row.color}` }}>
                        <div className="stat-value" style={{ color: row.color }}>{row.value}</div>
                        <div className="stat-label">{row.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 700, fontSize: '1.05rem',
                    background: vatReport.summary.status === 'payable' ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                    color: vatReport.summary.status === 'payable' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {vatReport.summary.status === 'payable'
                      ? `⚠️ ${ar ? `يجب سداد ${fmt(vatReport.summary.net_vat_due)} ج` : `You owe ${fmt(vatReport.summary.net_vat_due)} EGP`}`
                      : `✅ ${ar ? `مستحق لك ${fmt(Math.abs(vatReport.summary.net_vat_due))} ج استرداد` : `You are owed ${fmt(Math.abs(vatReport.summary.net_vat_due))} EGP refund`}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Audit Trail ── */}
        {activeTab === 'audit' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'الإجراء' : 'Action'}</th>
                  <th>{ar ? 'الكيان' : 'Entity'}</th>
                  <th>{ar ? 'المستخدم' : 'User'}</th>
                  <th>{ar ? 'التغييرات' : 'Changes'}</th>
                  <th>{ar ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span className={`badge ${log.action === 'create' ? 'badge-success' : log.action === 'delete' ? 'badge-danger' : 'badge-warning'}`}>
                        {log.action === 'create' ? (ar ? 'إنشاء' : 'Create') : log.action === 'delete' ? (ar ? 'حذف' : 'Delete') : (ar ? 'تعديل' : 'Update')}
                      </span>
                    </td>
                    <td>{log.entity} #{log.entity_id}</td>
                    <td style={{ fontWeight: 600 }}>{log.user_name}</td>
                    <td style={{ maxWidth: 250, fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.changes}</td>
                    <td>{new Date(log.created_at).toLocaleString(ar ? 'ar-EG' : 'en-US')}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{ar ? 'لا توجد سجلات' : 'No audit logs'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ Modal: Add/Edit Tax ══ */}
        {taxModal && (
          <div className="modal-overlay" onClick={() => setTaxModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header">
                <h2>{editTax ? (ar ? 'تعديل الضريبة' : 'Edit Tax') : (ar ? 'إضافة ضريبة' : 'Add Tax')}</h2>
                <button className="modal-close" onClick={() => setTaxModal(false)}>×</button>
              </div>
              <form onSubmit={handleSaveTax}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">{ar ? 'اسم الضريبة *' : 'Tax Name *'}</label>
                    <input className="form-input" value={taxForm.name} onChange={e => setTaxForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'النسبة (%) *' : 'Rate (%) *'}</label>
                      <input className="form-input" type="number" step="0.01" min={0} max={100} value={taxForm.rate} onChange={e => setTaxForm(f => ({ ...f, rate: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'النوع' : 'Type'}</label>
                      <select className="form-select" value={taxForm.type} onChange={e => setTaxForm(f => ({ ...f, type: e.target.value as any }))}>
                        <option value="exclusive">{ar ? 'غير شاملة (Exclusive)' : 'Exclusive'}</option>
                        <option value="inclusive">{ar ? 'شاملة (Inclusive)' : 'Inclusive'}</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'كشف تلقائي حسب الفئة' : 'Auto-Detect by Category'}</label>
                    <select className="form-select" value={taxForm.auto_detect_category} onChange={e => setTaxForm(f => ({ ...f, auto_detect_category: e.target.value }))}>
                      <option value="">{ar ? 'بدون كشف تلقائي' : 'No Auto-Detect'}</option>
                      {AUTO_CATEGORIES.map(c => <option key={c} value={c}>{ar ? AUTO_CATEGORY_AR[c] : c}</option>)}
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={taxForm.is_active} onChange={e => setTaxForm(f => ({ ...f, is_active: e.target.checked }))} />
                    {ar ? 'فعّال' : 'Active'}
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setTaxModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: Tax Group ══ */}
        {groupModal && (
          <div className="modal-overlay" onClick={() => setGroupModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h2>{editGroup ? (ar ? 'تعديل المجموعة' : 'Edit Group') : (ar ? 'مجموعة جديدة' : 'New Tax Group')}</h2>
                <button className="modal-close" onClick={() => setGroupModal(false)}>×</button>
              </div>
              <form onSubmit={handleSaveGroup}>
                <div className="modal-body">
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الاسم بالعربية *' : 'Arabic Name *'}</label>
                      <input className="form-input" value={groupForm.name_ar} onChange={e => setGroupForm(f => ({ ...f, name_ar: e.target.value }))} required={ar} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الاسم بالإنجليزية *' : 'English Name *'}</label>
                      <input className="form-input" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{ar ? 'الضرائب المشمولة' : 'Included Taxes'}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      {taxes.map(t => (
                        <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={groupForm.tax_ids.includes(t.id)} onChange={() => toggleTaxInGroup(t.id)} />
                          <span>{t.name}</span>
                          <span style={{ marginRight: 'auto', fontWeight: 700, color: 'var(--color-primary)' }}>{t.rate}%</span>
                        </label>
                      ))}
                    </div>
                    {groupForm.tax_ids.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {ar ? 'الإجمالي:' : 'Total:'} <strong>{taxes.filter(t => groupForm.tax_ids.includes(t.id)).reduce((s, t) => s + t.rate, 0)}%</strong>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setGroupModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Modal: Fiscal Position ══ */}
        {fiscalModal && (
          <div className="modal-overlay" onClick={() => setFiscalModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
              <div className="modal-header">
                <h2>{editFiscal ? (ar ? 'تعديل المركز المالي' : 'Edit Fiscal Position') : (ar ? 'مركز مالي جديد' : 'New Fiscal Position')}</h2>
                <button className="modal-close" onClick={() => setFiscalModal(false)}>×</button>
              </div>
              <form onSubmit={handleSaveFiscal}>
                <div className="modal-body">
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الاسم بالعربية *' : 'Arabic Name *'}</label>
                      <input className="form-input" value={fiscalForm.name_ar} onChange={e => setFiscalForm(f => ({ ...f, name_ar: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الاسم بالإنجليزية *' : 'English Name *'}</label>
                      <input className="form-input" value={fiscalForm.name} onChange={e => setFiscalForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{ar ? 'الدولة / المنطقة' : 'Country / Region'}</label>
                      <input className="form-input" value={fiscalForm.country} onChange={e => setFiscalForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. Egypt, EU..." />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={fiscalForm.auto_apply} onChange={e => setFiscalForm(f => ({ ...f, auto_apply: e.target.checked }))} />
                        {ar ? 'تطبيق تلقائي' : 'Auto Apply'}
                      </label>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600 }}>{ar ? 'تعيينات الضرائب' : 'Tax Mappings'}</span>
                      <button type="button" className="btn btn-sm btn-secondary" onClick={addMapping}>+ {ar ? 'إضافة' : 'Add'}</button>
                    </div>
                    {fiscalForm.tax_mapping.map((mapping, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <select className="form-select" value={mapping.from_tax_id} onChange={e => updateMapping(i, 'from_tax_id', Number(e.target.value))}>
                          <option value={0}>{ar ? 'من ضريبة' : 'From Tax'}</option>
                          {taxes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <span>→</span>
                        <select className="form-select" value={mapping.to_tax_id} onChange={e => updateMapping(i, 'to_tax_id', Number(e.target.value))}>
                          <option value={0}>{ar ? 'إلى ضريبة' : 'To Tax'}</option>
                          {taxes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removeMapping(i)}>×</button>
                      </div>
                    ))}
                    {fiscalForm.tax_mapping.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>{ar ? 'لا توجد تعيينات' : 'No mappings yet'}</div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setFiscalModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}