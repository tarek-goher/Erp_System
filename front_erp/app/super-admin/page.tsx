'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { StatCard } from '../../components/ui'
import Link from 'next/link'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await api.get('/super-admin/stats')
      if (res.data) setStats(res.data)
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { href:'/super-admin/companies',     icon:'🏢', label:'الشركات',        value: stats?.total_companies   ?? '—', accent:'var(--color-primary)' },
    { href:'/super-admin/users',         icon:'👤', label:'المستخدمون',     value: stats?.total_users       ?? '—', accent:'var(--color-info)' },
    { href:'/super-admin/subscriptions', icon:'💳', label:'الاشتراكات النشطة', value: stats?.active_subscriptions ?? '—', accent:'var(--color-success)' },
    { href:'/super-admin/tickets',       icon:'🎫', label:'تذاكر مفتوحة',   value: stats?.open_tickets      ?? '—', accent:'var(--color-danger)' },
    { href:'/super-admin/monitoring',    icon:'📡', label:'حالة النظام',    value: stats?.system_status     ?? '—', accent:'var(--color-warning)' },
    { href:'/super-admin/subscriptions', icon:'💰', label:'الإيراد الشهري', value: stats?.monthly_revenue   ?? '—', accent:'var(--color-success)' },
  ]

  return (
    <div>
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
            <Link key={c.href} href={c.href} style={{ textDecoration:'none' }}>
              <StatCard icon={c.icon} label={c.label} value={c.value} accent={c.accent} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
