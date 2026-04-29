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
  faRotateLeft,
  faCommentDots,
  faBook,
  faCalendarDays,
  faCalendarCheck,
  faSitemap,
  faAddressBook,
  faArrowRightArrowLeft,
  faClock,
  faBell,
  faConciergeBell,
  faFileInvoiceDollar,
  faChartPie,
  faShieldHalved,
  faTag,
  faListCheck,
  faStore,
  faDiagramProject,
  faFileSignature,
  faReceipt,
  faUtensils,
  faCreditCard,
  faCodeBranch,
  faJournalWhills,
  faWrench,
  faTools,
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
  { path: '/contacts', icon: faAddressBook, key: 'contacts', permission: null },
  { path: '/notifications', icon: faBell, key: 'notifications', permission: null },
  { path: '/sales', icon: faSackDollar, key: 'sales', permission: 'manage-sales' },
  { path: '/returns', icon: faRotateLeft, key: 'returns', permission: 'manage-sales' },
  { path: '/quotations', icon: faFileCircleCheck, key: 'quotations', permission: 'manage-sales' },
  { path: '/purchases', icon: faCartShopping, key: 'purchases', permission: 'manage-purchases' },
  { path: '/suppliers', icon: faHandshake, key: 'suppliers', permission: 'manage-purchases' },
  { path: '/inventory', icon: faBoxesStacked, key: 'inventory', permission: 'manage-products' },
  { path: '/stock-movements', icon: faArrowRightArrowLeft, key: 'stock_movements', permission: 'manage-products' },
  { path: '/warehouses', icon: faWarehouse, key: 'warehouses', permission: 'manage-products' },
  { path: '/accounting', icon: faCalculator, key: 'accounting', permission: 'manage-accounting' },
  { path: '/accounting/general-ledger', icon: faScaleBalanced, key: 'general_ledger', permission: 'manage-accounting' },
  { path: '/accounting/journal-entries', icon: faJournalWhills, key: 'journal_entries', permission: 'manage-accounting' },
  { path: '/accounting/purchases_Invoices', icon: faFileInvoiceDollar, key: 'purchases_invoices', permission: 'manage-accounting' },
  { path: '/accounting/trial-balance', icon: faScaleBalanced, key: 'trial_balance', permission: 'manage-accounting' },
  { path: '/accounting/income-statement', icon: faChartLine, key: 'income_statement', permission: 'manage-accounting' },
  { path: '/accounting/balance-sheet', icon: faBuilding, key: 'balance_sheet', permission: 'manage-accounting' },
  { path: '/accounting/bank-reconciliation', icon: faCodeBranch, key: 'bank_reconciliation', permission: 'manage-accounting' },
  { path: '/accounting/currencies', icon: faSackDollar, key: 'currencies', permission: 'manage-accounting' },
  { path: '/budgets', icon: faChartLine, key: 'budgets', permission: 'manage-accounting' },
  { path: '/fixed-assets', icon: faBuilding, key: 'fixed_assets', permission: 'manage-accounting' },
  { path: '/hr', icon: faUsers, key: 'hr', permission: 'manage-hr' },
  { path: '/hr/attendance', icon: faCalendarDays, key: 'attendance', permission: 'manage-hr' },
  { path: '/hr/leave-requests', icon: faCalendarCheck, key: 'leave_requests', permission: 'manage-hr' },
  { path: '/hr/org-chart', icon: faSitemap, key: 'org_chart', permission: 'manage-hr' },
  { path: '/live-chat', icon: faCommentDots, key: 'live_chat', permission: null },
{ path: '/helpdesk/knowledge-base', icon: faBook, key: 'knowledge_base', permission: 'manage-projects' },
{ path: '/helpdesk/csat', icon: faStar, key: 'csat', permission: 'manage-projects' },
  { path: '/payroll', icon: faMoneyBillWave, key: 'payroll', permission: 'manage-hr' },
  { path: '/timesheets', icon: faClock, key: 'timesheets', permission: 'manage-hr' },
  { path: '/recruitment', icon: faUserTie, key: 'recruitment', permission: 'manage-hr' },
  { path: '/appraisals', icon: faStar, key: 'appraisals', permission: 'manage-hr' },
  { path: '/taxes', icon: faScaleBalanced, key: 'taxes', permission: 'manage-accounting' },
  { path: '/loyalty', icon: faShoppingBag, key: 'loyalty', permission: 'manage-sales' },
  { path: '/branches', icon: faRoute, key: 'branches', permission: 'manage-settings' },
  { path: '/crm', icon: faComments, key: 'crm', permission: 'manage-crm' },
  { path: '/projects', icon: faClipboardList, key: 'projects', permission: 'manage-projects' },
  { path: '/helpdesk', icon: faHeadset, key: 'helpdesk', permission: 'manage-projects' },
  { path: '/helpdesk/analytics', icon: faChartPie, key: 'helpdesk_analytics', permission: 'manage-projects' },
  { path: '/helpdesk/escalation-rules', icon: faShieldHalved, key: 'escalation_rules', permission: 'manage-projects' },
  { path: '/helpdesk/sla-policies', icon: faListCheck, key: 'sla_policies', permission: 'manage-projects' },
  { path: '/helpdesk/workflows', icon: faBolt, key: 'workflows', permission: 'manage-projects' },
  { path: '/helpdesk/tags', icon: faTag, key: 'tags', permission: 'manage-projects' },
  { path: '/helpdesk/service-catalog', icon: faConciergeBell, key: 'service_catalog', permission: 'manage-projects' },
  { path: '/service-desk', icon: faHeadset, key: 'service_desk', permission: 'manage-projects' },
  { path: '/manufacturing', icon: faBoxArchive, key: 'manufacturing', permission: 'manage-warehouses' },
  { path: '/manufacturing/bom', icon: faDiagramProject, key: 'bom', permission: 'manage-warehouses' },
  { path: '/manufacturing/work-centers', icon: faWrench, key: 'work_centers', permission: 'manage-warehouses' },
  { path: '/manufacturing/routing', icon: faRoute, key: 'routing', permission: 'manage-warehouses' },
  { path: '/field-service/requests', icon: faTools, key: 'field_service', permission: 'manage-projects' },
  { path: '/ecommerce', icon: faStore, key: 'ecommerce', permission: 'manage-sales' },
  { path: '/plm', icon: faDiagramProject, key: 'plm', permission: 'manage-warehouses' },
  { path: '/sign', icon: faFileSignature, key: 'sign', permission: null },
  { path: '/expenses', icon: faReceipt, key: 'expenses', permission: 'manage-hr' },
  { path: '/lunch', icon: faUtensils, key: 'lunch', permission: 'manage-hr' },
  { path: '/subscriptions', icon: faCreditCard, key: 'subscriptions', permission: 'manage-sales' },
  { path: '/fleet', icon: faTruck, key: 'fleet', permission: 'manage-warehouses' },
  { path: '/marketing', icon: faBullhorn, key: 'marketing', permission: 'manage-warehouses' },
  { path: '/pos', icon: faDesktop, key: 'pos', permission: 'manage-pos' },
  { path: '/email-inbox', icon: faInbox, key: 'email_inbox', permission: null },
  { path: '/analytics/bi', icon: faChartColumn, key: 'bi_analytics', permission: 'view-reports' },
  { path: '/portal', icon: faUsers, key: 'customer_portal', permission: 'manage-sales' },
  { path: '/social-media', icon: faBullhorn, key: 'social_media', permission: 'manage-settings' },
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

  const isBranchManager = user?.roles?.some((role: Role) => {
    const name = typeof role === 'string' ? role : role.name
    return name === 'branch_manager'
  }) ?? false

  // الصلاحيات المسموح بها لمدير الفرع
  const BRANCH_MANAGER_ALLOWED = [
    '/dashboard', '/users', '/sales', '/purchases', '/inventory',
    '/warehouses', '/stock-movements', '/hr', '/hr/attendance',
    '/hr/leave-requests', '/reports', '/notifications', '/settings',
  ]

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
          // Branch Manager: يشوف بس الصفحات المسموحة ليه
          if (isBranchManager && !isCompanyAdmin) {
            const allowed = BRANCH_MANAGER_ALLOWED.some(p => item.path === p || item.path.startsWith(p + '/'))
            if (!allowed) return null
          } else if (item.permission && !isCompanyAdmin && !hasPermission(item.permission)) return null

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