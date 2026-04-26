'use client'

import { ReactNode, useEffect } from 'react'
import ERPFrame from './ERPFrame'
import { useERPLayoutContext } from './ERPLayoutContext'

export default function ERPLayout({
  children,
  pageTitle,
}: {
  children: ReactNode
  pageTitle?: string
}) {
  const shellContext = useERPLayoutContext()

  useEffect(() => {
    if (!shellContext?.inShell) return

    shellContext.setPageTitle(pageTitle)

    return () => {
      shellContext.setPageTitle(undefined)
    }
  }, [pageTitle, shellContext])

  if (shellContext?.inShell) {
    return <>{children}</>
  }

  return (
    <ERPFrame pageTitle={pageTitle}>
      {children}
    </ERPFrame>
  )
}
