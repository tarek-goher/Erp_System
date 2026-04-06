'use client'

// ══════════════════════════════════════════════════════════
// ToastContext — نظام الإشعارات المشترك بين كل الصفحات
//
// الاستخدام:
//   1. حط <ToastProvider> في layout.tsx الرئيسي
//   2. في أي صفحة: const toast = useToast()
//      toast.success('تم الحفظ')
//      toast.error('حدث خطأ')
//      toast.info('معلومة')
//      toast.warning('تحذير')
// ══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// ─── أنواع البيانات ────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  toasts: Toast[]
  show:    (message: string, type?: ToastType, duration?: number) => void
  remove:  (id: string) => void
  success: (message: string, duration?: number) => void
  error:   (message: string, duration?: number) => void
  info:    (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

// ─── إنشاء الـ Context ─────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

// ─── إعدادات الألوان والأيقونات ────────────────────────────
const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; border: string; color: string }> = {
  success: { icon: '✅', bg: 'var(--color-success-light)', border: 'var(--color-success)', color: 'var(--color-success)' },
  error:   { icon: '❌', bg: 'var(--color-danger-light)',  border: 'var(--color-danger)',  color: 'var(--color-danger)'  },
  warning: { icon: '⚠️', bg: 'var(--color-warning-light)', border: 'var(--color-warning)', color: 'var(--color-warning)' },
  info:    { icon: 'ℹ️', bg: 'var(--color-info-light)',    border: 'var(--color-info)',    color: 'var(--color-info)'    },
}

// ══════════════════════════════════════════════════════════
// ToastProvider — حطه في layout.tsx الرئيسي مرة واحدة
// ══════════════════════════════════════════════════════════
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // ─── إضافة إشعار جديد ─────────────────────────────────
  const show = useCallback((
    message: string,
    type: ToastType = 'info',
    duration = 3500
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, type, duration }])

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }, [])

  // ─── إزالة إشعار بالـ id ──────────────────────────────
  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ─── shortcuts مريحة ──────────────────────────────────
  const success = useCallback((msg: string, dur?: number) => show(msg, 'success', dur), [show])
  const error   = useCallback((msg: string, dur?: number) => show(msg, 'error',   dur), [show])
  const info    = useCallback((msg: string, dur?: number) => show(msg, 'info',    dur), [show])
  const warning = useCallback((msg: string, dur?: number) => show(msg, 'warning', dur), [show])

  return (
    <ToastContext.Provider value={{ toasts, show, remove, success, error, info, warning }}>
      {children}
      <ToastList toasts={toasts} remove={remove} />
    </ToastContext.Provider>
  )
}

// ══════════════════════════════════════════════════════════
// useToast — الـ hook اللي تستخدمه في أي صفحة
// ══════════════════════════════════════════════════════════
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast: لازم تحط <ToastProvider> في layout.tsx')
  return ctx
}

// ══════════════════════════════════════════════════════════
// ToastList — المكون اللي بيعرض الإشعارات
// (مش محتاج تستخدمه بنفسك، الـ Provider بيشيله تلقائي)
// ══════════════════════════════════════════════════════════
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(110%); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '0.6rem',
        maxWidth: 380,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => {
          const cfg = TOAST_CONFIG[toast.type]
          return (
            <div
              key={toast.id}
              onClick={() => remove(toast.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                animation: 'toast-in 0.25s ease-out',
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{cfg.icon}</span>
              <span style={{
                flex: 1,
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: 500,
                lineHeight: 1.4,
              }}>
                {toast.message}
              </span>
              <button
                onClick={e => { e.stopPropagation(); remove(toast.id) }}
                style={{
                  background: 'none', border: 'none',
                  color: cfg.color, fontSize: '1rem',
                  cursor: 'pointer', padding: 0, flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
