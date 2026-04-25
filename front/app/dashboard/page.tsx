'use client'

// ══════════════════════════════════════════════════════════
// app/dashboard/page.tsx — لوحة التحكم الرئيسية (FIXED)
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET /api/reports/dashboard  → الإحصائيات الرئيسية
//   GET /api/sales?per_page=5   → آخر 5 مبيعات
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useAuth } from '../../lib/auth'
import './page.css'

type DashboardData = {
  sales_today: number
  sales_month: number
  purchases_month: number
  low_stock_count: number
  pending_invoices: number
  active_employees: number
  total_sales?: number
  total_purchases?: number
  total_customers?: number
  total_products?: number
}

type Sale = {
  id: number
  invoice_number: string
  customer?: { name: string }
  total: number
  status: string
  created_at: string
}

export default function DashboardPage() {
  const { t, lang } = useI18n()
  const { user }    = useAuth()

  const [data,    setData]    = useState<DashboardData | null>(null)
  const [sales,   setSales]   = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [dashRes, salesRes] = await Promise.all([
          api.get<any>('/reports/dashboard'),
          api.get<any>('/sales?per_page=5'),
        ])

        if (dashRes.data) setData(dashRes.data)
        
        // Handle multiple possible API response formats
        let salesData: Sale[] = []
        
        if (salesRes && salesRes.data) {
          const responseData = salesRes.data
          
          if (Array.isArray(responseData)) {
            salesData = responseData
          } else if (responseData.data && Array.isArray(responseData.data)) {
            salesData = responseData.data
          } else if (responseData.sales && Array.isArray(responseData.sales)) {
            salesData = responseData.sales
          } else if (responseData.items && Array.isArray(responseData.items)) {
            salesData = responseData.items
          }
        }
        
        setSales(Array.isArray(salesData) ? salesData : [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setSales([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'badge-success', paid: 'badge-success',
      pending:   'badge-warning', draft: 'badge-muted',
      cancelled: 'badge-danger',  refunded: 'badge-danger',
    }
    return map[status] || 'badge-muted'
  }

  const statCards = [
    { label: lang === 'ar' ? 'مبيعات اليوم'     : 'Today\'s Sales',       value: fmt(data?.sales_today       ?? 0), icon: '💰', color: 'stat-blue'   },
    { label: lang === 'ar' ? 'مبيعات الشهر'     : 'Monthly Sales',        value: fmt(data?.sales_month       ?? 0), icon: '📈', color: 'stat-green'  },
    { label: lang === 'ar' ? 'مشتريات الشهر'    : 'Monthly Purchases',    value: fmt(data?.purchases_month   ?? 0), icon: '🛒', color: 'stat-purple' },
    { label: lang === 'ar' ? 'موظفون نشطون'     : 'Active Employees',     value: fmt(data?.active_employees  ?? 0), icon: '👥', color: 'stat-orange' },
    { label: lang === 'ar' ? 'فواتير معلقة'     : 'Pending Invoices',     value: fmt(data?.pending_invoices  ?? 0), icon: '📋', color: 'stat-yellow' },
    { label: lang === 'ar' ? 'منتجات أوشكت تخلص': 'Low Stock Products',   value: fmt(data?.low_stock_count   ?? 0), icon: '⚠️', color: 'stat-red'    },
  ]

  return (
    <ERPLayout pageTitle={t('dashboard')}>

      {/* ── ترحيب ──────────────────────────────────────── */}
      <div className="dashboard-welcome">
        <div>
          <h2 className="dashboard-welcome-title">
            {t('welcome')}، {user?.name} 👋
          </h2>
          <p className="dashboard-welcome-sub">
            {lang === 'ar' ? 'هذا ملخص نشاطك اليوم' : "Here's a summary of today's activity"}
          </p>
        </div>
      </div>

      {/* ── كروت الإحصائيات ──────────────────────────── */}
      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {loading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '40%', height: 14 }} />
                </div>
              </div>
            ))
          : statCards.map((card) => (
              <div key={card.label} className="stat-card">
                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                <div>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </div>
            ))
        }
      </div>

      {/* ── روابط سريعة ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { href: '/sales',     icon: '💰', label: lang === 'ar' ? 'مبيعات جديدة'  : 'New Sale'      },
          { href: '/purchases', icon: '🛒', label: lang === 'ar' ? 'طلب شراء'       : 'New Purchase'  },
          { href: '/inventory', icon: '📦', label: lang === 'ar' ? 'المخزون'         : 'Inventory'     },
          { href: '/hr',        icon: '👥', label: lang === 'ar' ? 'الموارد البشرية' : 'HR'            },
          { href: '/accounting',icon: '📒', label: lang === 'ar' ? 'المحاسبة'        : 'Accounting'    },
          { href: '/reports',   icon: '📊', label: lang === 'ar' ? 'التقارير'        : 'Reports'       },
        ].map(link => (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', padding: '1rem 0.5rem', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
              textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.8rem',
              fontWeight: 600, transition: 'all var(--transition)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            <span style={{ fontSize: '1.5rem' }}>{link.icon}</span>
            {link.label}
          </a>
        ))}
      </div>

      {/* ── آخر المبيعات ─────────────────────────────── */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 className="fw-bold">{t('recent_sales')}</h3>
          <a href="/sales" className="text-primary" style={{ fontSize: '0.875rem', textDecoration: 'none' }}>
            {lang === 'ar' ? 'عرض الكل' : 'View All'} →
          </a>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : Array.isArray(sales) && sales.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('number')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                  <th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <a href={`/sales/${sale.id}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>
                        {sale.invoice_number}
                      </a>
                    </td>
                    <td>{sale.customer?.name || '—'}</td>
                    <td className="fw-semibold">{fmt(sale.total)}</td>
                    <td>
                      <span className={`badge ${statusBadge(sale.status)}`}>
                        {t(sale.status) || sale.status}
                      </span>
                    </td>
                    <td className="text-muted">{fmtDate(sale.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        )}
      </div>

    </ERPLayout>
  )
}
