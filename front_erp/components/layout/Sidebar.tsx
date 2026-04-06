'use client'

// ══════════════════════════════════════════════════════════
// components/layout/Sidebar.tsx — القائمة الجانبية
// ══════════════════════════════════════════════════════════
// - بيستخدم useI18n للترجمة
// - بيستخدم useAuth للتحقق من الصلاحيات
// - بيدعم الـ collapse (انكماش)
// - بيستخدم usePathname لتحديد الصفحة الحالية
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '../../lib/i18n'
import { useAuth } from '../../lib/auth'
import './Sidebar.css'

// ─── تعريف عناصر القائمة ─────────────────────────────────
// كل عنصر عنده: path, icon (emoji), مفتاح ترجمة, صلاحية مطلوبة
const NAV_ITEMS = [
  // ─── الرئيسية ──────────────────────────────────────────
  { path: '/dashboard',      icon: '📊', key: 'dashboard',      permission: null },

  // ─── المبيعات والمشتريات ─────────────────────────────────
  { path: '/sales',          icon: '💰', key: 'sales',          permission: 'manage-sales' },
  { path: '/quotations',     icon: '📝', key: 'quotations',     permission: 'manage-sales' },
  { path: '/purchases',      icon: '🛒', key: 'purchases',      permission: 'manage-purchases' },
  { path: '/suppliers',      icon: '🤝', key: 'suppliers',      permission: 'manage-purchases' },
  { path: '/inventory',      icon: '📦', key: 'inventory',      permission: 'manage-products' },
  { path: '/warehouses',     icon: '🏬', key: 'warehouses',     permission: 'manage-products' },

  // ─── المالية ────────────────────────────────────────────
  { path: '/accounting',     icon: '🧾', key: 'accounting',     permission: 'manage-accounting' },
  { path: '/budgets',        icon: '📊', key: 'budgets',        permission: 'manage-accounting' },
  { path: '/fixed-assets',   icon: '🏢', key: 'fixed_assets',   permission: 'manage-accounting' },

  // ─── الموارد البشرية ─────────────────────────────────────
  { path: '/hr',             icon: '👥', key: 'hr',             permission: 'manage-hr' },
  { path: '/payroll',        icon: '💳', key: 'payroll',        permission: 'manage-hr' },
  { path: '/recruitment',    icon: '👔', key: 'recruitment',    permission: 'manage-hr' },
  { path: '/appraisals',     icon: '⭐', key: 'appraisals',     permission: 'manage-hr' },

  // ─── الضرائب ────────────────────────────────────────────
  { path: '/taxes',          icon: '🧮', key: 'taxes',          permission: 'manage-accounting' },

  // ─── ولاء العملاء ─────────────────────────────────────
  { path: '/loyalty',        icon: '🎁', key: 'loyalty',        permission: 'manage-sales' },

  // ─── الفروع والإعدادات ────────────────────────────────────
  { path: '/branches',       icon: '🏬', key: 'branches',       permission: 'manage-settings' },

  // ─── العمليات ───────────────────────────────────────────
  { path: '/crm',            icon: '🤝', key: 'crm',            permission: 'manage-crm' },
  { path: '/projects',       icon: '📋', key: 'projects',       permission: 'manage-projects' },
  { path: '/helpdesk',       icon: '🎧', key: 'helpdesk',       permission: 'manage-projects' },
  { path: '/manufacturing',  icon: '🏭', key: 'manufacturing',  permission: 'manage-warehouses' },
  { path: '/fleet',          icon: '🚗', key: 'fleet',          permission: 'manage-warehouses' },
  { path: '/marketing',      icon: '📣', key: 'marketing',      permission: 'manage-warehouses' },
  { path: '/pos',            icon: '🖥️', key: 'pos',            permission: 'manage-pos' },

  // ─── البريد والتقارير ────────────────────────────────────
  { path: '/email-inbox',    icon: '📥', key: 'email_inbox',    permission: null },
  { path: '/reports',        icon: '📈', key: 'reports',        permission: 'view-reports' },

  // ─── الذكاء الاصطناعي ────────────────────────────────────
  { path: '/ai-assistant',   icon: '🤖', key: 'ai_assistant',   permission: null },

  // ─── الإدارة ────────────────────────────────────────────
  { path: '/users',          icon: '👤', key: 'users',          permission: 'manage-users' },
  { path: '/audit-log',      icon: '📋', key: 'audit_log',      permission: 'manage-users' },
  { path: '/settings',       icon: '⚙️', key: 'settings',       permission: null },
]

// ══════════════════════════════════════════════════════════
export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname    = usePathname()
  const { t, dir } = useI18n()
  const { user, hasPermission } = useAuth()

  return (
    // ── الـ sidebar wrapper ──────────────────────────────
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      data-dir={dir}
    >
      {/* ── اللوغو وزرار الـ collapse ─────────────────── */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">⚡</span>
            <span className="sidebar-logo-text">ERP System</span>
          </div>
        )}
        {/* زرار فتح/غلق الـ sidebar */}
        <button
          className="sidebar-toggle btn-icon"
          onClick={onToggle}
          title={collapsed ? 'فتح القائمة' : 'إغلاق القائمة'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* ── القائمة الرئيسية ─────────────────────────── */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          // تحقق من الصلاحية — لو null يظهر للكل
          // لو المستخدم عنده role = admin → يشوف كل حاجة (زي السوبر أدمن)
          const isCompanyAdmin = user?.roles?.includes('admin')
          if (item.permission && !isCompanyAdmin && !hasPermission(item.permission)) return null

          // هل الـ link ده active؟
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? t(item.key) : undefined}
            >
              {/* الأيقونة */}
              <span className="sidebar-item-icon">{item.icon}</span>

              {/* النص — يختفي لما الـ sidebar ينكمش */}
              {!collapsed && (
                <span className="sidebar-item-text">{t(item.key)}</span>
              )}

              {/* نقطة الـ active */}
              {isActive && <span className="sidebar-item-dot" />}
            </Link>
          )
        })}
      </nav>

      {/* ── بيانات المستخدم في الأسفل ─────────────────── */}
      {!collapsed && user && (
        <div className="sidebar-user">
          {/* صورة المستخدم أو الأحرف الأولى من اسمه */}
          <div className="sidebar-user-avatar">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} />
              : user.name?.charAt(0)?.toUpperCase()
            }
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name}</p>
            <p className="sidebar-user-role">
              {user.is_super_admin ? 'Super Admin' : user.roles?.[0] || 'User'}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
