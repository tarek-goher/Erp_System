'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useI18n } from '../../lib/i18n'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/theme'
import { api } from '../../lib/api'
import './Navbar.css'

export default function Navbar({
  pageTitle,
  onMenuToggle,
}: {
  pageTitle?: string
  onMenuToggle?: () => void
}) {
  const { t, lang, toggleLang } = useI18n()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    api.get('/notifications').then((res) => {
      if (res.data) {
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
  }

  return (
    <nav className="navbar">
      <div className="navbar-start">
        <button
          className="btn-icon navbar-action-btn navbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        {pageTitle && (
          <h1 className="navbar-title">{pageTitle}</h1>
        )}
      </div>

      <div className="navbar-end">
        <button
          className="btn-icon navbar-action-btn navbar-lang-btn"
          onClick={toggleLang}
          title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
        >
          {lang === 'ar' ? 'EN' : 'ع'}
        </button>

        <button
          className="btn-icon navbar-action-btn navbar-theme-btn"
          onClick={toggleTheme}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          {isDark ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
        </button>

        <Link href="/notifications" className="navbar-notif">
          <button className="btn-icon navbar-action-btn navbar-notif-btn" aria-label="Notifications">
            <i className="fa-solid fa-bell"></i>
          </button>
          {notifCount > 0 && (
            <span className="navbar-notif-badge">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </Link>

        <div className="navbar-user dropdown" ref={userMenuRef}>
          <button
            className="navbar-user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
          >
            <div className="navbar-avatar">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} />
                : user?.name?.charAt(0)?.toUpperCase() || '?'
              }
            </div>
            <span className="navbar-user-name">{user?.name}</span>
            <span className="navbar-chevron">
              <i className="fa-solid fa-chevron-down"></i>
            </span>
          </button>

          {userMenuOpen && (
            <div className="dropdown-menu navbar-user-menu">
              <div className="navbar-user-info">
                <p className="navbar-user-info-name">{user?.name}</p>
                <p className="navbar-user-info-email">{user?.email}</p>
              </div>

              <div className="dropdown-divider" />

              <Link href="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                <i className="fa-solid fa-gear"></i> {t('settings')}
              </Link>

              <div className="dropdown-divider" />

              <button className="dropdown-item danger" onClick={handleLogout}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
