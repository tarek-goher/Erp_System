'use client'

// ══════════════════════════════════════════════════════════
// components/layout/Sidebar.tsx — القائمة الجانبية
// ══════════════════════════════════════════════════════════

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '../../lib/i18n'
import { useAuth } from '../../lib/auth'
import './Sidebar.css'

// ─── Type للـ Role ────────────────────────────────────────
type Role = string | { id: number; name: string; pivot?: any }

// ─── تعريف عناصر القائمة ─────────────────────────────────
const NAV_ITEMS = [
  { path: '/dashboard',      icon: '📊', key: 'dashboard',      permission: null },
  { path: '/sales',          icon: '💰', key: 'sales',          permission: 'manage-sales' },
  { path: '/quotations',     icon: '📝', key: 'quotations',     permission: 'manage-sales' },
  { path: '/purchases',      icon: '🛒', key: 'purchases',      permission: 'manage-purchases' },
  { path: '/suppliers',      icon: '🤝', key: 'suppliers',      permission: 'manage-purchases' },
  { path: '/inventory',      icon: '📦', key: 'inventory',      permission: 'manage-products' },
  { path: '/warehouses',     icon: '🏬', key: 'warehouses',     permission: 'manage-products' },
  { path: '/accounting',     icon: '🧾', key: 'accounting',     permission: 'manage-accounting' },
  { path: '/budgets',        icon: '📊', key: 'budgets',        permission: 'manage-accounting' },
  { path: '/fixed-assets',   icon: '🏢', key: 'fixed_assets',   permission: 'manage-accounting' },
  { path: '/hr',             icon: '👥', key: 'hr',             permission: 'manage-hr' },
  { path: '/payroll',        icon: '💳', key: 'payroll',        permission: 'manage-hr' },
  { path: '/recruitment',    icon: '👔', key: 'recruitment',    permission: 'manage-hr' },
  { path: '/appraisals',     icon: '⭐', key: 'appraisals',     permission: 'manage-hr' },
  { path: '/taxes',          icon: '🧮', key: 'taxes',          permission: 'manage-accounting' },
  { path: '/loyalty',        icon: '🎁', key: 'loyalty',        permission: 'manage-sales' },
  { path: '/branches',       icon: '🏬', key: 'branches',       permission: 'manage-settings' },
  { path: '/crm',            icon: '🤝', key: 'crm',            permission: 'manage-crm' },
  { path: '/projects',       icon: '📋', key: 'projects',       permission: 'manage-projects' },
  { path: '/helpdesk',       icon: '🎧', key: 'helpdesk',       permission: 'manage-projects' },
  { path: '/manufacturing',  icon: '🏭', key: 'manufacturing',  permission: 'manage-warehouses' },
  { path: '/fleet',          icon: '🚗', key: 'fleet',          permission: 'manage-warehouses' },
  { path: '/marketing',      icon: '📣', key: 'marketing',      permission: 'manage-warehouses' },
  { path: '/pos',            icon: '🖥️', key: 'pos',            permission: 'manage-pos' },
  { path: '/email-inbox',    icon: '📥', key: 'email_inbox',    permission: null },
  { path: '/reports',        icon: '📈', key: 'reports',        permission: 'view-reports' },
  { path: '/ai-assistant',   icon: '🤖', key: 'ai_assistant',   permission: null },
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
  const pathname             = usePathname()
  const { t, dir }           = useI18n()
  const { user, hasPermission } = useAuth()

  // ─── استخراج اسم الـ role بأمان ──────────────────────
  const getRoleName = (roles: Role[] | undefined): string => {
    if (!roles || roles.length === 0) return 'User'
    const first = roles[0]
    return typeof first === 'string' ? first : (first.name ?? 'User')
  }

  // ─── هل المستخدم admin في الشركة؟ ────────────────────
  const isCompanyAdmin = user?.roles?.some((r: Role) => {
    const name = typeof r === 'string' ? r : r.name
    return name === 'admin'
  }) ?? false

  // ─── اسم الـ role للعرض ───────────────────────────────
  const userRoleName: string = user?.is_super_admin
    ? 'Super Admin'
    : getRoleName(user?.roles as Role[] | undefined)

  return (
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
          if (item.permission && !isCompanyAdmin && !hasPermission(item.permission)) return null

          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? t(item.key) : undefined}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {!collapsed && (
                <span className="sidebar-item-text">{t(item.key)}</span>
              )}
              {isActive && <span className="sidebar-item-dot" />}
            </Link>
          )
        })}
      </nav>

      {/* ── بيانات المستخدم في الأسفل ─────────────────── */}
      {!collapsed && user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} />
              : user.name?.charAt(0)?.toUpperCase()
            }
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name}</p>
            <p className="sidebar-user-role">{userRoleName}</p>
          </div>
        </div>
      )}
    </aside>
  )
}