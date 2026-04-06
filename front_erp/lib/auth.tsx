'use client'

// ══════════════════════════════════════════════════════════
// lib/auth.tsx — إدارة حالة المستخدم والـ token في كل التطبيق
// ══════════════════════════════════════════════════════════
// كيف تستخدمه:
//   const { user, login, logout, hasPermission } = useAuth()
//
// الـ token والـ user محفوظين في localStorage
// الـ AuthProvider لازم يكون في app/layout.tsx
// ══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from './api'

// ─── نوع بيانات المستخدم الجاية من الـ API ──────────────
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

// ─── نوع الـ Context اللي بيستخدمه useAuth ──────────────
type AuthContextType = {
  user: User | null               // بيانات المستخدم الحالي
  token: string | null            // الـ Bearer token
  isLoading: boolean              // جاري التحقق من الجلسة
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean  // هل عنده صلاحية؟
  hasRole: (role: string) => boolean              // هل عنده دور؟
}

// ─── مفاتيح التخزين في localStorage ────────────────────
const TOKEN_KEY = 'erp_token'
const USER_KEY  = 'erp_user'

// ─── إنشاء الـ Context ───────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

// ══════════════════════════════════════════════════════════
// AuthProvider — ضعه في app/layout.tsx يحيط كل التطبيق
// ══════════════════════════════════════════════════════════
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)

  // ─── عند فتح التطبيق: ارجع للـ session المحفوظة ──────
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser  = localStorage.getItem(USER_KEY)

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        // البيانات مش صالحة → امسحها
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  // ─── دالة Login → POST /api/auth/login ───────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })

    if (res.error) return { error: res.error }

    // الـ API بترجع: { token, user }
    const { token: newToken, user: newUser } = res.data

    // احفظ في localStorage
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))

    setToken(newToken)
    setUser(newUser)

    // وجّه حسب نوع المستخدم
    if (newUser.is_super_admin) {
      router.push('/super-admin')
    } else {
      router.push('/dashboard')
    }

    return {}
  }, [router])

  // ─── دالة Logout → POST /api/auth/logout ─────────────
  const logout = useCallback(async () => {
    // أرسل طلب logout للـ API (مش مهم لو فشل)
    await api.post('/auth/logout')

    // امسح كل البيانات المحلية
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    setToken(null)
    setUser(null)

    // وجّه لصفحة Login
    router.push('/login')
  }, [router])

  // ─── هل المستخدم عنده صلاحية معينة؟ ─────────────────
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    if (user.is_super_admin) return true // السوبر أدمن عنده كل شيء
    return user.permissions?.includes(permission) ?? false
  }, [user])

  // ─── هل المستخدم عنده دور معين؟ ──────────────────────
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

// ══════════════════════════════════════════════════════════
// useAuth — الـ hook اللي بتستخدمه في أي component
// ══════════════════════════════════════════════════════════
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider')
  return ctx
}
