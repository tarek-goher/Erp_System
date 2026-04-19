'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const SIZE_CLASSES: Record<string, string> = {
  sm: 'modal-sm',
  md: 'modal-md',
  lg: 'modal-lg',
  xl: 'modal-xl',
}

interface ModalProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  bodyClassName?: string
  closeOnOverlay?: boolean
  hideCloseButton?: boolean
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
  className = '',
  bodyClassName = '',
  closeOnOverlay = true,
  hideCloseButton = false,
}: ModalProps) {
  const isVisible = isOpen ?? open ?? false

  useEffect(() => {
    if (!isVisible) return

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isVisible, onClose])

  useEffect(() => {
    if (!isVisible) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isVisible])

  if (!isVisible || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal ${SIZE_CLASSES[size]} ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ×
            </button>
          )}
        </div>

        <div className={`modal-body ${bodyClassName}`.trim()}>
          {children}
        </div>

        {(actions || footer) && (
          <div className="modal-footer">
            {actions}
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
