'use client'

import { ReactNode, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import ERPFrame from './ERPFrame'
import { ERPLayoutContext } from './ERPLayoutContext'

const EXCLUDED_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/super-admin',
  '/offline',
]

function shouldUseShell(pathname: string | null) {
  if (!pathname) return false
  if (pathname === '/') return false

  return !EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState<string | undefined>(undefined)
  const inShell = shouldUseShell(pathname)

  const contextValue = useMemo(
    () => ({
      inShell,
      pageTitle,
      setPageTitle,
    }),
    [inShell, pageTitle]
  )

  if (!inShell) {
    return children
  }

  return (
    <ERPLayoutContext.Provider value={contextValue}>
      <ERPFrame pageTitle={pageTitle}>
        {children}
      </ERPFrame>
    </ERPLayoutContext.Provider>
  )
}
