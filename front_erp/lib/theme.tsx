'use client'

// ══════════════════════════════════════════════════════════
// lib/theme.tsx — إدارة الـ Dark/Light Mode
// ══════════════════════════════════════════════════════════
// كيف تستخدمه:
//   const { theme, toggleTheme, isDark } = useTheme()
//
// الـ ThemeProvider بيضيف class="dark" على الـ html element
// وبيحفظ اختيار المستخدم في localStorage
// ══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ─── نوع الثيم ──────────────────────────────────────────
export type Theme = 'light' | 'dark'

// ─── نوع الـ Context ──────────────────────────────────────
type ThemeContextType = {
  theme: Theme              // الثيم الحالي
  isDark: boolean           // هل هو داكن؟
  toggleTheme: () => void  // تبديل الثيم
  setTheme: (t: Theme) => void // تعيين ثيم معين
}

// ─── إنشاء الـ Context ───────────────────────────────────
const ThemeContext = createContext<ThemeContextType | null>(null)

// ══════════════════════════════════════════════════════════
// ThemeProvider — ضعه في app/layout.tsx
// ══════════════════════════════════════════════════════════
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  // اقرأ الثيم المحفوظ عند فتح التطبيق
  useEffect(() => {
    const saved = localStorage.getItem('erp_theme') as Theme | null

    // لو مش محفوظ → اتبع تفضيل النظام
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initial = saved || preferred

    setThemeState(initial)
    applyTheme(initial)
  }, [])

  // طبّق الثيم على الـ HTML element
  function applyTheme(t: Theme) {
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // دالة تعيين الثيم
  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('erp_theme', t)
    applyTheme(t)
  }

  // دالة التبديل
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ══════════════════════════════════════════════════════════
// useTheme — الـ hook اللي بتستخدمه في أي component
// ══════════════════════════════════════════════════════════
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme يجب أن يُستخدم داخل ThemeProvider')
  return ctx
}
