'use client'

// ══════════════════════════════════════════════════════════
// app/payroll/page.tsx — صفحة الرواتب
// API:
//   GET  /api/payroll                  → قائمة الرواتب
//   POST /api/payroll/generate         → توليد رواتب الشهر
//   POST /api/payroll/{id}/pay         → تسجيل دفع راتب
//   PUT  /api/payroll/{id}             → تعديل راتب
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type PayrollItem = {
  id: number
  employee?: { id: number; name: string; department?: string }
  month: number
  year: number
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: 'pending' | 'paid' | 'cancelled'
  paid_at?: string
}

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function PayrollPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const now = new Date()
  const [payrolls,    setPayrolls]    = useState<PayrollItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [paying,      setPaying]      = useState<number | null>(null)
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear,  setFilterYear]  = useState(now.getFullYear())
  const [filterStatus,setFilterStatus]= useState('')
  const [total,       setTotal]       = useState(0)
  const [stats,       setStats]       = useState({ total_net: 0, paid_count: 0, pending_count: 0 })
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchPayrolls = async () => {
    setLoading(true)
    const p = new URLSearchParams({
      month: String(filterMonth),
      year:  String(filterYear),
      ...(filterStatus && { status: filterStatus }),
    })
    const res = await api.get(`/payroll?${p}`)
    if (res.data) {
      const list: PayrollItem[] = res.data.data ?? res.data
      setPayrolls(list)
      setTotal(res.data.total ?? list.length)
      setStats({
        total_net:     list.reduce((s, p) => s + (p.net_salary ?? 0), 0),
        paid_count:    list.filter(p => p.status === 'paid').length,
        pending_count: list.filter(p => p.status === 'pending').length,
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchPayrolls() }, [filterMonth, filterYear, filterStatus])

  // Generate Payroll
  const handleGenerate = async () => {
    if (!confirm(
      ar
        ? `توليد رواتب شهر ${MONTHS_AR[filterMonth - 1]} ${filterYear}؟`
        : `Generate payroll for ${MONTHS_EN[filterMonth - 1]} ${filterYear}?`
    )) return

    setGenerating(true)
    const res = await api.post('/payroll/generate', { month: filterMonth, year: filterYear })
    setGenerating(false)

    if (res.error) { flash(res.error, false); return }
    flash(
      ar
        ? `✅ تم توليد ${res.data?.count ?? ''} راتب بنجاح`
        : `✅ Generated ${res.data?.count ?? ''} payroll records`
    )
    fetchPayrolls()
  }

  // Mark as Paid
  const handlePay = async (p: PayrollItem) => {
    if (!confirm(ar ? `تسجيل دفع راتب "${p.employee?.name}"؟` : `Mark "${p.employee?.name}" as paid?`)) return
    setPaying(p.id)
    const res = await api.post(`/payroll/${p.id}/pay`, {})
    setPaying(null)
    if (res.error) { flash(res.error, false); return }
    flash(ar ? 'تم تسجيل الدفع ✓' : 'Marked as paid ✓')
    fetchPayrolls()
  }

  const fmt = (n: number) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US').format(n ?? 0)

  const statusColor: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: '#fef3c7', color: '#92400e', label: ar ? 'معلق'   : 'Pending'   },
    paid:      { bg: '#d1fae5', color: '#065f46', label: ar ? 'مدفوع'  : 'Paid'      },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: ar ? 'ملغي'   : 'Cancelled' },
  }

  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: toast.ok ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '14px 22px', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontWeight: 600, fontSize: 14,
          }}>{toast.msg}</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
              {ar ? '💰 كشف الرواتب' : '💰 Payroll'}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
              {ar
                ? `${MONTHS_AR[filterMonth - 1]} ${filterYear} — إجمالي ${total} موظف`
                : `${MONTHS_EN[filterMonth - 1]} ${filterYear} — ${total} employees`}
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: generating ? '#93c5fd' : '#1a56db', color: '#fff', border: 'none',
              borderRadius: 8, padding: '11px 22px', cursor: generating ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {generating && <Spinner />}
            {generating
              ? (ar ? 'جاري التوليد...' : 'Generating...')
              : (ar ? '⚡ توليد رواتب الشهر' : '⚡ Generate Payroll')}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: ar ? 'إجمالي الرواتب' : 'Total Net', value: fmt(stats.total_net) + ' ج.م', icon: '💵', color: '#1a56db' },
            { label: ar ? 'مدفوع'          : 'Paid',      value: stats.paid_count,                icon: '✅', color: '#22c55e' },
            { label: ar ? 'معلق'           : 'Pending',   value: stats.pending_count,             icon: '⏳', color: '#f59e0b' },
          ].map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 24 }}>{card.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(Number(e.target.value))}
            style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
          >
            {(ar ? MONTHS_AR : MONTHS_EN).map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
          >
            <option value="">{ar ? 'كل الحالات' : 'All statuses'}</option>
            <option value="pending">{ar ? 'معلق' : 'Pending'}</option>
            <option value="paid">{ar ? 'مدفوع' : 'Paid'}</option>
            <option value="cancelled">{ar ? 'ملغي' : 'Cancelled'}</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 36 }}>⏳</div>
            <div style={{ marginTop: 12, color: '#6b7280', fontSize: 15 }}>
              {ar ? 'جاري تحميل الرواتب...' : 'Loading payroll...'}
            </div>
          </div>
        ) : payrolls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 48 }}>💼</div>
            <div style={{ marginTop: 12, color: '#6b7280', fontSize: 15 }}>
              {ar
                ? 'لا توجد رواتب لهذا الشهر — اضغط "توليد رواتب الشهر" للبدء'
                : 'No payroll records — click "Generate Payroll" to start'}
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    {[
                      ar ? 'الموظف'        : 'Employee',
                      ar ? 'القسم'         : 'Department',
                      ar ? 'الراتب الأساسي': 'Basic',
                      ar ? 'البدلات'       : 'Allowances',
                      ar ? 'الخصومات'      : 'Deductions',
                      ar ? 'الصافي'        : 'Net Salary',
                      ar ? 'الحالة'        : 'Status',
                      ar ? 'إجراء'         : 'Action',
                    ].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map(p => {
                    const st = statusColor[p.status] ?? statusColor.pending
                    const isPaying = paying === p.id
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background .1s' }}>
                        <td style={{ padding: '13px 16px', fontWeight: 600 }}>
                          {p.employee?.name ?? '—'}
                        </td>
                        <td style={{ padding: '13px 16px', color: '#6b7280', fontSize: 13 }}>
                          {p.employee?.department ?? '—'}
                        </td>
                        <td style={{ padding: '13px 16px' }}>{fmt(p.basic_salary)}</td>
                        <td style={{ padding: '13px 16px', color: '#22c55e' }}>+{fmt(p.allowances)}</td>
                        <td style={{ padding: '13px 16px', color: '#ef4444' }}>-{fmt(p.deductions)}</td>
                        <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 15, color: '#1a56db' }}>
                          {fmt(p.net_salary)}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          {p.status === 'pending' && (
                            <button
                              onClick={() => handlePay(p)}
                              disabled={isPaying}
                              style={{
                                background: isPaying ? '#93c5fd' : '#d1fae5', color: '#065f46',
                                border: 'none', borderRadius: 7, padding: '6px 14px',
                                cursor: isPaying ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12,
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              {isPaying && <Spinner small />}
                              {isPaying ? '...' : (ar ? '💳 دفع' : '💳 Pay')}
                            </button>
                          )}
                          {p.status === 'paid' && (
                            <span style={{ color: '#6b7280', fontSize: 12 }}>
                              {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f9ff', borderTop: '2px solid #bfdbfe' }}>
                    <td colSpan={5} style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14 }}>
                      {ar ? 'الإجمالي' : 'Total'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 15, color: '#1a56db' }}>
                      {fmt(stats.total_net)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}

function Spinner({ small }: { small?: boolean }) {
  const s = small ? 12 : 14
  return (
    <span style={{
      display: 'inline-block', width: s, height: s,
      border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff',
      borderRadius: '50%', animation: 'spin .7s linear infinite',
    }} />
  )
}
