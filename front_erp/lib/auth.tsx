'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from './api'

export type User = {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  company_id?: number
  is_super_admin: boolean
  roles: string[]
  permissions: string[]
  company?: {
    id: number
    name: string
    plan: string
    active: boolean
  } | null
}

type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

const TOKEN_KEY = 'erp_token'
const USER_KEY  = 'erp_user'

const AuthContext = createContext<AuthContextType | null>(null)

// ─── تحويل الـ user الجاي من الـ API أو localStorage لـ format نظيف ────
const normalizeUser = (u: any): User => ({
  ...u,
  roles: (u.roles ?? []).map((r: any) =>
    typeof r === 'string' ? r : r.name
  ),
  permissions: u.permissions ?? [],
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser]         = useState<User | null>(null)
  const [token, setToken]       = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)

  // ─── استرجاع الـ session عند فتح التطبيق ─────────────
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser  = localStorage.getItem(USER_KEY)

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        const clean  = normalizeUser(parsed) // ← ينظف الـ roles لو كانت objects قديمة

        setToken(savedToken)
        setUser(clean)

        // يحدّث الـ localStorage بالنسخة النظيفة
        localStorage.setItem(USER_KEY, JSON.stringify(clean))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  // ─── Login ────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })

    if (res.error) return { error: res.error }

    const { token: newToken, user: rawUser } = res.data
    const newUser = normalizeUser(rawUser)

    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))

    setToken(newToken)
    setUser(newUser)

    if (newUser.is_super_admin) {
      router.push('/super-admin')
    } else {
      router.push('/dashboard')
    }

    return {}
  }, [router])

  // ─── Logout ───────────────────────────────────────────
  const logout = useCallback(async () => {
    await api.post('/auth/logout')

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    setToken(null)
    setUser(null)

    router.push('/login')
  }, [router])

  // ─── هل عنده صلاحية؟ ─────────────────────────────────
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    if (user.is_super_admin) return true
    return user.permissions?.includes(permission) ?? false
  }, [user])

  // ─── هل عنده دور؟ ────────────────────────────────────
  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false
    if (user.is_super_admin) return true
    return user.roles?.includes(role) ?? false
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider')
  return ctx
}