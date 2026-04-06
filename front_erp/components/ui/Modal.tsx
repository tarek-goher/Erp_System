'use client'

// ══════════════════════════════════════════════════════════
// Modal — نافذة منبثقة قابلة لإعادة الاستخدام
//
// الاستخدام:
//   <Modal isOpen={open} onClose={() => setOpen(false)} title="عنوان">
//     <p>المحتوى</p>
//   </Modal>
//
// الـ actions prop → أزرار أسفل المودال (حفظ / إلغاء...)
// size prop       → 'sm' | 'md' | 'lg' | 'xl'
// ══════════════════════════════════════════════════════════

import { useEffect, ReactNode } from 'react'

const SIZES: Record<string, string> = {
  sm: '400px',
  md: '520px',
  lg: '720px',
  xl: '960px',
}

interface ModalProps {
  isOpen?:  boolean
  open?:    boolean
  onClose:  () => void
  title:    string
  children: ReactNode
  actions?: ReactNode
  footer?:  ReactNode
  size?:    'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({
  isOpen,
  open,
  onClose,
  title,
  children,
  actions,
  footer,
  size = 'md',
}: ModalProps) {
  const isVisible = isOpen ?? open ?? false
  // ─── إغلاق بزر ESC ────────────────────────────────────
  useEffect(() => {
    if (!isVisible) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isVisible, onClose])

  // ─── منع scroll الـ body لما المودال مفتوح ────────────
  useEffect(() => {
    document.body.style.overflow = isVisible ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <>
      {/* ── الـ overlay الخلفي ─────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* ── نافذة المودال ─────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          zIndex: 1001,
          width: '90%',
          maxWidth: SIZES[size],
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── الـ Header ─────────────────────────────────── */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <h2
            id="modal-title"
            style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ✕
          </button>
        </div>

        {/* ── المحتوى (قابل للـ scroll) ──────────────────── */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>

        {/* ── الأزرار (لو موجودة) ────────────────────────── */}
        {(actions || footer) && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}>
            {actions}
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
