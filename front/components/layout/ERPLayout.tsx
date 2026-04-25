'use client'

// ══════════════════════════════════════════════════════════
// components/layout/ERPLayout.tsx — الـ Layout الداخلي
// ══════════════════════════════════════════════════════════
// بيستخدمه كل صفحة داخلية (بعد الـ login)
// يحتوي على: Sidebar + Navbar + المحتوى
//
// كيف تستخدمه في أي صفحة:
//   <ERPLayout pageTitle="المبيعات">
//     <YourPageContent />
//   </ERPLayout>
// ══════════════════════════════════════════════════════════

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import './ERPLayout.css'

export default function ERPLayout({
  children,
  pageTitle,
}: {
  children: ReactNode
  pageTitle?: string
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // ─── حالة الـ sidebar ──────────────────────────────────
  const [collapsed, setCollapsed]     = useState(false) // منكمش؟
  const [mobileOpen, setMobileOpen]   = useState(false) // مفتوح في الموبايل؟

  // ─── تحقق من الـ login ────────────────────────────────
  // لو مش logged in → روح صفحة login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // ─── اقرأ حالة الـ sidebar من localStorage ────────────
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  // ─── toggle الـ sidebar مع حفظ الحالة ────────────────
  const toggleSidebar = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar_collapsed', String(next))
  }

  // ─── إغلاق الـ sidebar في الموبايل لو ضغط الـ overlay ─
  const closeMobile = () => setMobileOpen(false)

  // ─── Loading screen ───────────────────────────────────
  if (isLoading || !user) {
    return (
      <div className="erp-loading">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      {/* ── overlay للموبايل لإغلاق الـ sidebar ─────────── */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} />
      )}

      {/* ── الـ Sidebar ───────────────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
      />

      {/* ── المحتوى الرئيسي ──────────────────────────── */}
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>

        {/* ── الـ Navbar ─────────────────────────────── */}
        <Navbar
          pageTitle={pageTitle}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />

        {/* ── محتوى الصفحة ──────────────────────────── */}
        <main className="page-inner">
          {children}
        </main>

      </div>
    </div>
  )
}
