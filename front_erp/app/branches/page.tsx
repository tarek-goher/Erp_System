'use client'

// ══════════════════════════════════════════════════════════
// app/branches/page.tsx — صفحة الفروع (NEW)
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET    /api/branches           → قائمة الفروع
//   POST   /api/branches           → إضافة فرع
//   PATCH  /api/branches/{id}      → تعديل فرع
//   DELETE /api/branches/{id}      → حذف فرع
//   GET    /api/branches/{id}/stats → إحصائيات فرع
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Branch = {
  id: number
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  manager_name?: string
  city?: string
  status: 'active' | 'inactive'
  employees_count?: number
  monthly_sales?: number
  created_at: string
}

const TABS = ['list', 'stats']

export default function BranchesPage() {
  const { lang } = useI18n()

  const [branches, setBranches] = useState<Branch[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(false)
  const [editItem, setEditItem] = useState<Branch | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')
  const [activeTab, setActiveTab] = useState('list')

  const emptyForm = { name: '', code: '', address: '', phone: '', email: '', manager_name: '', city: '', status: 'active' as const }
  const [form, setForm] = useState(emptyForm)

  const fetchBranches = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '50', ...(search && { search }) })
    const res = await api.get<{ data: Branch[] }>(`/branches?${p}`)
    if (res.data) setBranches(res.data.data || res.data as any || [])
    setLoading(false)
  }

  useEffect(() => { fetchBranches() }, [search])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setFormErr('')
    setModal(true)
  }

  const openEdit = (b: Branch) => {
    setEditItem(b)
    setForm({
      name: b.name, code: b.code, address: b.address || '',
      phone: b.phone || '', email: b.email || '',
      manager_name: b.manager_name || '', city: b.city || '',
      status: b.status,
    })
    setFormErr('')
    setModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormErr('')
    if (!form.name.trim()) { setFormErr(lang === 'ar' ? 'اسم الفرع مطلوب' : 'Branch name is required'); return }
    if (!form.code.trim()) { setFormErr(lang === 'ar' ? 'كود الفرع مطلوب' : 'Branch code is required'); return }
    setSaving(true)
    const payload = { ...form }
    const res = editItem
      ? await api.patch(`/branches/${editItem.id}`, payload)
      : await api.post('/branches', payload)
    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    fetchBranches()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/branches/${deleteId}`)
    setDeleteId(null)
    setBranches(prev => prev.filter(b => b.id !== deleteId))
  }

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')

  const activeBranches   = branches.filter(b => b.status === 'active').length
  const inactiveBranches = branches.filter(b => b.status === 'inactive').length
  const totalEmployees   = branches.reduce((s, b) => s + (b.employees_count || 0), 0)
  const totalSales       = branches.reduce((s, b) => s + (b.monthly_sales || 0), 0)

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'الفروع' : 'Branches'}>

      {/* ── Tabs ── */}
      <div className="tabs">
        {[
          { key: 'list',  ar: 'قائمة الفروع',    en: 'Branch List'  },
          { key: 'stats', ar: 'إحصائيات الفروع', en: 'Branch Stats' },
        ].map(tab => (
          <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {lang === 'ar' ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* ══ تاب القائمة ══ */}
      {activeTab === 'list' && (
        <>
          <div className="toolbar">
            <div className="search-bar">
              <span>🔍</span>
              <input
                placeholder={lang === 'ar' ? 'بحث في الفروع...' : 'Search branches...'}
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openAdd}>
              + {lang === 'ar' ? 'فرع جديد' : 'New Branch'}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}
              </div>
            ) : branches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <p className="empty-state-text">{lang === 'ar' ? 'لا توجد فروع بعد' : 'No branches yet'}</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>
                  + {lang === 'ar' ? 'أضف أول فرع' : 'Add First Branch'}
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{lang === 'ar' ? 'اسم الفرع' : 'Branch Name'}</th>
                      <th>{lang === 'ar' ? 'الكود' : 'Code'}</th>
                      <th>{lang === 'ar' ? 'المدينة' : 'City'}</th>
                      <th>{lang === 'ar' ? 'المدير' : 'Manager'}</th>
                      <th>{lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
                      <th>{lang === 'ar' ? 'الموظفون' : 'Employees'}</th>
                      <th>{lang === 'ar' ? 'مبيعات الشهر' : 'Monthly Sales'}</th>
                      <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div className="fw-semibold">{b.name}</div>
                          {b.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.address}</div>}
                        </td>
                        <td><span className="badge badge-muted">{b.code}</span></td>
                        <td>{b.city || '—'}</td>
                        <td>{b.manager_name || '—'}</td>
                        <td className="text-muted">{b.phone || '—'}</td>
                        <td className="fw-semibold">{fmt(b.employees_count || 0)}</td>
                        <td className="fw-semibold">{fmt(b.monthly_sales || 0)}</td>
                        <td>
                          <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                            {b.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>
                              {lang === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(b.id)}>
                              {lang === 'ar' ? 'حذف' : 'Delete'}
                            </button>
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

      {/* ══ تاب الإحصائيات ══ */}
      {activeTab === 'stats' && (
        <>
          {/* ملخص عام */}
          <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
            {[
              { icon: '🏢', label: lang === 'ar' ? 'إجمالي الفروع'  : 'Total Branches',    value: fmt(branches.length),   color: 'stat-blue'   },
              { icon: '✅', label: lang === 'ar' ? 'فروع نشطة'       : 'Active Branches',   value: fmt(activeBranches),    color: 'stat-green'  },
              { icon: '⏸️', label: lang === 'ar' ? 'فروع غير نشطة'  : 'Inactive Branches', value: fmt(inactiveBranches),  color: 'stat-yellow' },
              { icon: '👥', label: lang === 'ar' ? 'إجمالي الموظفين' : 'Total Employees',   value: fmt(totalEmployees),    color: 'stat-purple' },
              { icon: '💰', label: lang === 'ar' ? 'مبيعات الشهر'   : 'Monthly Sales',     value: fmt(totalSales),        color: 'stat-orange' },
            ].map(card => (
              <div key={card.label} className="stat-card">
                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                <div>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* جدول مقارنة الفروع */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)' }}>
              <h3 className="fw-bold">{lang === 'ar' ? 'مقارنة أداء الفروع' : 'Branch Performance Comparison'}</h3>
            </div>
            {loading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
              </div>
            ) : branches.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📊</div><p className="empty-state-text">{lang === 'ar' ? 'لا توجد فروع' : 'No branches'}</p></div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
                      <th>{lang === 'ar' ? 'الموظفون' : 'Employees'}</th>
                      <th>{lang === 'ar' ? 'مبيعات الشهر' : 'Monthly Sales'}</th>
                      <th>{lang === 'ar' ? 'متوسط المبيعات/موظف' : 'Sales/Employee'}</th>
                      <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...branches].sort((a, b) => (b.monthly_sales || 0) - (a.monthly_sales || 0)).map(b => {
                      const perEmp = b.employees_count ? Math.round((b.monthly_sales || 0) / b.employees_count) : 0
                      return (
                        <tr key={b.id}>
                          <td>
                            <div className="fw-semibold">{b.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.city || b.code}</div>
                          </td>
                          <td>{fmt(b.employees_count || 0)}</td>
                          <td className="fw-semibold">{fmt(b.monthly_sales || 0)}</td>
                          <td className="text-muted">{perEmp ? fmt(perEmp) : '—'}</td>
                          <td>
                            <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                              {b.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ Modal: إضافة / تعديل فرع ══ */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editItem
                  ? (lang === 'ar' ? 'تعديل الفرع' : 'Edit Branch')
                  : (lang === 'ar' ? 'فرع جديد' : 'New Branch')
                }
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'اسم الفرع' : 'Branch Name'} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'كود الفرع' : 'Branch Code'} *</label>
                    <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. BR-001" required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'المدينة' : 'City'}</label>
                    <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الهاتف' : 'Phone'}</label>
                    <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'اسم المدير' : 'Manager Name'}</label>
                    <input className="input" value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{lang === 'ar' ? 'العنوان التفصيلي' : 'Full Address'}</label>
                    <textarea className="input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ resize: 'vertical' }} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الحالة' : 'Status'}</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                      <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                      <option value="inactive">{lang === 'ar' ? 'غير نشط' : 'Inactive'}</option>
                    </select>
                  </div>
                </div>
                {formErr && <div className="login-error" style={{ marginTop: '1rem' }}><span>⚠️</span> {formErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</> : (lang === 'ar' ? 'حفظ' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏢</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{lang === 'ar' ? 'حذف الفرع؟' : 'Delete Branch?'}</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                {lang === 'ar' ? 'سيتم حذف جميع بيانات الفرع. لا يمكن التراجع.' : 'All branch data will be deleted. Cannot be undone.'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{lang === 'ar' ? 'حذف' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

    </ERPLayout>
  )
}
