'use client'

// ══════════════════════════════════════════════════════════
// app/portal/page.tsx — Customer Portal
// API: POST /api/portal/auth/login
//      GET  /api/portal/orders
//      GET  /api/portal/invoices
//      GET  /api/portal/tickets
//      GET  /api/portal/payments
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui'

const TABS = ['auth', 'orders', 'invoices', 'tickets', 'payments']

export default function CustomerPortalPage() {
  const { lang } = useI18n()
  const [activeTab, setActiveTab] = useState('auth')
  const { toasts, show, remove } = useToast()

  const tabLabels: Record<string, { ar: string; en: string; icon: string }> = {
    auth:     { ar: 'مصادقة البوابة',  en: 'Portal Auth',       icon: '🔐' },
    orders:   { ar: 'طلبات العملاء',   en: 'Customer Orders',   icon: '📦' },
    invoices: { ar: 'فواتير العملاء',  en: 'Customer Invoices', icon: '🧾' },
    tickets:  { ar: 'تذاكر العملاء',   en: 'Customer Tickets',  icon: '🎫' },
    payments: { ar: 'مدفوعات العملاء', en: 'Customer Payments', icon: '💳' },
  }

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'بوابة العملاء' : 'Customer Portal'}>
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tabLabels[tab].icon} {lang === 'ar' ? tabLabels[tab].ar : tabLabels[tab].en}
          </button>
        ))}
      </div>

      {activeTab === 'auth'     && <PortalAuth     lang={lang} show={show} />}
      {activeTab === 'orders'   && <PortalOrders   lang={lang} />}
      {activeTab === 'invoices' && <PortalInvoices lang={lang} />}
      {activeTab === 'tickets'  && <PortalTickets  lang={lang} show={show} />}
      {activeTab === 'payments' && <PortalPayments lang={lang} />}
    </ERPLayout>
  )
}

// ── Portal Auth ─────────────────────────────────────────────
function PortalAuth({ lang, show }: any) {
  const [form, setForm]   = useState({ email: '', password: '', name: '', phone: '' })
  const [mode, setMode]   = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [customer, setCustomer] = useState<any>(null)

  useEffect(() => {
    const t = localStorage.getItem('portal_token')
    const c = localStorage.getItem('portal_customer')
    if (t) { setToken(t); if (c) setCustomer(JSON.parse(c)) }
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true)
    const res = await api.post('/portal/auth/login', { email: form.email, password: form.password })
    setLoading(false)
    if (res.data?.token) {
      localStorage.setItem('portal_token', res.data.token)
      localStorage.setItem('portal_customer', JSON.stringify(res.data.customer || {}))
      setToken(res.data.token)
      setCustomer(res.data.customer || {})
      show('تم تسجيل الدخول بنجاح', 'success')
    } else {
      show(res.error || 'فشل تسجيل الدخول', 'error')
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true)
    const res = await api.post('/portal/auth/register', form)
    setLoading(false)
    if (res.data?.token || res.data?.message) {
      show(res.data.message || 'تم التسجيل بنجاح', 'success')
      setMode('login')
    } else {
      show(res.error || 'فشل التسجيل', 'error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_customer')
    setToken(null); setCustomer(null)
    show('تم تسجيل الخروج', 'success')
  }

  if (token && customer) {
    return (
      <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
        <h3 className="fw-bold" style={{ marginBottom: '1.5rem' }}>
          ✅ {lang === 'ar' ? 'مسجّل دخول كعميل' : 'Logged in as Customer'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
          <div><span className="text-muted">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span> <strong>{customer.name || '—'}</strong></div>
          <div><span className="text-muted">{lang === 'ar' ? 'البريد:' : 'Email:'}</span> <strong>{customer.email || '—'}</strong></div>
          <div><span className="text-muted">Token:</span> <code style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>{token.substring(0, 40)}...</code></div>
        </div>
        <button className="btn btn-danger" onClick={handleLogout}>
          🚪 {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </button>
      </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
          {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
        </button>
        <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
          {lang === 'ar' ? 'إنشاء حساب' : 'Register'}
        </button>
      </div>

      {mode === 'login' ? (
        <form onSubmit={handleLogin}>
          <div className="form-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '...' : (lang === 'ar' ? 'دخول' : 'Login')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div className="form-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'الاسم' : 'Name'}</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'الهاتف' : 'Phone'}</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '...' : (lang === 'ar' ? 'إنشاء حساب' : 'Register')}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Portal Orders ───────────────────────────────────────────
function PortalOrders({ lang }: { lang: string }) {
  const [orders, setOrders]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portal/orders').then(res => {
      setOrders(extractArray(res.data))
      setLoading(false)
    })
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  const STATUS_COLOR: Record<string, string> = {
    pending: 'badge-warning', confirmed: 'badge-info', shipped: 'badge-info',
    delivered: 'badge-success', cancelled: 'badge-danger',
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="card" style={{ padding: 0 }}>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📦</div>
          <p className="empty-state-text">{lang === 'ar' ? 'لا توجد طلبات' : 'No orders found'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                <th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="fw-semibold">{o.ref || o.order_number || `#${o.id}`}</td>
                  <td>{o.customer?.name || o.customer_name || '—'}</td>
                  <td className="text-muted">{o.date || o.created_at ? new Date(o.date || o.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}</td>
                  <td>{fmt(o.total || o.grand_total || 0)}</td>
                  <td><span className={`badge ${STATUS_COLOR[o.status] || 'badge-muted'}`}>{o.status || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Portal Invoices ─────────────────────────────────────────
function PortalInvoices({ lang }: { lang: string }) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/portal/invoices').then(res => {
      setInvoices(extractArray(res.data))
      setLoading(false)
    })
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  if (loading) return <LoadingSkeleton />

  return (
    <div className="card" style={{ padding: 0 }}>
      {invoices.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🧾</div>
          <p className="empty-state-text">{lang === 'ar' ? 'لا توجد فواتير' : 'No invoices found'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                <th>{lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                <th>{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                <th>{lang === 'ar' ? 'المدفوع' : 'Paid'}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="fw-semibold">{inv.ref || inv.invoice_number || `#${inv.id}`}</td>
                  <td>{inv.customer?.name || inv.customer_name || '—'}</td>
                  <td className="text-muted">{inv.due_date ? new Date(inv.due_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}</td>
                  <td>{fmt(inv.total || inv.amount || 0)}</td>
                  <td>{fmt(inv.paid_amount || 0)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                      {inv.status || 'pending'}
                    </span>
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

// ── Portal Tickets ──────────────────────────────────────────
function PortalTickets({ lang, show }: any) {
  const [tickets, setTickets]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ subject: '', description: '', priority: 'medium' })
  const [saving, setSaving]     = useState(false)

  const loadTickets = () => {
    setLoading(true)
    api.get('/portal/tickets').then(res => {
      setTickets(extractArray(res.data))
      setLoading(false)
    })
  }

  useEffect(() => { loadTickets() }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await api.post('/portal/tickets', form)
    setSaving(false)
    if (res.data) {
      show('تم إنشاء التذكرة بنجاح', 'success')
      setShowForm(false)
      setForm({ subject: '', description: '', priority: 'medium' })
      loadTickets()
    } else show(res.error || 'فشل الإنشاء', 'error')
  }

  if (loading) return <LoadingSkeleton />

  const STATUS_COLOR: Record<string, string> = { open: 'badge-danger', in_progress: 'badge-warning', resolved: 'badge-success', closed: 'badge-muted' }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 className="fw-bold">{lang === 'ar' ? 'تذاكر الدعم' : 'Support Tickets'}</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          + {lang === 'ar' ? 'تذكرة جديدة' : 'New Ticket'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 className="fw-bold" style={{ marginBottom: '1rem' }}>{lang === 'ar' ? 'تذكرة جديدة' : 'New Ticket'}</h4>
          <form onSubmit={handleCreate}>
            <div className="form-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'الموضوع' : 'Subject'}</label>
                <input className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'الأولوية' : 'Priority'}</label>
                <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</option>
                  <option value="medium">{lang === 'ar' ? 'متوسطة' : 'Medium'}</option>
                  <option value="high">{lang === 'ar' ? 'عالية' : 'High'}</option>
                  <option value="urgent">{lang === 'ar' ? 'عاجلة' : 'Urgent'}</option>
                </select>
              </div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">{lang === 'ar' ? 'الوصف' : 'Description'}</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? '...' : (lang === 'ar' ? 'إرسال' : 'Submit')}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {tickets.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🎫</div>
            <p className="empty-state-text">{lang === 'ar' ? 'لا توجد تذاكر' : 'No tickets found'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{lang === 'ar' ? 'الموضوع' : 'Subject'}</th>
                  <th>{lang === 'ar' ? 'الأولوية' : 'Priority'}</th>
                  <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td className="fw-semibold">{t.ref || `#${t.id}`}</td>
                    <td>{t.subject}</td>
                    <td><span className={`badge ${t.priority === 'urgent' || t.priority === 'high' ? 'badge-danger' : t.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>{t.priority}</span></td>
                    <td><span className={`badge ${STATUS_COLOR[t.status] || 'badge-muted'}`}>{t.status}</span></td>
                    <td className="text-muted">{t.created_at ? new Date(t.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}</td>
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

// ── Portal Payments ─────────────────────────────────────────
function PortalPayments({ lang }: { lang: string }) {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/portal/payments').then(res => {
      setPayments(extractArray(res.data))
      setLoading(false)
    })
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  if (loading) return <LoadingSkeleton />

  return (
    <div className="card" style={{ padding: 0 }}>
      {payments.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">💳</div>
          <p className="empty-state-text">{lang === 'ar' ? 'لا توجد مدفوعات' : 'No payments found'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th>{lang === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                <th>{lang === 'ar' ? 'المرجع' : 'Reference'}</th>
                <th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="fw-semibold">{`#${p.id}`}</td>
                  <td className="fw-bold">{fmt(p.amount || 0)}</td>
                  <td>{p.payment_method || p.method || '—'}</td>
                  <td className="text-muted">{p.transaction_id || p.ref || '—'}</td>
                  <td className="text-muted">{p.created_at ? new Date(p.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}</td>
                  <td><span className={`badge ${p.status === 'completed' || p.status === 'paid' ? 'badge-success' : p.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>{p.status || 'pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
    </div>
  )
}
