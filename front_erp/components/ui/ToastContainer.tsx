'use client'

// ══════════════════════════════════════════════════════════
// ToastContainer — للاستخدام المحلي (legacy)
// ══════════════════════════════════════════════════════════
// ⚠️ الطريقة الموصى بها دلوقتي هي ToastContext:
//    import { useToast } from '@/hooks/useToast'
//    const toast = useToast()
//    toast.success('تم الحفظ')
//
// الملف ده موجود للتوافق مع الكود القديم فقط.
// ══════════════════════════════════════════════════════════

import { Toast } from '../../hooks/useToast'

const TOAST_CONFIG: Record<string, Record<string, string>> = {
  success: { bg: 'var(--color-success-light)', border: 'var(--color-success)', text: 'var(--color-success)', icon: '✅' },
  error:   { bg: 'var(--color-danger-light)',  border: 'var(--color-danger)',  text: 'var(--color-danger)',  icon: '❌' },
  warning: { bg: 'var(--color-warning-light)', border: 'var(--color-warning)', text: 'var(--color-warning)', icon: '⚠️' },
  info:    { bg: 'var(--color-info-light)',    border: 'var(--color-info)',    text: 'var(--color-info)',    icon: 'ℹ️' },
}

interface ToastContainerProps {
  toasts: Toast[]
  remove: (id: string) => void
}

export function ToastContainer({ toasts, remove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
      maxWidth: 380,
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => {
        const cfg = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info
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
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{cfg.icon}</span>
            <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 500 }}>
              {toast.message}
            </span>
            <button
              onClick={e => { e.stopPropagation(); remove(toast.id) }}
              style={{ background: 'none', border: 'none', color: cfg.text, fontSize: '1rem', cursor: 'pointer', padding: 0 }}
            >✕</button>
          </div>
        )
      })}
    </div>
  )
}
