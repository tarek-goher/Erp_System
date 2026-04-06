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
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

const TABS = ['company', 'users', 'roles', 'taxes', 'currencies', 'audit', 'security']

export default function SettingsPage() {
  const { t, lang } = useI18n()
  const [activeTab, setActiveTab] = useState('company')

  const tabLabels: Record<string, { ar: string; en: string }> = {
    company:    { ar: 'بيانات الشركة',  en: 'Company Info' },
    users:      { ar: 'المستخدمون',    en: 'Users' },
    roles:      { ar: 'الأدوار والصلاحيات', en: 'Roles & Permissions' },
    taxes:      { ar: 'الضرائب',       en: 'Tax Rates' },
    currencies: { ar: 'العملات',       en: 'Currencies' },
    audit:      { ar: 'سجل الأنشطة',  en: 'Audit Log' },
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

      {activeTab === 'company'    && <CompanySettings lang={lang} t={t} />}
      {activeTab === 'users'      && <UsersSettings lang={lang} t={t} />}
      {activeTab === 'roles'      && <RolesSettings lang={lang} t={t} />}
      {activeTab === 'taxes'      && <TaxSettings lang={lang} t={t} />}
      {activeTab === 'currencies' && <CurrenciesSettings lang={lang} t={t} />}
      {activeTab === 'audit'      && <AuditLog lang={lang} t={t} />}
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
      if (res.data) setUsers(res.data.data || [])
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
      if (res.data) setRoles(res.data.data || res.data || [])
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
      if (res.data) setTaxes(res.data.data || res.data || [])
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
      if (res.data) setCurrencies(res.data.data || res.data || [])
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
      if (res.data) setLogs(res.data.data || [])
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
