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

export { ConfirmProvider, useConfirm }   from './ConfirmDialog'
