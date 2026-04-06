'use client'

// ══════════════════════════════════════════════════════════
// components/layout/Navbar.tsx — شريط العلوي (Top Bar)
// ══════════════════════════════════════════════════════════
// يحتوي على:
//   - اسم الصفحة الحالية (بيجي من prop)
//   - زرار التبديل بين Dark/Light
//   - زرار التبديل بين العربي/الإنجليزي
//   - الإشعارات (بتجيب العدد من الـ API)
//   - قائمة المستخدم (logout, profile)
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useI18n } from '../../lib/i18n'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/theme'
import { api } from '../../lib/api'
import './Navbar.css'

// ══════════════════════════════════════════════════════════
export default function Navbar({
  pageTitle,
  onMenuToggle,
}: {
  pageTitle?: string       // اسم الصفحة الحالية
  onMenuToggle?: () => void // لفتح الـ sidebar في الموبايل
}) {
  const { t, lang, toggleLang } = useI18n()
  const { user, logout }        = useAuth()
  const { isDark, toggleTheme } = useTheme()

  // ─── حالة قائمة المستخدم ─────────────────────────────
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // ─── عدد الإشعارات غير المقروءة ──────────────────────
  const [notifCount, setNotifCount] = useState(0)

  // اجيب عدد الإشعارات من الـ API عند فتح الصفحة
  useEffect(() => {
    api.get('/notifications').then((res) => {
      if (res.data) {
        // الـ API ممكن يرجع array مباشرة أو paginated {data: [...]}
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : []
        const unread = items.filter((n: any) => !n.read_at).length
        setNotifCount(unread)
      }
    })
  }, [])

  // إغلاق قائمة المستخدم لو ضغط برا
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── دالة الـ logout ────────────────────────────────────
  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
  }

  return (
    <nav className="navbar">
      {/* ── يسار: زرار الموبايل + اسم الصفحة ──────────── */}
      <div className="navbar-start">
        {/* زرار فتح الـ sidebar في الموبايل */}
        <button
          className="btn-icon navbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="فتح القائمة"
        >
          ☰
        </button>

        {/* اسم الصفحة الحالية */}
        {pageTitle && (
          <h1 className="navbar-title">{pageTitle}</h1>
        )}
      </div>

      {/* ── يمين: الأدوات ──────────────────────────────── */}
      <div className="navbar-end">

        {/* ── زرار تغيير اللغة ──────────────────────── */}
        <button
          className="btn-icon navbar-lang-btn"
          onClick={toggleLang}
          title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
        >
          {lang === 'ar' ? 'EN' : 'ع'}
        </button>

        {/* ── زرار الـ Dark/Light ───────────────────── */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* ── الإشعارات ─────────────────────────────── */}
        <Link href="/notifications" className="navbar-notif">
          <button className="btn-icon" aria-label="الإشعارات">
            🔔
          </button>
          {/* شارة العدد — تظهر فقط لو في إشعارات */}
          {notifCount > 0 && (
            <span className="navbar-notif-badge">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </Link>

        {/* ── قائمة المستخدم ────────────────────────── */}
        <div className="navbar-user dropdown" ref={userMenuRef}>
          {/* زرار فتح القائمة */}
          <button
            className="navbar-user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
          >
            {/* صورة أو حرف أول من الاسم */}
            <div className="navbar-avatar">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} />
                : user?.name?.charAt(0)?.toUpperCase() || '?'
              }
            </div>
            {/* الاسم — يختفي في الموبايل */}
            <span className="navbar-user-name">{user?.name}</span>
            <span className="navbar-chevron">▾</span>
          </button>

          {/* القائمة المنسدلة */}
          {userMenuOpen && (
            <div className="dropdown-menu navbar-user-menu">
              {/* معلومات المستخدم */}
              <div className="navbar-user-info">
                <p className="navbar-user-info-name">{user?.name}</p>
                <p className="navbar-user-info-email">{user?.email}</p>
              </div>

              <div className="dropdown-divider" />

              {/* روابط */}
              <Link href="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                <span>⚙️</span> {t('settings')}
              </Link>

              <div className="dropdown-divider" />

              {/* تسجيل الخروج */}
              <button className="dropdown-item danger" onClick={handleLogout}>
                <span>🚪</span> {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
