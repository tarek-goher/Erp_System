'use client'

// ══════════════════════════════════════════════════════════
// ConfirmDialog — مودال تأكيد قابل لإعادة الاستخدام
//
// بدل ما تكتب مودال حذف في كل صفحة، استخدم الـ hook ده:
//
//   const confirm = useConfirm()
//
//   const handleDelete = async () => {
//     const ok = await confirm({
//       title:   'تأكيد الحذف',
//       message: 'هل أنت متأكد؟ لا يمكن التراجع.',
//       danger:  true,
//     })
//     if (!ok) return
//     // امضي في الحذف
//   }
//
//   // في الـ JSX:
//   <ConfirmDialogContainer />
// ══════════════════════════════════════════════════════════

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { Modal } from './Modal'

interface ConfirmOptions {
  title?:   string
  message:  string
  danger?:  boolean          // لو true → زر التأكيد بيبقى أحمر
  confirmLabel?: string
  cancelLabel?:  string
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

// ─── Provider — حطه في layout.tsx مع ToastProvider ────────
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts,    setOpts]    = useState<ConfirmOptions | null>(null)
  const [resolve, setResolve] = useState<((v: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((res) => {
      setOpts(options)
      setResolve(() => res)  // نحفظ الـ resolve عشان نستدعيها لما يضغط
    })
  }, [])

  const handleClose = (answer: boolean) => {
    resolve?.(answer)
    setOpts(null)
    setResolve(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {opts && (
        <Modal
          isOpen
          onClose={() => handleClose(false)}
          title={opts.title ?? 'تأكيد'}
          size="sm"
          actions={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => handleClose(false)}
              >
                {opts.cancelLabel ?? 'إلغاء'}
              </button>
              <button
                className={`btn ${opts.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => handleClose(true)}
              >
                {opts.confirmLabel ?? 'تأكيد'}
              </button>
            </>
          }
        >
          <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {opts.message}
          </p>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

// ─── Hook للاستخدام في أي صفحة ────────────────────────────
export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm: لازم تحط <ConfirmProvider> في layout.tsx')
  return ctx.confirm
}

// ─── ConfirmDialog كـ component مباشر (للصفحات اللي بتستخدمه كـ JSX) ──
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  danger = true,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  danger?: boolean
}) {
  if (!open) return null
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title ?? 'تأكيد'}
      size="sm"
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose() }}>تأكيد</button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  )
}
