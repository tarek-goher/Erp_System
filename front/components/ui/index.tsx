// ══════════════════════════════════════════════════════════
// components/ui/index.ts — نقطة التصدير المركزية
//
// الاستخدام:
//   import { DataTable, Modal, StatCard, LoadingSpinner, ConfirmDialog } from '@/components/ui'
// ══════════════════════════════════════════════════════════

export { DataTable }                     from './DataTable'
export type { DataTableColumn, SortDir } from './DataTable'

export { Modal }                         from './Modal'

export { StatCard }                      from './StatCard'

export { LoadingSpinner }                from './LoadingSpinner'

export { ToastContainer }                from './ToastContainer'

export { ConfirmProvider, useConfirm, ConfirmDialog } from './ConfirmDialog'

// ConfirmDialog alias


// ── Inline components (مش عندهم ملفات منفصلة) ──────────
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="input"
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'بحث...'}
      style={{ minWidth: 220 }}
    />
  )
}

export function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`badge ${color || 'badge-muted'}`}>{children}</span>
  )
}

export function EmptyState({ icon, text, title, description }: { icon?: string; text?: string; title?: string; description?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon || '📭'}</div>
      <p className="empty-state-text">{title || text || ''}</p>
      {description && <p className="empty-state-text" style={{ fontSize: '0.8rem', opacity: 0.7 }}>{description}</p>}
    </div>
  )
}
