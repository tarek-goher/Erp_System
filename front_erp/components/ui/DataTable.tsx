'use client'

import { useState } from 'react'

// ══════════════════════════════════════════════════════════
// DataTable — جدول متكامل مع pagination + sorting + search
//
// الاستخدام:
//   <DataTable
//     headers={['الاسم', 'الإيميل', 'الحالة']}
//     keys={['name', 'email', 'status']}
//     rows={customers}
//     total={100}
//     page={page}
//     perPage={20}
//     onPageChange={setPage}
//     onSearch={setSearch}
//     onSort={(key, dir) => ...}
//     renderCell={(key, value, row) => ...}   // اختياري: لتخصيص خلية معينة
//   />
// ══════════════════════════════════════════════════════════

export type SortDir = 'asc' | 'desc' | null

export interface DataTableColumn {
  label: string       // النص اللي يظهر في الـ header
  key: string         // اسم الـ field في الـ row object
  sortable?: boolean  // هل ممكن يتسرت؟ (default: false)
  width?: string      // عرض العمود (اختياري)
}

interface DataTableProps {
  columns: DataTableColumn[]
  rows: Record<string, any>[]
  total?: number       // إجمالي السجلات (للـ pagination)
  page?: number        // الصفحة الحالية (1-based)
  perPage?: number     // عدد السجلات في الصفحة
  loading?: boolean
  emptyText?: string
  className?: string
  onPageChange?: (page: number) => void
  onSearch?: (q: string) => void
  onSort?: (key: string, dir: SortDir) => void
  // لتخصيص خلية معينة — بترجع JSX بدل القيمة الافتراضية
  renderCell?: (key: string, value: any, row: Record<string, any>) => React.ReactNode
}

export function DataTable({
  columns,
  rows,
  total = 0,
  page = 1,
  perPage = 20,
  loading = false,
  emptyText = 'لا توجد بيانات',
  className = '',
  onPageChange,
  onSearch,
  onSort,
  renderCell,
}: DataTableProps) {
  const [sortKey, setSortKey]   = useState<string | null>(null)
  const [sortDir, setSortDir]   = useState<SortDir>(null)
  const [searchVal, setSearch]  = useState('')

  const totalPages = Math.ceil(total / perPage)

  // ─── معالجة النقر على header للـ sort ─────────────────
  const handleSort = (key: string) => {
    let newDir: SortDir = 'asc'
    if (sortKey === key) {
      newDir = sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc'
    }
    setSortKey(newDir ? key : null)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  // ─── معالجة البحث ─────────────────────────────────────
  const handleSearch = (val: string) => {
    setSearch(val)
    onSearch?.(val)
  }

  // ─── أيقونة الـ sort ───────────────────────────────────
  const SortIcon = ({ col }: { col: DataTableColumn }) => {
    if (!col.sortable) return null
    if (sortKey !== col.key) return <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>⇅</span>
    return (
      <span style={{ color: 'var(--color-primary)', marginRight: 4 }}>
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div className={className}>
      {/* ── شريط البحث ────────────────────────────────── */}
      {onSearch && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={searchVal}
            onChange={e => handleSearch(e.target.value)}
            placeholder="🔍 بحث..."
            style={{
              width: '100%',
              maxWidth: 320,
              padding: '0.6rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
        </div>
      )}

      {/* ── الجدول ────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        {/* overlay لما بيكون loading */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(var(--bg-card-rgb, 255,255,255), 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, borderRadius: 'var(--radius-md)',
          }}>
            <span style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}>⏳</span>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-hover)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    padding: '0.85rem 1rem',
                    textAlign: 'right',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    width: col.width,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <SortIcon col={col} />
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.95rem',
                  }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={row.id ?? rowIdx}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '0.9rem 1rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        verticalAlign: 'middle',
                      }}
                    >
                      {renderCell
                        ? renderCell(col.key, row[col.key], row)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────── */}
      {onPageChange && totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          {/* معلومة العدد */}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            عرض {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} من {total}
          </span>

          {/* أزرار الصفحات */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <PagBtn label="«" disabled={page === 1} onClick={() => onPageChange(1)} />
            <PagBtn label="‹" disabled={page === 1} onClick={() => onPageChange(page - 1)} />

            {buildPageNumbers(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} style={{ padding: '0 0.4rem', color: 'var(--text-muted)' }}>…</span>
              ) : (
                <PagBtn
                  key={p}
                  label={String(p)}
                  active={p === page}
                  onClick={() => onPageChange(Number(p))}
                />
              )
            )}

            <PagBtn label="›" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} />
            <PagBtn label="»" disabled={page === totalPages} onClick={() => onPageChange(totalPages)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── زر pagination صغير ────────────────────────────────────
function PagBtn({
  label, onClick, disabled = false, active = false
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '2rem',
        height: '2rem',
        padding: '0 0.5rem',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--color-primary)' : 'var(--bg-card)',
        color: active ? '#fff' : disabled ? 'var(--text-muted)' : 'var(--text-primary)',
        fontSize: '0.85rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ─── بناء أرقام الصفحات مع ... ─────────────────────────────
function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)
  return pages
}
