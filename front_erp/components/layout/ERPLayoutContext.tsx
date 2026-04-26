'use client'

import { createContext, useContext } from 'react'

type ERPLayoutContextValue = {
  inShell: boolean
  pageTitle?: string
  setPageTitle: (title?: string) => void
}

export const ERPLayoutContext = createContext<ERPLayoutContextValue | null>(null)

export function useERPLayoutContext() {
  return useContext(ERPLayoutContext)
}
