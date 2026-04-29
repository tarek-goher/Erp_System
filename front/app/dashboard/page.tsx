'use client'

import { useState, useEffect } from 'react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faBagShopping,
  faBookOpen,
  faBoxesStacked,
  faCalendarDays,
  faCartShopping,
  faChartLine,
  faChartPie,
  faCircleCheck,
  faCircleQuestion,
  faCircleXmark,
  faClock,
  faCoins,
  faFileInvoice,
  faFileLines,
  faHashtag,
  faIdCard,
  faReceipt,
  faRotateLeft,
  faTag,
  faTriangleExclamation,
  faUser,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
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

        let salesData: Sale[] = []
        if (salesRes?.data) {
          const d = salesRes.data
          if      (Array.isArray(d))           salesData = d
          else if (Array.isArray(d.data))      salesData = d.data
          else if (Array.isArray(d.sales))     salesData = d.sales
          else if (Array.isArray(d.items))     salesData = d.items
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
      completed: 'badge-success', paid:      'badge-success',
      pending:   'badge-warning', draft:     'badge-muted',
      cancelled: 'badge-danger',  refunded:  'badge-danger',
    }
    return map[status] || 'badge-muted'
  }

  const statusIcon = (status: string): IconDefinition => {
    const map: Record<string, IconDefinition> = {
      completed: faCircleCheck,
      paid:      faCircleCheck,
      pending:   faClock,
      draft:     faFileLines,
      cancelled: faCircleXmark,
      refunded:  faRotateLeft,
    }
    return map[status] || faCircleQuestion
  }

  const statCards = [
    { label: lang === 'ar' ? 'مبيعات اليوم'      : "Today's Sales",      value: fmt(data?.sales_today      ?? 0), icon: faCoins,               color: 'stat-blue'   },
    { label: lang === 'ar' ? 'مبيعات الشهر'      : 'Monthly Sales',       value: fmt(data?.sales_month      ?? 0), icon: faChartLine,           color: 'stat-green'  },
    { label: lang === 'ar' ? 'مشتريات الشهر'     : 'Monthly Purchases',   value: fmt(data?.purchases_month  ?? 0), icon: faCartShopping,        color: 'stat-purple' },
    { label: lang === 'ar' ? 'موظفون نشطون'      : 'Active Employees',    value: fmt(data?.active_employees ?? 0), icon: faUsers,               color: 'stat-orange' },
    { label: lang === 'ar' ? 'فواتير معلقة'      : 'Pending Invoices',    value: fmt(data?.pending_invoices ?? 0), icon: faFileInvoice,         color: 'stat-yellow' },
    { label: lang === 'ar' ? 'منتجات أوشكت تخلص' : 'Low Stock Products',  value: fmt(data?.low_stock_count  ?? 0), icon: faTriangleExclamation, color: 'stat-red'    },
  ]

  const quickLinks = [
    { href: '/sales',      icon: faCoins,        label: lang === 'ar' ? 'مبيعات جديدة'   : 'New Sale'     },
    { href: '/purchases',  icon: faBagShopping,  label: lang === 'ar' ? 'طلب شراء'        : 'New Purchase' },
    { href: '/inventory',  icon: faBoxesStacked, label: lang === 'ar' ? 'المخزون'          : 'Inventory'    },
    { href: '/hr',         icon: faIdCard,       label: lang === 'ar' ? 'الموارد البشرية'  : 'HR'           },
    { href: '/accounting', icon: faBookOpen,     label: lang === 'ar' ? 'المحاسبة'         : 'Accounting'   },
    { href: '/reports',    icon: faChartPie,     label: lang === 'ar' ? 'التقارير'         : 'Reports'      },
  ]

  return (
    <ERPLayout pageTitle={t('dashboard')}>

      <div className="dashboard-welcome">
        <div>
          <h2 className="dashboard-welcome-title">
            {t('welcome')}، {user?.name} 👋
          </h2>
          <p className="dashboard-welcome-sub">
            {lang === 'ar'
              ? 'هذا ملخص نشاطك اليوم'
              : "Here's a summary of today's activity"}
          </p>
        </div>
      </div>

      <div
        className="dashboard-stats"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
      >
        {loading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '60%', height: 26, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '40%', height: 12 }} />
                </div>
              </div>
            ))
          : statCards.map((card) => (
              <div key={card.label} className="stat-card">
                <div className={`stat-icon ${card.color}`}>
                  <FontAwesomeIcon icon={card.icon} />
                </div>
                <div>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </div>
            ))
        }
      </div>

      <div className="quick-links-grid">
        {quickLinks.map(link => (
          <a key={link.href} href={link.href} className="quick-link">
            <FontAwesomeIcon icon={link.icon} />
            {link.label}
          </a>
        ))}
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 className="section-title">
            <FontAwesomeIcon icon={faReceipt} />
            {t('recent_sales')}
          </h3>
          <a href="/sales" className="view-all-link">
            {lang === 'ar' ? 'عرض الكل' : 'View All'}
            <FontAwesomeIcon icon={lang === 'ar' ? faArrowLeft : faArrowRight} />
          </a>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : Array.isArray(sales) && sales.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th><FontAwesomeIcon icon={faHashtag} />{t('number')}</th>
                  <th><FontAwesomeIcon icon={faUser} />{t('customer')}</th>
                  <th><FontAwesomeIcon icon={faCoins} />{t('total')}</th>
                  <th><FontAwesomeIcon icon={faTag} />{t('status')}</th>
                  <th><FontAwesomeIcon icon={faCalendarDays} />{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <a
                        href={`/sales/${sale.id}`}
                        className="text-primary"
                        style={{ textDecoration: 'none', fontWeight: 600 }}
                      >
                        {sale.invoice_number}
                      </a>
                    </td>
                    <td>{sale.customer?.name || '—'}</td>
                    <td className="fw-semibold">{fmt(sale.total)}</td>
                    <td>
                      <span className={`badge ${statusBadge(sale.status)}`}>
                        <FontAwesomeIcon icon={statusIcon(sale.status)} />
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
            <div className="empty-state-icon">
              <FontAwesomeIcon icon={faReceipt} />
            </div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        )}
      </div>

    </ERPLayout>
  )
}