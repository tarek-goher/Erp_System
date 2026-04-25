'use client'

// ══════════════════════════════════════════════════════════
// app/branches/page.tsx — صفحة الفروع (Enhanced)
// NEW: Branch Permissions, Inter-Branch Transactions,
//      Stock Transfers, Consolidated + Separate Reports
// API: GET/POST      /api/branches
//      PATCH/DELETE  /api/branches/{id}
//      GET           /api/branches/{id}/stats
//      GET/POST      /api/branches/transfers
//      PATCH         /api/branches/transfers/{id}/status
//      GET           /api/branches/reports/consolidated
//      GET/POST/PUT/DELETE /api/branches/permissions
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Branch = {
  id: number; name: string; code: string; address?: string; phone?: string
  email?: string; manager_name?: string; city?: string; status: 'active' | 'inactive'
  employees_count?: number; monthly_sales?: number; created_at: string
}
type Transfer = {
  id: number; from_branch_id: number; to_branch_id: number
  from_branch_name: string; to_branch_name: string
  product_name: string; quantity: number; unit: string
  status: 'pending' | 'approved' | 'in_transit' | 'received' | 'rejected'
  notes?: string; created_at: string
}
type Permission = {
  id: number; branch_id: number; branch_name: string
  user_name: string; role: string; can_view_reports: boolean
  can_manage_inventory: boolean; can_process_sales: boolean
}
type ConsolidatedReport = {
  period: string; total_sales: number; total_expenses: number; net_profit: number
  branches: { id: number; name: string; sales: number; expenses: number; profit: number; profit_pct: number }[]
}

const TRANSFER_STATUS_CFG: Record<string, { ar: string; en: string; badge: string }> = {
  pending:    { ar: 'معلق',       en: 'Pending',    badge: 'badge-warning' },
  approved:   { ar: 'معتمد',      en: 'Approved',   badge: 'badge-info' },
  in_transit: { ar: 'في الطريق', en: 'In Transit',  badge: 'badge-warning' },
  received:   { ar: 'تم الاستلام', en: 'Received',  badge: 'badge-success' },
  rejected:   { ar: 'مرفوض',      en: 'Rejected',   badge: 'badge-danger' },
}

export default function BranchesPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [activeTab, setActiveTab] = useState<'list' | 'transfers' | 'reports' | 'permissions'>('list')
  const [branches,     setBranches]     = useState<Branch[]>([])
  const [transfers,    setTransfers]    = useState<Transfer[]>([])
  const [permissions,  setPermissions]  = useState<Permission[]>([])
  const [consolidated, setConsolidated] = useState<ConsolidatedReport | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [saving,     setSaving]     = useState(false)

  // Modals
  const [branchModal,     setBranchModal]     = useState(false)
  const [transferModal,   setTransferModal]   = useState(false)
  const [permissionModal, setPermissionModal] = useState(false)
  const [deleteId,        setDeleteId]        = useState<number | null>(null)
  const [editItem,        setEditItem]        = useState<Branch | null>(null)
  const [editPermission,  setEditPermission]  = useState<Permission | null>(null)
  const [formErr,         setFormErr]         = useState('')

  const emptyBranchForm = { name: '', code: '', address: '', phone: '', email: '', manager_name: '', city: '', status: 'active' as const }
  const [branchForm, setBranchForm] = useState(emptyBranchForm)
  const [transferForm, setTransferForm] = useState({ from_branch_id: '', to_branch_id: '', product_name: '', quantity: '', unit: '', notes: '' })
  const [permissionForm, setPermissionForm] = useState({ branch_id: '', user_name: '', role: 'viewer', can_view_reports: false, can_manage_inventory: false, can_process_sales: false })
  const [reportPeriod, setReportPeriod] = useState('this_month')

  const fetchBranches = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '50', ...(search && { search }) })
    const res = await api.get<{ data: Branch[] }>(`/branches?${p}`)
    if (res.data) setBranches((res.data as any).data || res.data || [])
    setLoading(false)
  }

  const fetchTransfers = async () => {
    const res = await api.get<Transfer[]>('/branches/transfers')
    if (res.data) setTransfers(Array.isArray(res.data) ? res.data : [])
  }

  const fetchPermissions = async () => {
    const res = await api.get<Permission[]>('/branches/permissions')
    if (res.data) setPermissions(Array.isArray(res.data) ? res.data : [])
  }

  const fetchConsolidated = async () => {
    const res = await api.get<ConsolidatedReport>(`/branches/reports/consolidated?period=${reportPeriod}`)
    if (res.data) setConsolidated(res.data)
  }

  useEffect(() => { fetchBranches() }, [search])
  useEffect(() => { if (activeTab === 'transfers')   fetchTransfers() },   [activeTab])
  useEffect(() => { if (activeTab === 'permissions') fetchPermissions() }, [activeTab])
  useEffect(() => { if (activeTab === 'reports')     fetchConsolidated() }, [activeTab, reportPeriod])

  // Branch CRUD
  const openAdd  = () => { setEditItem(null); setBranchForm(emptyBranchForm); setFormErr(''); setBranchModal(true) }
  const openEdit = (b: Branch) => { setEditItem(b); setBranchForm({ name: b.name, code: b.code, address: b.address || '', phone: b.phone || '', email: b.email || '', manager_name: b.manager_name || '', city: b.city || '', status: b.status }); setFormErr(''); setBranchModal(true) }

  const handleBranchSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!branchForm.name) { setFormErr(ar ? 'اسم الفرع مطلوب' : 'Branch name required'); return }
    setSaving(true)
    const res = editItem ? await api.patch(`/branches/${editItem.id}`, branchForm) : await api.post('/branches', branchForm)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setBranchModal(false); fetchBranches()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/branches/${deleteId}`); setDeleteId(null); setBranches(prev => prev.filter(b => b.id !== deleteId))
  }

  // Transfer
  const handleTransferSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await api.post('/branches/transfers', { ...transferForm, from_branch_id: Number(transferForm.from_branch_id), to_branch_id: Number(transferForm.to_branch_id), quantity: Number(transferForm.quantity) })
    setSaving(false); if (!res.error) { setTransferModal(false); fetchTransfers() }
  }

  const updateTransferStatus = async (id: number, status: string) => {
    await api.patch(`/branches/transfers/${id}/status`, { status }); fetchTransfers()
  }

  // Permission
  const handlePermissionSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true)
    const body = { ...permissionForm, branch_id: Number(permissionForm.branch_id) }
    const res = editPermission ? await api.put(`/branches/permissions/${editPermission.id}`, body) : await api.post('/branches/permissions', body)
    setSaving(false); if (!res.error) { setPermissionModal(false); fetchPermissions() }
  }

  const fmt     = (n: number) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US')

  const activeBranches = branches.filter(b => b.status === 'active').length
  const totalSales     = branches.reduce((s, b) => s + (b.monthly_sales || 0), 0)
  const totalEmployees = branches.reduce((s, b) => s + (b.employees_count || 0), 0)

  return (
    <ERPLayout pageTitle={ar ? 'الفروع' : 'Branches'}>
      <div className="page-header">
        <h1 className="page-title">{ar ? 'الفروع' : 'Branches'}</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'list'        && <button className="btn btn-primary" onClick={openAdd}>+ {ar ? 'فرع جديد' : 'New Branch'}</button>}
          {activeTab === 'transfers'   && <button className="btn btn-primary" onClick={() => setTransferModal(true)}>+ {ar ? 'تحويل مخزون' : 'Stock Transfer'}</button>}
          {activeTab === 'permissions' && <button className="btn btn-primary" onClick={() => { setEditPermission(null); setPermissionForm({ branch_id: '', user_name: '', role: 'viewer', can_view_reports: false, can_manage_inventory: false, can_process_sales: false }); setPermissionModal(true) }}>+ {ar ? 'صلاحية جديدة' : 'New Permission'}</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {([
          ['list',        ar ? 'قائمة الفروع'      : 'Branch List'],
          ['transfers',   ar ? 'تحويل المخزون'     : 'Stock Transfers'],
          ['reports',     ar ? 'التقارير الموحدة'  : 'Consolidated Reports'],
          ['permissions', ar ? 'صلاحيات الفروع'    : 'Branch Permissions'],
        ] as const).map(([t, label]) => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
        ))}
      </div>

      {/* ══ Tab: Branch List ══ */}
      {activeTab === 'list' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
            {[
              { label: ar ? 'إجمالي الفروع' : 'Total',            value: fmt(branches.length),  color: '#2563eb' },
              { label: ar ? 'فروع نشطة' : 'Active',               value: fmt(activeBranches),    color: '#16a34a' },
              { label: ar ? 'إجمالي الموظفين' : 'Employees',      value: fmt(totalEmployees),    color: '#7c3aed' },
              { label: ar ? 'مبيعات الشهر' : 'Monthly Sales',     value: fmt(totalSales),        color: '#d97706' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="search-bar"><span>🔍</span><input placeholder={ar ? 'بحث في الفروع...' : 'Search branches...'} value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div>
             : branches.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🏢</div><p className="empty-state-text">{ar ? 'لا توجد فروع' : 'No branches yet'}</p></div>
             : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{ar ? 'اسم الفرع' : 'Branch'}</th>
                      <th>{ar ? 'الكود' : 'Code'}</th>
                      <th>{ar ? 'المدينة' : 'City'}</th>
                      <th>{ar ? 'المدير' : 'Manager'}</th>
                      <th>{ar ? 'الموظفون' : 'Emp.'}</th>
                      <th>{ar ? 'مبيعات الشهر' : 'Mo. Sales'}</th>
                      <th>{ar ? 'الحالة' : 'Status'}</th>
                      <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(b => (
                      <tr key={b.id}>
                        <td><div className="fw-semibold">{b.name}</div>{b.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.address}</div>}</td>
                        <td><span className="badge badge-muted">{b.code}</span></td>
                        <td>{b.city || '—'}</td>
                        <td>{b.manager_name || '—'}</td>
                        <td className="fw-semibold">{fmt(b.employees_count || 0)}</td>
                        <td className="fw-semibold">{fmt(b.monthly_sales || 0)}</td>
                        <td><span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{b.status === 'active' ? (ar ? 'نشط' : 'Active') : (ar ? 'غير نشط' : 'Inactive')}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>{ar ? 'تعديل' : 'Edit'}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(b.id)}>{ar ? 'حذف' : 'Delete'}</button>
                          </div>
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

      {/* ══ Tab: Stock Transfers ══ */}
      {activeTab === 'transfers' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'من فرع' : 'From Branch'}</th>
                  <th>{ar ? 'إلى فرع' : 'To Branch'}</th>
                  <th>{ar ? 'المنتج' : 'Product'}</th>
                  <th>{ar ? 'الكمية' : 'Qty'}</th>
                  <th>{ar ? 'الحالة' : 'Status'}</th>
                  <th>{ar ? 'التاريخ' : 'Date'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => {
                  const cfg = TRANSFER_STATUS_CFG[t.status]
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.from_branch_name}</td>
                      <td style={{ fontWeight: 600 }}>{t.to_branch_name}</td>
                      <td>{t.product_name}</td>
                      <td>{fmt(t.quantity)} {t.unit}</td>
                      <td><span className={`badge ${cfg.badge}`}>{ar ? cfg.ar : cfg.en}</span></td>
                      <td>{fmtDate(t.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {t.status === 'pending' && (
                            <>
                              <button className="btn btn-sm btn-success" onClick={() => updateTransferStatus(t.id, 'approved')}>{ar ? 'اعتماد' : 'Approve'}</button>
                              <button className="btn btn-sm btn-danger" onClick={() => updateTransferStatus(t.id, 'rejected')}>{ar ? 'رفض' : 'Reject'}</button>
                            </>
                          )}
                          {t.status === 'approved' && <button className="btn btn-sm btn-primary" onClick={() => updateTransferStatus(t.id, 'in_transit')}>{ar ? 'في الطريق' : 'Mark In Transit'}</button>}
                          {t.status === 'in_transit' && <button className="btn btn-sm btn-success" onClick={() => updateTransferStatus(t.id, 'received')}>{ar ? 'تم الاستلام' : 'Mark Received'}</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {transfers.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد تحويلات' : 'No transfers'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ Tab: Consolidated Reports ══ */}
      {activeTab === 'reports' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{ar ? 'الفترة:' : 'Period:'}</span>
            {[
              { key: 'this_month',  ar: 'هذا الشهر',     en: 'This Month' },
              { key: 'last_month',  ar: 'الشهر الماضي',  en: 'Last Month' },
              { key: 'this_quarter',ar: 'هذا الربع',     en: 'This Quarter' },
              { key: 'this_year',   ar: 'هذا العام',     en: 'This Year' },
            ].map(p => (
              <button key={p.key} className={`btn btn-sm ${reportPeriod === p.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setReportPeriod(p.key)}>{ar ? p.ar : p.en}</button>
            ))}
          </div>

          {consolidated ? (
            <>
              {/* Summary */}
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                  { label: ar ? 'إجمالي المبيعات' : 'Total Sales',    value: fmt(consolidated.total_sales),    color: '#2563eb' },
                  { label: ar ? 'إجمالي المصروفات' : 'Total Expenses',value: fmt(consolidated.total_expenses), color: '#dc2626' },
                  { label: ar ? 'صافي الربح' : 'Net Profit',          value: fmt(consolidated.net_profit),     color: '#16a34a' },
                ].map((s, i) => (
                  <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Per-branch breakdown */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', fontWeight: 700 }}>
                  {ar ? 'أداء كل فرع منفصلاً' : 'Per-Branch Performance'}
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{ar ? 'الفرع' : 'Branch'}</th>
                        <th>{ar ? 'المبيعات' : 'Sales'}</th>
                        <th>{ar ? 'المصروفات' : 'Expenses'}</th>
                        <th>{ar ? 'الربح' : 'Profit'}</th>
                        <th>{ar ? 'هامش الربح' : 'Margin'}</th>
                        <th>{ar ? 'الحصة من الإجمالي' : 'Share'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(consolidated.branches || [])].sort((a, b) => b.sales - a.sales).map(b => {
                        const share = consolidated.total_sales ? Math.round((b.sales / consolidated.total_sales) * 100) : 0
                        return (
                          <tr key={b.id}>
                            <td style={{ fontWeight: 600 }}>{b.name}</td>
                            <td>{fmt(b.sales)}</td>
                            <td>{fmt(b.expenses)}</td>
                            <td style={{ fontWeight: 700, color: b.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(b.profit)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 60, height: 6, background: 'var(--bg-page)', borderRadius: 999 }}>
                                  <div style={{ width: `${Math.max(0, b.profit_pct)}%`, height: '100%', background: b.profit_pct >= 0 ? '#16a34a' : '#dc2626', borderRadius: 999 }} />
                                </div>
                                <span style={{ fontWeight: 600, color: b.profit_pct >= 0 ? '#16a34a' : '#dc2626', fontSize: '0.85rem' }}>{b.profit_pct}%</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 60, height: 6, background: 'var(--bg-page)', borderRadius: 999 }}>
                                  <div style={{ width: `${share}%`, height: '100%', background: '#2563eb', borderRadius: 999 }} />
                                </div>
                                <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.85rem' }}>{share}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><div className="spinner" /></div>}
        </div>
      )}

      {/* ══ Tab: Permissions ══ */}
      {activeTab === 'permissions' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{ar ? 'الفرع' : 'Branch'}</th>
                  <th>{ar ? 'المستخدم' : 'User'}</th>
                  <th>{ar ? 'الدور' : 'Role'}</th>
                  <th>{ar ? 'التقارير' : 'Reports'}</th>
                  <th>{ar ? 'المخزون' : 'Inventory'}</th>
                  <th>{ar ? 'المبيعات' : 'Sales'}</th>
                  <th>{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.branch_name}</td>
                    <td>{p.user_name}</td>
                    <td><span className="badge badge-info">{p.role}</span></td>
                    <td>{p.can_view_reports ? '✅' : '❌'}</td>
                    <td>{p.can_manage_inventory ? '✅' : '❌'}</td>
                    <td>{p.can_process_sales ? '✅' : '❌'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setEditPermission(p); setPermissionForm({ branch_id: String(p.branch_id), user_name: p.user_name, role: p.role, can_view_reports: p.can_view_reports, can_manage_inventory: p.can_manage_inventory, can_process_sales: p.can_process_sales }); setPermissionModal(true) }}>{ar ? 'تعديل' : 'Edit'}</button>
                        <button className="btn btn-sm btn-danger" onClick={async () => { if (confirm(ar ? 'حذف؟' : 'Delete?')) { await api.delete(`/branches/permissions/${p.id}`); fetchPermissions() } }}>{ar ? 'حذف' : 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {permissions.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{ar ? 'لا توجد صلاحيات' : 'No permissions'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ Modal: Branch ══ */}
      {branchModal && (
        <div className="modal-overlay" onClick={() => setBranchModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? (ar ? 'تعديل الفرع' : 'Edit Branch') : (ar ? 'فرع جديد' : 'New Branch')}</h3>
              <button className="btn-icon" onClick={() => setBranchModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBranchSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group"><label className="input-label">{ar ? 'اسم الفرع' : 'Branch Name'} *</label><input className="input" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} required autoFocus /></div>
                  <div className="input-group"><label className="input-label">{ar ? 'كود الفرع' : 'Branch Code'} *</label><input className="input" value={branchForm.code} onChange={e => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })} required /></div>
                  <div className="input-group"><label className="input-label">{ar ? 'المدينة' : 'City'}</label><input className="input" value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} /></div>
                  <div className="input-group"><label className="input-label">{ar ? 'الهاتف' : 'Phone'}</label><input className="input" value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
                  <div className="input-group"><label className="input-label">{ar ? 'البريد الإلكتروني' : 'Email'}</label><input className="input" type="email" value={branchForm.email} onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} /></div>
                  <div className="input-group"><label className="input-label">{ar ? 'اسم المدير' : 'Manager Name'}</label><input className="input" value={branchForm.manager_name} onChange={e => setBranchForm({ ...branchForm, manager_name: e.target.value })} /></div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}><label className="input-label">{ar ? 'العنوان التفصيلي' : 'Full Address'}</label><textarea className="input" rows={2} value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} style={{ resize: 'vertical' }} /></div>
                  <div className="input-group"><label className="input-label">{ar ? 'الحالة' : 'Status'}</label><select className="input" value={branchForm.status} onChange={e => setBranchForm({ ...branchForm, status: e.target.value as any })}><option value="active">{ar ? 'نشط' : 'Active'}</option><option value="inactive">{ar ? 'غير نشط' : 'Inactive'}</option></select></div>
                </div>
                {formErr && <div className="login-error" style={{ marginTop: '1rem' }}><span>⚠️</span> {formErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBranchModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Modal: Transfer ══ */}
      {transferModal && (
        <div className="modal-overlay" onClick={() => setTransferModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header"><h3 className="modal-title">📦 {ar ? 'تحويل مخزون' : 'Stock Transfer'}</h3><button className="btn-icon" onClick={() => setTransferModal(false)}>✕</button></div>
            <form onSubmit={handleTransferSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{ar ? 'من فرع *' : 'From Branch *'}</label>
                    <select className="input" value={transferForm.from_branch_id} onChange={e => setTransferForm(f => ({ ...f, from_branch_id: e.target.value }))} required>
                      <option value="">{ar ? 'اختر' : 'Select'}</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'إلى فرع *' : 'To Branch *'}</label>
                    <select className="input" value={transferForm.to_branch_id} onChange={e => setTransferForm(f => ({ ...f, to_branch_id: e.target.value }))} required>
                      <option value="">{ar ? 'اختر' : 'Select'}</option>
                      {branches.filter(b => b.id !== Number(transferForm.from_branch_id)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar ? 'المنتج *' : 'Product *'}</label>
                    <input className="input" value={transferForm.product_name} onChange={e => setTransferForm(f => ({ ...f, product_name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الكمية *' : 'Quantity *'}</label>
                    <input className="input" type="number" min={1} value={transferForm.quantity} onChange={e => setTransferForm(f => ({ ...f, quantity: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الوحدة' : 'Unit'}</label>
                    <input className="input" value={transferForm.unit} onChange={e => setTransferForm(f => ({ ...f, unit: e.target.value }))} placeholder={ar ? 'قطعة، كجم...' : 'pcs, kg...'} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar ? 'ملاحظات' : 'Notes'}</label>
                    <textarea className="input" rows={2} value={transferForm.notes} onChange={e => setTransferForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setTransferModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'إرسال الطلب' : 'Submit Transfer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Modal: Permission ══ */}
      {permissionModal && (
        <div className="modal-overlay" onClick={() => setPermissionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header"><h3 className="modal-title">🔒 {editPermission ? (ar ? 'تعديل صلاحية' : 'Edit Permission') : (ar ? 'صلاحية جديدة' : 'New Permission')}</h3><button className="btn-icon" onClick={() => setPermissionModal(false)}>✕</button></div>
            <form onSubmit={handlePermissionSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الفرع *' : 'Branch *'}</label>
                    <select className="input" value={permissionForm.branch_id} onChange={e => setPermissionForm(f => ({ ...f, branch_id: e.target.value }))} required>
                      <option value="">{ar ? 'اختر' : 'Select'}</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar ? 'الدور' : 'Role'}</label>
                    <select className="input" value={permissionForm.role} onChange={e => setPermissionForm(f => ({ ...f, role: e.target.value }))}>
                      <option value="viewer">{ar ? 'مشاهد' : 'Viewer'}</option>
                      <option value="cashier">{ar ? 'كاشير' : 'Cashier'}</option>
                      <option value="manager">{ar ? 'مدير' : 'Manager'}</option>
                      <option value="admin">{ar ? 'مسؤول' : 'Admin'}</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar ? 'اسم المستخدم *' : 'Username *'}</label>
                    <input className="input" value={permissionForm.user_name} onChange={e => setPermissionForm(f => ({ ...f, user_name: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{ar ? 'الصلاحيات التفصيلية' : 'Detailed Permissions'}</div>
                  {[
                    { key: 'can_view_reports',      ar: 'عرض التقارير',    en: 'View Reports' },
                    { key: 'can_manage_inventory',  ar: 'إدارة المخزون',   en: 'Manage Inventory' },
                    { key: 'can_process_sales',     ar: 'معالجة المبيعات', en: 'Process Sales' },
                  ].map(perm => (
                    <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={(permissionForm as any)[perm.key]} onChange={e => setPermissionForm(f => ({ ...f, [perm.key]: e.target.checked }))} />
                      {ar ? perm.ar : perm.en}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPermissionModal(false)}>{ar ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : ar ? 'حفظ' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Delete Confirm ══ */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏢</div>
              <h3>{ar ? 'حذف الفرع؟' : 'Delete Branch?'}</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>{ar ? 'لا يمكن التراجع.' : 'Cannot be undone.'}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>{ar ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{ar ? 'حذف' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </ERPLayout>
  )
}