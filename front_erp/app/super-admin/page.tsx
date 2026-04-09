'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { StatCard, ToastContainer } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import Link from 'next/link'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toasts, show, remove } = useToast()

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/super-admin/stats')
      if (res.error) {
        show(res.error, 'error')
      } else if (res.data) {
        setStats(res.data)
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e)
      show('خطأ في الاتصال بالخادم', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const cards = [
    { id: 'companies',     href:'/super-admin/companies',     icon:'🏢', label:'الشركات',        value: stats?.total_companies   ?? '—', accent:'var(--color-primary)' },
    { id: 'users',         href:'/super-admin/users',         icon:'👤', label:'المستخدمون',     value: stats?.total_users       ?? '—', accent:'var(--color-info)' },
    { id: 'subs-active',   href:'/super-admin/subscriptions', icon:'💳', label:'الاشتراكات النشطة', value: stats?.active_subscriptions ?? '—', accent:'var(--color-success)' },
    { id: 'tickets',       href:'/super-admin/tickets',       icon:'🎫', label:'تذاكر مفتوحة',   value: stats?.open_tickets      ?? '—', accent:'var(--color-danger)' },
    { id: 'monitoring',    href:'/super-admin/monitoring',    icon:'📡', label:'حالة النظام',    value: stats?.system_status     ?? '—', accent:'var(--color-warning)' },
    { id: 'subs-revenue',  href:'/super-admin/subscriptions', icon:'💰', label:'الإيراد الشهري', value: stats?.monthly_revenue   ?? '—', accent:'var(--color-success)' },
  ]

  return (
    <div>
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 لوحة التحكم الرئيسية</h1>
          <p className="page-subtitle">نظرة عامة على منصة CodeSphere ERP</p>
        </div>
      </div>
      {loading ? (
        <div className="grid-3">
          {Array(6).fill(0).map((_,i) => <div key={i} className="skeleton" style={{height:90}} />)}
        </div>
      ) : (
        <div className="grid-3">
          {cards.map(c => (
            <Link key={c.id} href={c.href} style={{ textDecoration:'none' }}>
              <StatCard icon={c.icon} label={c.label} value={c.value} accent={c.accent} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
