'use client'

// ══════════════════════════════════════════════════════════
// app/suppliers/page.tsx — قائمة الموردين
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

// ── Types ──────────────────────────────────────────────────
type Supplier = {
  id: number
  code: string
  name: string
  type: 'company' | 'individual'
  email?: string
  phone?: string
  city?: string
  country?: string
  payment_method?: string
  status: 'active' | 'suspended' | 'blocked'
  rating?: number
  contact_person?: string
  contact_phone?: string
  purchases_count?: number   // ← مهم لمنع الحذف
  created_at: string
}

// ── Helpers ────────────────────────────────────────────────
function StarRating({ value }: { value: number }) {
  return (
    <span style={{ fontSize: 13, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: s <= value ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  )
}

const STATUS_CFG = {
  active:    { labelAr: 'نشط',    labelEn: 'Active',     bg: '#d1fae5', color: '#065f46' },
  suspended: { labelAr: 'موقوف',  labelEn: 'Suspended',  bg: '#fef3c7', color: '#92400e' },
  blocked:   { labelAr: 'محظور',  labelEn: 'Blocked',    bg: '#fee2e2', color: '#991b1b' },
}

const PAYMENT_LABELS: Record<string, [string, string, string]> = {
  cash:          ['💵', 'نقدي',        'Cash'],
  bank_transfer: ['🏦', 'تحويل بنكي', 'Bank Transfer'],
  deferred:      ['📅', 'آجل',         'Deferred'],
}

// ── Chip ──────────────────────────────────────────────────
function Chip({ label, color = '#eff6ff', text = '#1e40af' }: { label?: string; color?: string; text?: string }) {
  if (!label) return null
  return (
    <span style={{ background: color, color: text, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════
export default function SuppliersPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'
  const router = useRouter()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  // Filters
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [filterType,    setFilterType]    = useState('')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef    = useRef<AbortController | null>(null)
  const lastCallRef = useRef(0)

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchSuppliers = async (overrideSearch?: string) => {
    // ★ إلغاء الـ request القديم
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    // ★ race condition guard
    const callId = ++lastCallRef.current

    setLoading(true)
    const q = overrideSearch ?? search
    const p = new URLSearchParams({
      page: String(page), per_page: '15',
      ...(q             && { search: q }),
      ...(filterStatus  && { status: filterStatus }),
      ...(filterPayment && { payment_method: filterPayment }),
      ...(filterType    && { type: filterType }),
    })
    try {
      const res = await api.get(`/suppliers?${p}`, controller.signal)
      if (callId !== lastCallRef.current) return  // response قديم، اتجاهله
      if (res.data) {
        setSuppliers(res.data.data ?? res.data ?? [])
        setTotal(res.data.total ?? 0)
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      flash(ar ? 'خطأ في تحميل البيانات' : 'Failed to load data', false)
    }
    setLoading(false)
  }

  // ★ قراءة success query param من صفحة الـ form
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    if (success === 'added')   flash(ar ? '✅ تم إضافة المورد'  : '✅ Supplier added')
    if (success === 'updated') flash(ar ? '✅ تم تحديث المورد' : '✅ Supplier updated')
    if (success) window.history.replaceState({}, '', '/suppliers')
  }, [])

  // ★ Debounce: الـ filters والـ page بيتحدثوا فوراً، الـ search بيستنى 350ms
  useEffect(() => {
    fetchSuppliers()
  }, [page, filterStatus, filterPayment, filterType])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchSuppliers(val), 350)
  }

  const hasFilters = search || filterStatus || filterPayment || filterType
  const resetFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterPayment('')
    setFilterType('')
    setPage(1)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    fetchSuppliers('')   // ★ fetch فوري بعد الـ reset
  }

  // ★ منع الحذف لو عنده مشتريات
  const handleDelete = async (s: Supplier) => {
    // لو الـ backend بيرجع purchases_count نتحقق منه
    if ((s.purchases_count ?? 0) > 0) {
      flash(
        ar
          ? `❌ لا يمكن حذف "${s.name}" — لديه ${s.purchases_count} مشتريات مرتبطة`
          : `❌ Cannot delete "${s.name}" — has ${s.purchases_count} linked purchases`,
        false
      )
      return
    }

    if (!confirm(ar ? `حذف "${s.name}"؟` : `Delete "${s.name}"?`)) return

    const res = await api.delete(`/suppliers/${s.id}`)

    // ★ Backend ممكن يرجع خطأ 422 لو في dependencies
    if (res.error) {
      flash(res.error, false)
      return
    }

    flash(ar ? 'تم حذف المورد' : 'Supplier deleted')
    fetchSuppliers()
  }

  const statusCfg = (s: Supplier) => STATUS_CFG[s.status] ?? STATUS_CFG.active

  // ══════════════════════════════════════════════════════════
  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: toast.ok ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '12px 22px', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontWeight: 600,
          }}>{toast.msg}</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>🏭 {ar ? 'الموردون' : 'Suppliers'}</h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
              {ar ? `إجمالي: ${total} مورد` : `Total: ${total} suppliers`}
            </p>
          </div>
          <button
            onClick={() => router.push('/suppliers/new')}
            style={{ background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
          >
            {ar ? '+ إضافة مورد' : '+ Add Supplier'}
          </button>
        </div>

        {/* ── Filters ─────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Search */}
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' }}>
              {ar ? 'بحث' : 'Search'}
            </label>
            <input
              value={search}
              placeholder={ar ? 'الاسم أو الكود...' : 'Name or code...'}
              onChange={e => handleSearchChange(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' as any, outline: 'none' }}
            />
          </div>

          {/* Type */}
          <div style={{ flex: '1 1 130px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' }}>
              {ar ? 'النوع' : 'Type'}
            </label>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">{ar ? 'الكل' : 'All'}</option>
              <option value="company">{ar ? 'شركة' : 'Company'}</option>
              <option value="individual">{ar ? 'فرد' : 'Individual'}</option>
            </select>
          </div>

          {/* Status */}
          <div style={{ flex: '1 1 130px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' }}>
              {ar ? 'الحالة' : 'Status'}
            </label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">{ar ? 'الكل' : 'All'}</option>
              <option value="active">{ar ? 'نشط' : 'Active'}</option>
              <option value="suspended">{ar ? 'موقوف' : 'Suspended'}</option>
              <option value="blocked">{ar ? 'محظور' : 'Blocked'}</option>
            </select>
          </div>

          {/* Payment */}
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase' }}>
              {ar ? 'طريقة الدفع' : 'Payment'}
            </label>
            <select value={filterPayment} onChange={e => { setFilterPayment(e.target.value); setPage(1) }}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">{ar ? 'الكل' : 'All'}</option>
              <option value="cash">{ar ? '💵 نقدي' : '💵 Cash'}</option>
              <option value="bank_transfer">{ar ? '🏦 تحويل بنكي' : '🏦 Bank Transfer'}</option>
              <option value="deferred">{ar ? '📅 آجل' : '📅 Deferred'}</option>
            </select>
          </div>

          {hasFilters && (
            <button onClick={resetFilters} style={{ padding: '9px 16px', border: '1px solid #fca5a5', borderRadius: 7, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
              ✕ {ar ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {filterType    && <Chip label={filterType === 'company' ? (ar ? 'شركة' : 'Company') : (ar ? 'فرد' : 'Individual')} />}
            {filterStatus  && <Chip label={ar ? STATUS_CFG[filterStatus as keyof typeof STATUS_CFG]?.labelAr : STATUS_CFG[filterStatus as keyof typeof STATUS_CFG]?.labelEn} />}
            {filterPayment && <Chip label={ar ? PAYMENT_LABELS[filterPayment]?.[1] : PAYMENT_LABELS[filterPayment]?.[2]} color="#f0fdf4" text="#166534" />}
          </div>
        )}

        {/* ── Table ──────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
            <div style={{ fontSize: 36 }}>⏳</div>
            <div style={{ marginTop: 10 }}>{ar ? 'جاري التحميل...' : 'Loading...'}</div>
          </div>
        ) : suppliers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 48 }}>🏭</div>
            <div style={{ marginTop: 10, color: '#6b7280' }}>{ar ? 'لا يوجد موردون' : 'No suppliers found'}</div>
            {hasFilters && (
              <button onClick={resetFilters} style={{ marginTop: 14, background: '#1a56db', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>
                {ar ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {(ar
                    ? ['الكود', 'المورد', 'التواصل', 'الدفع', 'التقييم', 'الحالة', 'إجراءات']
                    : ['Code',  'Supplier', 'Contact', 'Payment', 'Rating', 'Status', 'Actions']
                  ).map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: ar ? 'right' : 'left', fontWeight: 700, fontSize: 13, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => {
                  const cfg = statusCfg(s)
                  const pm  = PAYMENT_LABELS[s.payment_method ?? '']
                  const hasPurchases = (s.purchases_count ?? 0) > 0

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      {/* Code */}
                      <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {s.code || '—'}
                      </td>

                      {/* Supplier info */}
                      <td style={{ padding: '13px 16px', minWidth: 180 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                          {s.type === 'company' ? '🏢' : '👤'} {s.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {s.type === 'company' ? (ar ? 'شركة' : 'Company') : (ar ? 'فرد' : 'Individual')}
                          {(s.city || s.country) && ` · 📍 ${[s.city, s.country].filter(Boolean).join(', ')}`}
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '13px 16px', minWidth: 160 }}>
                        {s.contact_person && (
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>👤 {s.contact_person}</div>
                        )}
                        {(s.phone || s.contact_phone) && (
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>📞 {s.phone || s.contact_phone}</div>
                        )}
                        {s.email && (
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>✉️ {s.email}</div>
                        )}
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '13px 16px' }}>
                        {pm ? (
                          <span style={{ background: '#f3f4f6', color: '#374151', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {pm[0]} {ar ? pm[1] : pm[2]}
                          </span>
                        ) : <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>

                      {/* Rating */}
                      <td style={{ padding: '13px 16px' }}>
                        {(s.rating ?? 0) > 0 ? <StarRating value={s.rating!} /> : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {ar ? cfg.labelAr : cfg.labelEn}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => router.push(`/suppliers/${s.id}`)}
                            style={{ background: '#eff6ff', color: '#1a56db', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            ✏️ {ar ? 'تعديل' : 'Edit'}
                          </button>

                          {/* ★ زرار الحذف — بيتغير لو عنده مشتريات */}
                          <button
                            onClick={() => handleDelete(s)}
                            title={hasPurchases ? (ar ? 'لديه مشتريات — لا يمكن الحذف' : 'Has purchases — cannot delete') : ''}
                            style={{
                              background:    hasPurchases ? '#f9fafb' : '#fef2f2',
                              color:         hasPurchases ? '#9ca3af' : '#dc2626',
                              border:        `1px solid ${hasPurchases ? '#e5e7eb' : 'transparent'}`,
                              borderRadius:  6, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                              cursor:        hasPurchases ? 'not-allowed' : 'pointer',
                              pointerEvents: hasPurchases ? 'none'        : 'auto',
                            }}>
                            🗑️ {hasPurchases ? `(${s.purchases_count})` : ''}
                          </button>

                          <button onClick={() => router.push(`/suppliers/view/${s.id}`)}
  style={{ background: '#f0fdf4', color: '#059669', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
  👁️ {ar ? 'عرض' : 'View'}
</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (() => {
          const totalPages = Math.ceil(total / 15)
          return (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #d1d5db', cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#fff' }}>
                {ar ? 'السابق' : 'Prev'}
              </button>
              <span style={{ padding: '8px 14px', color: '#6b7280' }}>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #d1d5db', cursor: page >= totalPages ? 'not-allowed' : 'pointer', background: '#fff' }}>
                {ar ? 'التالي' : 'Next'}
              </button>
            </div>
          )
        })()}

      </div>
    </ERPLayout>
  )
}