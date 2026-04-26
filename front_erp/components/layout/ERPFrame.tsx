'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import './ERPLayout.css'

export default function ERPFrame({
  children,
  pageTitle,
}: {
  children: ReactNode
  pageTitle?: string
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleSidebar = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar_collapsed', String(next))
  }

  const closeMobile = () => setMobileOpen(false)

  if (isLoading || !user) {
    return (
      <div className="erp-loading">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
      />

      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar
          pageTitle={pageTitle}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />

        <main className="page-inner">
          {children}
        </main>
      </div>
    </div>
  )
}
