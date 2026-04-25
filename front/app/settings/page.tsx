'use client'

// ══════════════════════════════════════════════════════════
// app/settings/page.tsx — صفحة الإعدادات
// API: GET/PATCH /api/company/settings
//      GET /api/tax-rates | GET /api/currencies
//      GET /api/roles | GET /api/users
//      GET /api/audit-logs
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

const TABS = ['company', 'categories', 'users', 'roles', 'taxes', 'currencies', 'holidays', 'notifications', 'backup', 'audit', 'security']

export default function SettingsPage() {
  const { t, lang } = useI18n()
  const [activeTab, setActiveTab] = useState('company')

  const tabLabels: Record<string, { ar: string; en: string }> = {
    company:    { ar: 'بيانات الشركة',  en: 'Company Info' },
    categories: { ar: 'إدارة الفئات',   en: 'Category Management' },
    users:      { ar: 'المستخدمون',    en: 'Users' },
    roles:      { ar: 'الأدوار والصلاحيات', en: 'Roles & Permissions' },
    taxes:      { ar: 'الضرائب',       en: 'Tax Rates' },
    currencies: { ar: 'العملات',       en: 'Currencies' },
    audit:      { ar: 'سجل الأنشطة',  en: 'Audit Log' },
    holidays:   { ar: 'العطلات الرسمية',  en: 'Holidays' },
    notifications: { ar: 'تفضيلات الإشعارات', en: 'Notifications' },
    backup:     { ar: 'النسخ الاحتياطي', en: 'Backup' },
  }

  return (
    <ERPLayout pageTitle={t('settings')}>
      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {lang === 'ar' ? tabLabels[tab].ar : tabLabels[tab].en}
          </button>
        ))}
      </div>

      {activeTab === 'company'     && <CompanySettings lang={lang} t={t} />}
      {activeTab === 'categories'  && <CategoryManagement lang={lang} t={t} />}
      {activeTab === 'users'       && <UsersSettings lang={lang} t={t} />}
      {activeTab === 'roles'       && <RolesSettings lang={lang} t={t} />}
      {activeTab === 'taxes'       && <TaxSettings lang={lang} t={t} />}
      {activeTab === 'currencies'  && <CurrenciesSettings lang={lang} t={t} />}
      {activeTab === 'audit'       && <AuditLog lang={lang} t={t} />}
      {activeTab === 'holidays'    && <HolidaysSettings lang={lang} t={t} />}
      {activeTab === 'notifications' && <NotificationPrefs lang={lang} t={t} />}
      {activeTab === 'backup'      && <BackupSettings lang={lang} t={t} />}
      {activeTab === 'security'   && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: 16, color: '#6b7280' }}>
            {lang === 'ar' ? 'إعدادات الأمان والتحقق الثنائي' : 'Security & Two-Factor Authentication settings'}
          </p>
          <a href="/settings/2fa" style={{
            display: 'inline-block', background: '#1a56db', color: '#fff',
            padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 700,
          }}>
            🔐 {lang === 'ar' ? 'إدارة التحقق الثنائي (2FA)' : 'Manage 2FA'}
          </a>
        </div>
      )}
    </ERPLayout>
  )
}

// ══════════════════════════════════════════════════════════
// بيانات الشركة — GET/PATCH /api/company/settings
// ══════════════════════════════════════════════════════════
function CompanySettings({ lang, t }: any) {
  const [form, setForm]     = useState({ name: '', email: '', phone: '', address: '', website: '', currency: '' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  useEffect(() => {
    api.get('/company/settings').then(res => {
      if (res.data?.data) {
        const d = res.data.data
        setForm({ name: d.name || '', email: d.email || '', phone: d.phone || '', address: d.address || '', website: d.website || '', currency: d.currency || '' })
      }
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setMsg('')
    setSaving(true)
    const res = await api.patch('/company/settings', form)
    setSaving(false)
    setMsg(res.error || t('saved_success'))
  }

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />

  return (
    <div className="card">
      <h3 className="fw-bold" style={{ marginBottom: '1.5rem' }}>{lang === 'ar' ? 'بيانات الشركة' : 'Company Information'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-grid form-grid-2">
          <div className="input-group">
            <label className="input-label">{lang === 'ar' ? 'اسم الشركة' : 'Company Name'}</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('email')}</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('phone')}</label>
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">{lang === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</label>
            <input className="input" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">{t('address')}</label>
            <textarea className="input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
        </div>
        {msg && <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>{msg}</div>}
        <div style={{ marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
        </div>
      </form>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// المستخدمون — GET /api/users
// ══════════════════════════════════════════════════════════
function UsersSettings({ lang, t }: any) {
  const [users,   setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users?per_page=50').then(res => {
      if (res.data) setUsers(extractArray(res.data))
      setLoading(false)
    })
  }, [])

  return (
    <div className="card" style={{ padding: 0 }}>
      {loading ? (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>{t('name')}</th><th>{t('email')}</th><th>{lang === 'ar' ? 'الدور' : 'Role'}</th><th>{t('status')}</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="fw-semibold">{u.name}</td>
                  <td className="text-muted">{u.email}</td>
                  <td>{typeof u.roles?.[0] === 'object' ? (u.roles?.[0] as any)?.name ?? '—' : (u.roles?.[0] as string || '—')}</td>
                  <td><span className={`badge ${u.is_active !== false ? 'badge-success' : 'badge-muted'}`}>{u.is_active !== false ? t('active') : t('inactive')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// الأدوار — GET /api/roles
// ══════════════════════════════════════════════════════════
function RolesSettings({ lang, t }: any) {
  const [roles,   setRoles]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/roles').then(res => {
      if (res.data) setRoles(extractArray(res.data))
      setLoading(false)
    })
  }, [])

  return (
    <div className="card" style={{ padding: 0 }}>
      {loading ? (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>{t('name')}</th><th>{lang === 'ar' ? 'الصلاحيات' : 'Permissions'}</th></tr></thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
                  <td className="fw-semibold">{role.name}</td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{role.permissions?.length ? `${role.permissions.length} ${lang === 'ar' ? 'صلاحية' : 'permissions'}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// الضرائب — GET /api/tax-rates
// ══════════════════════════════════════════════════════════
function TaxSettings({ lang, t }: any) {
  const [taxes,    setTaxes]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState({ name: '', rate: '' })
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')   // ← حالة الخطأ

  const loadTaxes = () => {
    api.get('/tax-rates').then(res => {
      if (res.data) setTaxes(extractArray(res.data))
      setLoading(false)
    })
  }

  useEffect(() => { loadTaxes() }, [])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')   // امسح أي خطأ سابق
    if (!form.name.trim()) { setFormErr(lang === 'ar' ? 'اسم الضريبة مطلوب' : 'Tax name is required'); return }
    if (!form.rate || isNaN(Number(form.rate))) { setFormErr(lang === 'ar' ? 'النسبة مطلوبة' : 'Rate is required'); return }
    setSaving(true)
    const res = await api.post('/tax-rates', { name: form.name, rate: Number(form.rate) })
    setSaving(false)
    if (res.error) {
      setFormErr(res.error)   // ← اعرض الخطأ
      return
    }
    setModal(false)
    setForm({ name: '', rate: '' })
    setFormErr('')
    loadTaxes()
  }

  return (
    <>
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <span />
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {lang === 'ar' ? 'ضريبة جديدة' : 'New Tax Rate'}</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : taxes.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💹</div><p className="empty-state-text">{t('no_data')}</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>{t('name')}</th><th>{lang === 'ar' ? 'النسبة %' : 'Rate %'}</th><th>{t('status')}</th></tr></thead>
              <tbody>
                {taxes.map(tax => (
                  <tr key={tax.id}>
                    <td className="fw-semibold">{tax.name}</td>
                    <td>{tax.rate}%</td>
                    <td><span className={`badge ${tax.is_active !== false ? 'badge-success' : 'badge-muted'}`}>{tax.is_active !== false ? t('active') : t('inactive')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{lang === 'ar' ? 'ضريبة جديدة' : 'New Tax Rate'}</h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">{t('name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'النسبة %' : 'Rate %'} *</label>
                    <input className="input" type="number" min="0" max="100" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} required />
                  </div>
                </div>
                {formErr && (
                  <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem', padding: '0.5rem', background: 'var(--color-danger-light, #fff0f0)', borderRadius: 'var(--radius-md)' }}>
                    ⚠️ {formErr}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setModal(false); setFormErr('') }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════
// العملات — GET /api/currencies
// ══════════════════════════════════════════════════════════
function CurrenciesSettings({ lang, t }: any) {
  const [currencies, setCurrencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/currencies').then(res => {
      if (res.data) setCurrencies(extractArray(res.data))
      setLoading(false)
    })
  }, [])

  return (
    <div className="card" style={{ padding: 0 }}>
      {loading ? (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>{t('name')}</th><th>{lang === 'ar' ? 'الرمز' : 'Code'}</th><th>{lang === 'ar' ? 'الرمز المختصر' : 'Symbol'}</th><th>{t('status')}</th></tr></thead>
            <tbody>
              {currencies.map(c => (
                <tr key={c.id}>
                  <td className="fw-semibold">{c.name}</td>
                  <td className="text-muted">{c.code}</td>
                  <td>{c.symbol}</td>
                  <td><span className={`badge ${c.is_active !== false ? 'badge-success' : 'badge-muted'}`}>{c.is_active !== false ? t('active') : t('inactive')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// سجل الأنشطة — GET /api/audit-logs
// ══════════════════════════════════════════════════════════
function AuditLog({ lang, t }: any) {
  const [logs,    setLogs]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/audit-logs?per_page=30').then(res => {
      if (res.data) setLogs(extractArray(res.data))
      setLoading(false)
    })
  }, [])

  const fmtDate = (d: string) => d ? new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  return (
    <div className="card" style={{ padding: 0 }}>
      {loading ? (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📋</div><p className="empty-state-text">{t('no_data')}</p></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>{lang === 'ar' ? 'المستخدم' : 'User'}</th><th>{lang === 'ar' ? 'الإجراء' : 'Action'}</th><th>{lang === 'ar' ? 'العنصر' : 'Resource'}</th><th>{t('date')}</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="fw-semibold">{log.user?.name || '—'}</td>
                  <td><span className={`badge ${log.action === 'delete' ? 'badge-danger' : log.action === 'create' ? 'badge-success' : 'badge-warning'}`}>{log.action}</span></td>
                  <td className="text-muted">{log.resource_type} #{log.resource_id}</td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{fmtDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// إدارة الفئات — GET /api/categories  POST/PUT/DELETE
// ══════════════════════════════════════════════════════════
function CategoryManagement({ lang, t }: any) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<any>(null)
  const [form, setForm]             = useState({ name: '', name_en: '', type: 'product', description: '' })
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<number | null>(null)

  const loadCategories = () => {
    setLoading(true)
    api.get('/categories?per_page=100').then(res => {
      if (res.data) setCategories(extractArray(res.data))
      setLoading(false)
    })
  }

  useEffect(() => { loadCategories() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', name_en: '', type: 'product', description: '' }); setShowForm(true) }
  const openEdit = (cat: any) => { setEditing(cat); setForm({ name: cat.name || '', name_en: cat.name_en || '', type: cat.type || 'product', description: cat.description || '' }); setShowForm(true) }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = editing
      ? await api.put(`/categories/${editing.id}`, form)
      : await api.post('/categories', form)
    setSaving(false)
    if (res.data) { setShowForm(false); loadCategories() }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'حذف هذه الفئة؟' : 'Delete this category?')) return
    setDeleting(id)
    await api.delete(`/categories/${id}`)
    setDeleting(null)
    loadCategories()
  }

  const TYPES = [
    { key: 'product', ar: 'منتج', en: 'Product' },
    { key: 'service', ar: 'خدمة', en: 'Service' },
    { key: 'expense', ar: 'مصروف', en: 'Expense' },
    { key: 'ticket', ar: 'تذكرة', en: 'Ticket' },
  ]

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 className="fw-bold">{lang === 'ar' ? 'إدارة الفئات' : 'Category Management'}</h3>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ {lang === 'ar' ? 'فئة جديدة' : 'New Category'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 className="fw-bold" style={{ marginBottom: '1rem' }}>
            {editing ? (lang === 'ar' ? 'تعديل الفئة' : 'Edit Category') : (lang === 'ar' ? 'فئة جديدة' : 'New Category')}
          </h4>
          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}</label>
                <input className="input" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'النوع' : 'Type'}</label>
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(tp => <option key={tp.key} value={tp.key}>{lang === 'ar' ? tp.ar : tp.en}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'الوصف' : 'Description'}</label>
                <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🗂️</div>
            <p className="empty-state-text">{lang === 'ar' ? 'لا توجد فئات' : 'No categories found'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</th>
                  <th>{lang === 'ar' ? 'النوع' : 'Type'}</th>
                  <th>{lang === 'ar' ? 'الوصف' : 'Description'}</th>
                  <th>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td className="fw-semibold">{cat.name}</td>
                    <td className="text-muted">{cat.name_en || '—'}</td>
                    <td><span className="badge badge-info">{cat.type || 'product'}</span></td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{cat.description || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)}>✏️</button>
                        <button className="btn btn-danger btn-sm" disabled={deleting === cat.id} onClick={() => handleDelete(cat.id)}>
                          {deleting === cat.id ? '...' : '🗑️'}
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
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// العطلات الرسمية
// ══════════════════════════════════════════════════════════
function HolidaysSettings({ lang, t }: any) {
  const ar = (a: string, e: string) => lang === 'ar' ? a : e
  const [holidays, setHolidays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', date: '', description: '' })
  const [companyId, setCompanyId] = useState<number | null>(null)

  useEffect(() => {
    const fetchCompany = async () => {
      const res = await api.get('/company/settings')
      const id = res.data?.company_id || res.data?.id || 1
      setCompanyId(id)
      const hRes = await api.get('/companies/' + id + '/holidays')
      setHolidays(extractArray(hRes.data))
      setLoading(false)
    }
    fetchCompany()
  }, [])

  const openAdd = () => { setEditing(null); setForm({ name: '', date: '', description: '' }); setModal(true) }
  const openEdit = (h: any) => { setEditing(h); setForm({ name: h.name, date: h.date, description: h.description || '' }); setModal(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.date) return
    setSaving(true)
    const id = companyId || 1
    const res = editing
      ? await api.put('/companies/' + id + '/holidays/' + editing.id, form)
      : await api.post('/companies/' + id + '/holidays', form)
    setSaving(false)
    if (!res.error) {
      setModal(false)
      const hRes = await api.get('/companies/' + id + '/holidays')
      setHolidays(extractArray(hRes.data))
    }
  }

  const handleDelete = async (hid: number) => {
    if (!confirm(ar('حذف هذه العطلة؟', 'Delete this holiday?'))) return
    await api.delete('/companies/' + (companyId || 1) + '/holidays/' + hid)
    setHolidays(p => p.filter(h => h.id !== hid))
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>🗓️ {ar('العطلات الرسمية', 'Public Holidays')}</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ {ar('إضافة عطلة', 'Add Holiday')}</button>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
        </div>
      ) : holidays.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🗓️</div><p className="empty-state-text">{ar('لا توجد عطلات مسجلة', 'No holidays recorded')}</p></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>{ar('الاسم', 'Name')}</th><th>{ar('التاريخ', 'Date')}</th><th>{ar('الوصف', 'Description')}</th><th>{ar('إجراءات', 'Actions')}</th></tr></thead>
            <tbody>
              {holidays.map(h => (
                <tr key={h.id}>
                  <td className="fw-semibold">🎉 {h.name}</td>
                  <td>{h.date}</td>
                  <td className="text-muted">{h.description || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(h)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(h.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? ar('تعديل العطلة', 'Edit Holiday') : ar('عطلة جديدة', 'New Holiday')}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="input-grid">
                  <div className="input-group">
                    <label className="input-label">{ar('اسم العطلة *', 'Holiday Name *')}</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{ar('التاريخ *', 'Date *')}</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{ar('الوصف', 'Description')}</label>
                    <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// تفضيلات الإشعارات
// ══════════════════════════════════════════════════════════
function NotificationPrefs({ lang, t }: any) {
  const ar = (a: string, e: string) => lang === 'ar' ? a : e
  const [prefs, setPrefs] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const res = await api.get('/notification-preferences')
      if (res.data) setPrefs(res.data)
      setLoading(false)
    }
    fetch()
  }, [])

  const toggle = (key: string) => setPrefs((p: any) => ({ ...p, [key]: !p[key] }))

  const handleSave = async () => {
    setSaving(true)
    await api.put('/notification-preferences', prefs)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const channels = [
    { key: 'email_new_ticket', label: ar('بريد - تذكرة جديدة', 'Email - New Ticket') },
    { key: 'email_ticket_assigned', label: ar('بريد - تعيين تذكرة', 'Email - Ticket Assigned') },
    { key: 'email_ticket_resolved', label: ar('بريد - حل تذكرة', 'Email - Ticket Resolved') },
    { key: 'email_new_sale', label: ar('بريد - فاتورة جديدة', 'Email - New Sale') },
    { key: 'email_low_stock', label: ar('بريد - مخزون منخفض', 'Email - Low Stock') },
    { key: 'push_new_ticket', label: ar('إشعار - تذكرة جديدة', 'Push - New Ticket') },
    { key: 'push_ticket_assigned', label: ar('إشعار - تعيين تذكرة', 'Push - Ticket Assigned') },
    { key: 'push_new_sale', label: ar('إشعار - فاتورة جديدة', 'Push - New Sale') },
    { key: 'push_low_stock', label: ar('إشعار - مخزون منخفض', 'Push - Low Stock') },
  ]

  if (loading) return <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}</div>

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>🔔 {ar('تفضيلات الإشعارات', 'Notification Preferences')}</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>✅ {ar('تم الحفظ', 'Saved')}</span>}
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? t('loading') : t('save')}</button>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {channels.map(ch => (
          <div key={ch.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
            <span style={{ fontSize: '0.9rem' }}>{ch.label}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div
                onClick={() => toggle(ch.key)}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s',
                  background: prefs[ch.key] ? 'var(--color-primary)' : 'var(--color-border)',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', left: prefs[ch.key] ? 22 : 2,
                }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{prefs[ch.key] ? ar('مفعّل', 'ON') : ar('معطّل', 'OFF')}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// النسخ الاحتياطي
// ══════════════════════════════════════════════════════════
function BackupSettings({ lang, t }: any) {
  const ar = (a: string, e: string) => lang === 'ar' ? a : e
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchBackups = async () => {
    setLoading(true)
    const res = await api.get('/backup')
    setBackups(extractArray(res.data))
    setLoading(false)
  }

  useEffect(() => { fetchBackups() }, [])

  const handleCreate = async () => {
    setCreating(true)
    setMsg('')
    const res = await api.post('/backup', {})
    setCreating(false)
    if (res.error) setMsg('❌ ' + res.error)
    else { setMsg('✅ ' + ar('تم إنشاء النسخة الاحتياطية', 'Backup created successfully')); fetchBackups() }
    setTimeout(() => setMsg(''), 4000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(ar('حذف هذه النسخة؟', 'Delete this backup?'))) return
    await api.delete('/backup/' + id)
    setBackups(p => p.filter((b: any) => b.id !== id))
  }

  const fmtSize = (bytes: number) => {
    if (!bytes) return '—'
    if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return bytes + ' B'
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>💾 {ar('النسخ الاحتياطي', 'Backup')}</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: '0.875rem' }}>{msg}</span>}
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={creating}>
            {creating ? ar('⏳ جارٍ الإنشاء...', '⏳ Creating...') : '+ ' + ar('إنشاء نسخة احتياطية', 'Create Backup')}
          </button>
        </div>
      </div>
      <div style={{ padding: '0.75rem 1rem', background: 'rgba(59,130,246,0.08)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--color-info)' }}>
        ℹ️ {ar('يتم إنشاء نسخ احتياطية تلقائية يومياً. يمكنك إنشاء نسخة يدوية في أي وقت.', 'Automatic daily backups are created. You can create a manual backup anytime.')}
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
        </div>
      ) : backups.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">💾</div><p className="empty-state-text">{ar('لا توجد نسخ احتياطية', 'No backups found')}</p></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>{ar('الاسم', 'Name')}</th><th>{ar('الحجم', 'Size')}</th><th>{ar('التاريخ', 'Date')}</th><th>{ar('إجراءات', 'Actions')}</th></tr></thead>
            <tbody>
              {backups.map((b: any) => (
                <tr key={b.id}>
                  <td className="fw-semibold">💾 {b.name || b.filename || 'backup-' + b.id}</td>
                  <td>{fmtSize(b.size)}</td>
                  <td className="text-muted">{b.created_at ? new Date(b.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a className="btn btn-secondary btn-sm" href={`/api/backup/${b.id}`} download>📥 {ar('تحميل', 'Download')}</a>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
