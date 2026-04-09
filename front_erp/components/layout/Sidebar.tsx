'use client'

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBolt,
  faBoxArchive,
  faBoxesStacked,
  faBullhorn,
  faBuilding,
  faCalculator,
  faCartShopping,
  faChartColumn,
  faChartLine,
  faClipboardCheck,
  faClipboardList,
  faComments,
  faDesktop,
  faFileCircleCheck,
  faGear,
  faHandshake,
  faHeadset,
  faInbox,
  faMoneyBillWave,
  faRobot,
  faRoute,
  faSackDollar,
  faScaleBalanced,
  faShoppingBag,
  faStar,
  faTruck,
  faUserGroup,
  faUserTie,
  faUsers,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'
import './Sidebar.css'

type Role = string | { id: number; name: string; pivot?: any }

const NAV_ITEMS: Array<{
  path: string
  icon: IconDefinition
  key: string
  permission: string | null
}> = [
  { path: '/dashboard', icon: faChartColumn, key: 'dashboard', permission: null },
  { path: '/sales', icon: faSackDollar, key: 'sales', permission: 'manage-sales' },
  { path: '/quotations', icon: faFileCircleCheck, key: 'quotations', permission: 'manage-sales' },
  { path: '/purchases', icon: faCartShopping, key: 'purchases', permission: 'manage-purchases' },
  { path: '/suppliers', icon: faHandshake, key: 'suppliers', permission: 'manage-purchases' },
  { path: '/inventory', icon: faBoxesStacked, key: 'inventory', permission: 'manage-products' },
  { path: '/warehouses', icon: faWarehouse, key: 'warehouses', permission: 'manage-products' },
  { path: '/accounting', icon: faCalculator, key: 'accounting', permission: 'manage-accounting' },
  { path: '/budgets', icon: faChartLine, key: 'budgets', permission: 'manage-accounting' },
  { path: '/fixed-assets', icon: faBuilding, key: 'fixed_assets', permission: 'manage-accounting' },
  { path: '/hr', icon: faUsers, key: 'hr', permission: 'manage-hr' },
  { path: '/payroll', icon: faMoneyBillWave, key: 'payroll', permission: 'manage-hr' },
  { path: '/recruitment', icon: faUserTie, key: 'recruitment', permission: 'manage-hr' },
  { path: '/appraisals', icon: faStar, key: 'appraisals', permission: 'manage-hr' },
  { path: '/taxes', icon: faScaleBalanced, key: 'taxes', permission: 'manage-accounting' },
  { path: '/loyalty', icon: faShoppingBag, key: 'loyalty', permission: 'manage-sales' },
  { path: '/branches', icon: faRoute, key: 'branches', permission: 'manage-settings' },
  { path: '/crm', icon: faComments, key: 'crm', permission: 'manage-crm' },
  { path: '/projects', icon: faClipboardList, key: 'projects', permission: 'manage-projects' },
  { path: '/helpdesk', icon: faHeadset, key: 'helpdesk', permission: 'manage-projects' },
  { path: '/manufacturing', icon: faBoxArchive, key: 'manufacturing', permission: 'manage-warehouses' },
  { path: '/fleet', icon: faTruck, key: 'fleet', permission: 'manage-warehouses' },
  { path: '/marketing', icon: faBullhorn, key: 'marketing', permission: 'manage-warehouses' },
  { path: '/pos', icon: faDesktop, key: 'pos', permission: 'manage-pos' },
  { path: '/email-inbox', icon: faInbox, key: 'email_inbox', permission: null },
  { path: '/reports', icon: faChartLine, key: 'reports', permission: 'view-reports' },
  { path: '/ai-assistant', icon: faRobot, key: 'ai_assistant', permission: null },
  { path: '/users', icon: faUserGroup, key: 'users', permission: 'manage-users' },
  { path: '/audit-log', icon: faClipboardCheck, key: 'audit_log', permission: 'manage-users' },
  { path: '/settings', icon: faGear, key: 'settings', permission: null },
]

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const { t, dir } = useI18n()
  const { user, hasPermission } = useAuth()

  const getRoleName = (roles: Role[] | undefined): string => {
    if (!roles || roles.length === 0) return 'User'
    const first = roles[0]
    return typeof first === 'string' ? first : (first.name ?? 'User')
  }

  const isCompanyAdmin = user?.roles?.some((role: Role) => {
    const name = typeof role === 'string' ? role : role.name
    return name === 'admin'
  }) ?? false

  const userRoleName: string = user?.is_super_admin
    ? 'Super Admin'
    : getRoleName(user?.roles as Role[] | undefined)

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      data-dir={dir}
    >
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">
              <FontAwesomeIcon icon={faBolt} />
            </span>
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
              <span className="sidebar-item-icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              {!collapsed && <span className="sidebar-item-text">{t(item.key)}</span>}
              {isActive && <span className="sidebar-item-dot" />}
            </Link>
          )
        })}
      </nav>

      {!collapsed && user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} />
              : user.name?.charAt(0)?.toUpperCase()}
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
