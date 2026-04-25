'use client'

// ══════════════════════════════════════════════════════════
// app/suppliers/view/[id]/page.tsx — عرض بيانات المورد
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ERPLayout from '../../../../components/layout/ERPLayout'
import { api } from '../../../../lib/api'
import { useI18n } from '../../../../lib/i18n'

// ── Types ──────────────────────────────────────────────────
type Supplier = {
  id: number
  code: string
  name: string
  type: 'company' | 'individual'
  status: 'active' | 'suspended' | 'blocked'
  rating: number
  email?: string
  phone?: string
  country?: string
  city?: string
  street?: string
  contact_person?: string
  contact_phone?: string
  payment_method?: string
  payment_terms?: string
  bank_name?: string
  bank_account?: string
  products_notes?: string
  notes?: string
  created_at: string
}

type Stats = {
  total_purchases: number
  purchases_count: number
  last_purchase?: string
  balance: number
}

type Purchase = {
  id: number
  reference?: string
  total: number
  status?: string
  created_at: string
}

type LedgerEntry = {
  id: number
  type: 'invoice' | 'payment' | 'return' | 'adjustment'
  direction: 'debit' | 'credit'
  amount: number
  balance_after: number
  reference?: string
  notes?: string
  created_at: string
}

// ★ Modal state type — قابل للتوسع
type ModalState = 'payment' | 'adjustment' | 'upload' | null
type TabKey = 'overview' | 'purchases' | 'ledger' | 'attachments'

// ── Helpers ────────────────────────────────────────────────
const STATUS_CFG = {
  active:    { labelAr: 'نشط',    labelEn: 'Active',    bg: '#d1fae5', color: '#065f46' },
  suspended: { labelAr: 'موقوف', labelEn: 'Suspended', bg: '#fef3c7', color: '#92400e' },
  blocked:   { labelAr: 'محظور', labelEn: 'Blocked',   bg: '#fee2e2', color: '#991b1b' },
}

const PAYMENT_LABELS: Record<string, [string, string, string]> = {
  cash:          ['💵', 'نقدي',        'Cash'],
  bank_transfer: ['🏦', 'تحويل بنكي', 'Bank Transfer'],
  deferred:      ['📅', 'آجل',         'Deferred'],
}

const TYPE_CFG = {
  invoice:    { icon: '🧾', labelAr: 'فاتورة',   labelEn: 'Invoice',    color: '#1e40af', bg: '#eff6ff' },
  payment:    { icon: '💸', labelAr: 'دفعة',     labelEn: 'Payment',    color: '#065f46', bg: '#d1fae5' },
  return:     { icon: '↩️', labelAr: 'مرتجع',    labelEn: 'Return',     color: '#92400e', bg: '#fef3c7' },
  adjustment: { icon: '⚙️', labelAr: 'تسوية',    labelEn: 'Adjustment', color: '#6b7280', bg: '#f3f4f6' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-EG', { minimumFractionDigits: 2 }).format(n)
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ★ Safe amount parser
function parseAmount(val: string): number | null {
  const n = Number(val)
  return isNaN(n) || n <= 0 ? null : n
}

function StarRating({ value }: { value: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(s => (
        <span key={`star-${s}`} style={{ color: s <= value ? '#f59e0b' : '#e5e7eb', fontSize: 16 }}>★</span>
      ))}
    </span>
  )
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ icon, label, value, color = '#1a56db', sub }: {
  icon: string; label: string; value: string | number; color?: string; sub?: string
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,.08)', flex: '1 1 180px',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Info Row ───────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 16, minWidth: 24, textAlign: 'center' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Action Button ──────────────────────────────────────────
function ActionBtn({ icon, label, color, bg, onClick }: {
  icon: string; label: string; color: string; bg: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 18px', border: `1px solid ${color}20`,
      borderRadius: 10, background: bg, color, cursor: 'pointer',
      fontWeight: 700, fontSize: 13, transition: 'all .15s',
      whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  )
}

// ══════════════════════════════════════════════════════════
export default function SupplierViewPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'
  const router = useRouter()
  const params = useParams()

  // ✅ supplierId محمي من NaN — لو مش رقم صحيح بيبقى null
  const supplierId = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : params?.id
    const id = Number(raw)
    return Number.isFinite(id) ? id : null
  }, [params?.id])

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [supplier,  setSupplier]  = useState<Supplier | null>(null)
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [ledger,    setLedger]    = useState<LedgerEntry[]>([])
  const [loading,   setLoading]   = useState(true)

  // ── Modals ─────────────────────────────────────────────
  const [modal,        setModal]        = useState<ModalState>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null)

  // Payment form
  const [payAmount, setPayAmount] = useState('')
  const [payRef,    setPayRef]    = useState('')
  const [payNotes,  setPayNotes]  = useState('')

  // Adjustment form
  const [adjAmount,    setAdjAmount]    = useState('')
  const [adjDirection, setAdjDirection] = useState<'debit' | 'credit'>('debit')
  const [adjNotes,     setAdjNotes]     = useState('')

  // Upload
  const [uploadFiles, setUploadFiles] = useState<File[]>([])

  const flash = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
  }, [])

  // ✅ toast cleanup — بيمنع memory leak لو الصفحة اتقفلت قبل 3.5 ثانية
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // ✅ FIX 3: أضفنا ar في dependency array عشان نتجنب stale closure
  const reload = useCallback(async () => {
    if (supplierId === null) return
    try {
      const res = await api.get(`/suppliers/${supplierId}`)
      if (res.data) {
        // الـ api.ts بيفك الـ wrapper تلقائياً → res.data هو { supplier, stats, ... } مباشرة
        const d = res.data
        setSupplier(d.supplier ?? null)
        setStats(d.stats ?? null)
        setPurchases(d.purchases ?? [])
        setLedger(d.ledger ?? [])
      }
    } catch {
      flash(ar ? 'خطأ في تحميل البيانات' : 'Failed to load supplier', false)
    }
  }, [supplierId, ar, flash])

  useEffect(() => {
    if (supplierId === null) return
    let mounted = true
    const load = async () => {
      await reload()
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [supplierId, reload])

  // ✅ FIX 1: تعريف TABS مرة واحدة فقط هنا — حُذفت النسخة التانية نهائياً
  const TABS = useMemo(() => [
    { key: 'overview',    icon: '🧾', label: ar ? 'نظرة عامة'   : 'Overview' },
    { key: 'purchases',   icon: '🛒', label: ar ? 'المشتريات'    : 'Purchases' },
    { key: 'ledger',      icon: '💰', label: ar ? 'حساب المورد' : 'Ledger' },
    { key: 'attachments', icon: '📎', label: ar ? 'المرفقات'     : 'Attachments' },
  ], [ar])

  // ✅ FIX 4: إضافة رسالة خطأ واضحة لو المبلغ فاضي أو غلط
  const handleAddPayment = async () => {
    const amount = parseAmount(payAmount)
    if (!amount) {
      flash(ar ? 'أدخل مبلغ صحيح' : 'Enter a valid amount', false)
      return
    }
    if (supplierId === null) return
    setModalLoading(true)
    try {
      const res = await api.post(`/suppliers/${supplierId}/ledger`, {
        type: 'payment', direction: 'credit', amount, reference: payRef, notes: payNotes,
      })
      if (res.error) { flash(res.error, false); return }
      flash(ar ? '✅ تم إضافة الدفعة' : '✅ Payment added')
      setModal(null); setPayAmount(''); setPayRef(''); setPayNotes('')
      reload()
    } catch {
      flash(ar ? 'خطأ في الاتصال' : 'Network error', false)
    } finally {
      setModalLoading(false)
    }
  }

  const handleAdjustment = async () => {
    const amount = parseAmount(adjAmount)
    if (!amount) {
      flash(ar ? 'أدخل مبلغ صحيح' : 'Enter a valid amount', false)
      return
    }
    if (supplierId === null) return
    setModalLoading(true)
    try {
      const res = await api.post(`/suppliers/${supplierId}/ledger`, {
        type: 'adjustment', direction: adjDirection, amount, notes: adjNotes,
      })
      if (res.error) { flash(res.error, false); return }
      flash(ar ? '✅ تم التسوية' : '✅ Adjustment added')
      setModal(null); setAdjAmount(''); setAdjNotes('')
      reload()
    } catch {
      flash(ar ? 'خطأ في الاتصال' : 'Network error', false)
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || supplierId === null) return
    setModalLoading(true)
    try {
      const fd = new FormData()
      uploadFiles.forEach(f => fd.append('files[]', f))
      const res = await api.post(`/suppliers/${supplierId}/attachments`, fd)
      if (res.error) { flash(res.error, false); return }
      flash(ar ? '✅ تم رفع الملفات' : '✅ Files uploaded')
      setModal(null); setUploadFiles([])
    } catch {
      flash(ar ? 'خطأ في الاتصال' : 'Network error', false)
    } finally {
      setModalLoading(false)
    }
  }

  if (loading) return (
    <ERPLayout>
      <div style={{ textAlign: 'center', padding: 100, color: '#9ca3af' }}>
        <div style={{ fontSize: 36 }}>⏳</div>
        <div style={{ marginTop: 10 }}>{ar ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    </ERPLayout>
  )

  if (!supplier) return (
    <ERPLayout>
      <div style={{ textAlign: 'center', padding: 100 }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <div style={{ marginTop: 10, color: '#6b7280' }}>{ar ? 'المورد غير موجود' : 'Supplier not found'}</div>
      </div>
    </ERPLayout>
  )

  const statusCfg = STATUS_CFG[supplier?.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.active
  const pm = PAYMENT_LABELS[supplier.payment_method ?? ''] ?? null

  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 99999,
            background: toast.ok ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '12px 22px', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontWeight: 600,
          }}>{toast.msg}</div>
        )}

        {/* ── Modals ───────────────────────────────────────── */}

        {/* Modal: Add Payment */}
        {modal === 'payment' && (
          <Modal title={ar ? '💸 إضافة دفعة' : '💸 Add Payment'} onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{ar ? 'المبلغ *' : 'Amount *'}</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{ar ? 'رقم المرجع' : 'Reference'}</label>
                <input value={payRef} onChange={e => setPayRef(e.target.value)}
                  placeholder={ar ? 'رقم الشيك أو التحويل...' : 'Check or transfer no...'}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{ar ? 'ملاحظات' : 'Notes'}</label>
                <textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any, resize: 'none' }} />
              </div>
              <button onClick={handleAddPayment} disabled={modalLoading || parseAmount(payAmount) === null}
                style={{ padding: '12px', background: modalLoading ? '#93c5fd' : '#1a56db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                {modalLoading ? '⏳...' : (ar ? '💾 حفظ الدفعة' : '💾 Save Payment')}
              </button>
            </div>
          </Modal>
        )}

        {/* Modal: Adjustment */}
        {modal === 'adjustment' && (
          <Modal title={ar ? '⚙️ تسوية رصيد' : '⚙️ Balance Adjustment'} onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{ar ? 'نوع التسوية' : 'Direction'}</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['debit', 'credit'] as const).map(d => (
                    <button key={d} type="button" onClick={() => setAdjDirection(d)}
                      style={{
                        flex: 1, padding: '10px', border: `2px solid ${adjDirection === d ? '#1a56db' : '#e5e7eb'}`,
                        borderRadius: 8, background: adjDirection === d ? '#eff6ff' : '#fff',
                        cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        color: adjDirection === d ? '#1a56db' : '#6b7280',
                      }}>
                      {d === 'debit' ? (ar ? '⬆️ مدين' : '⬆️ Debit') : (ar ? '⬇️ دائن' : '⬇️ Credit')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{ar ? 'المبلغ *' : 'Amount *'}</label>
                <input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value)}
                  placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{ar ? 'سبب التسوية *' : 'Reason *'}</label>
                <textarea value={adjNotes} onChange={e => setAdjNotes(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as any, resize: 'none' }} />
              </div>
              <button onClick={handleAdjustment} disabled={modalLoading || parseAmount(adjAmount) === null}
                style={{ padding: '12px', background: modalLoading ? '#93c5fd' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                {modalLoading ? '⏳...' : (ar ? '💾 حفظ التسوية' : '💾 Save Adjustment')}
              </button>
            </div>
          </Modal>
        )}

        {/* Modal: Upload */}
        {modal === 'upload' && (
          <Modal title={ar ? '📎 رفع مرفقات' : '📎 Upload Attachments'} onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                border: '2px dashed #d1d5db', borderRadius: 10, padding: '24px',
                cursor: 'pointer', background: '#fafafa', gap: 8,
              }}>
                <span style={{ fontSize: 28 }}>📂</span>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
                  {ar ? 'اضغط لاختيار ملفات' : 'Click to select files'}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>PDF، صور، Word — حتى 10MB</span>
                <input type="file" multiple hidden onChange={e => setUploadFiles(Array.from(e.target.files ?? []))} />
              </label>
              {uploadFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {uploadFiles.map((f, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                      <span>📄 {f.name}</span>
                      <span style={{ color: '#9ca3af' }}>{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleUpload} disabled={modalLoading || uploadFiles.length === 0}
                style={{ padding: '12px', background: modalLoading ? '#93c5fd' : '#1a56db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                {modalLoading ? '⏳...' : (ar ? '⬆️ رفع الملفات' : '⬆️ Upload Files')}
              </button>
            </div>
          </Modal>
        )}

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => router.push('/suppliers')}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 12 }}>
            ← {ar ? 'العودة للموردين' : 'Back to Suppliers'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar */}
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: supplier.type === 'company' ? '#eff6ff' : '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                boxShadow: '0 2px 8px rgba(0,0,0,.1)',
              }}>
                {supplier.type === 'company' ? '🏢' : '👤'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>{supplier.name}</h1>
                  <span style={{
                    background: statusCfg.bg, color: statusCfg.color,
                    padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  }}>
                    {ar ? statusCfg.labelAr : statusCfg.labelEn}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: 6 }}>
                    {supplier.code}
                  </span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    {supplier.type === 'company' ? (ar ? '🏢 شركة' : '🏢 Company') : (ar ? '👤 فرد' : '👤 Individual')}
                  </span>
                  {(supplier.rating ?? 0) > 0 && <StarRating value={supplier.rating} />}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ActionBtn icon="➕" label={ar ? 'شراء جديد' : 'New Purchase'} color="#1a56db" bg="#eff6ff"
                onClick={() => router.push(`/purchases/new?supplier_id=${supplier.id}`)} />
              <ActionBtn icon="💸" label={ar ? 'إضافة دفعة' : 'Add Payment'} color="#059669" bg="#f0fdf4"
                onClick={() => setModal('payment')} />
              <ActionBtn icon="📎" label={ar ? 'رفع مستند' : 'Upload Doc'} color="#7c3aed" bg="#f5f3ff"
                onClick={() => setModal('upload')} />
              <ActionBtn icon="⚙️" label={ar ? 'تسوية رصيد' : 'Adjustment'} color="#d97706" bg="#fffbeb"
                onClick={() => setModal('adjustment')} />
              <ActionBtn icon="✏️" label={ar ? 'تعديل' : 'Edit'} color="#374151" bg="#f9fafb"
                onClick={() => router.push(`/suppliers/edit/${supplier.id}`)} />
            </div>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        {stats && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard icon="🛒" label={ar ? 'إجمالي المشتريات' : 'Total Purchases'} value={`${fmt(stats.total_purchases)} ج.م`} color="#1a56db" />
            <StatCard icon="📦" label={ar ? 'عدد الفواتير' : 'Invoices Count'} value={stats.purchases_count} color="#7c3aed" />
            <StatCard
              icon="💰"
              label={ar ? 'الرصيد الحالي' : 'Current Balance'}
              value={`${fmt(Math.abs(stats.balance))} ج.م`}
              color={stats.balance > 0 ? '#dc2626' : '#059669'}
              sub={stats.balance > 0 ? (ar ? 'مستحق للمورد' : 'Owed to supplier') : (ar ? 'لا يوجد رصيد' : 'No balance')}
            />
            <StatCard icon="📅" label={ar ? 'آخر شراء' : 'Last Purchase'} value={fmtDate(stats.last_purchase)} color="#f59e0b" />
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>

          {/* Tab Bar */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
            {TABS.map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                style={{
                  flex: 1, padding: '14px 10px', border: 'none', cursor: 'pointer',
                  background: activeTab === tab.key ? '#fff' : 'transparent',
                  borderBottom: activeTab === tab.key ? '2px solid #1a56db' : '2px solid transparent',
                  marginBottom: -2,
                  color: activeTab === tab.key ? '#1a56db' : '#6b7280',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all .15s',
                }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ──────────────────────────────── */}
          {activeTab === 'overview' && (
            <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

              {/* بيانات أساسية */}
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1 }}>
                  🏢 {ar ? 'المعلومات الأساسية' : 'Basic Info'}
                </h3>
                <InfoRow icon="🏷️" label={ar ? 'الكود' : 'Code'} value={supplier.code} />
                <InfoRow icon="📛" label={ar ? 'الاسم' : 'Name'} value={supplier.name} />
                <InfoRow icon="🏢" label={ar ? 'النوع' : 'Type'} value={supplier.type === 'company' ? (ar ? 'شركة' : 'Company') : (ar ? 'فرد' : 'Individual')} />
                <InfoRow icon="📅" label={ar ? 'تاريخ الإضافة' : 'Added'} value={fmtDate(supplier.created_at)} />
                {supplier.products_notes && (
                  <div style={{ marginTop: 16, padding: 14, background: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#374151' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>📦 {ar ? 'المنتجات المورّدة' : 'Supplied Products'}</div>
                    {supplier.products_notes}
                  </div>
                )}
              </div>

              {/* بيانات التواصل */}
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1 }}>
                  📞 {ar ? 'بيانات التواصل' : 'Contact Info'}
                </h3>
                <InfoRow icon="📞" label={ar ? 'الهاتف' : 'Phone'} value={supplier.phone} />
                <InfoRow icon="✉️" label={ar ? 'البريد' : 'Email'} value={supplier.email} />
                <InfoRow icon="🌍" label={ar ? 'الدولة' : 'Country'} value={supplier.country} />
                <InfoRow icon="🏙️" label={ar ? 'المدينة' : 'City'} value={supplier.city} />
                <InfoRow icon="🛣️" label={ar ? 'الشارع' : 'Street'} value={supplier.street} />
                <InfoRow icon="👤" label={ar ? 'جهة الاتصال' : 'Contact Person'} value={supplier.contact_person} />
                <InfoRow icon="📱" label={ar ? 'موبايل التواصل' : 'Contact Mobile'} value={supplier.contact_phone} />
              </div>

              {/* بيانات الدفع */}
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1 }}>
                  💳 {ar ? 'بيانات الدفع' : 'Payment Info'}
                </h3>
                {pm && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 16 }}>{pm[0]}</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{ar ? 'طريقة الدفع' : 'Payment Method'}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{ar ? pm[1] : pm[2]}</div>
                    </div>
                  </div>
                )}
                <InfoRow icon="📋" label={ar ? 'شروط الدفع' : 'Payment Terms'} value={supplier.payment_terms} />
                <InfoRow icon="🏦" label={ar ? 'البنك' : 'Bank'} value={supplier.bank_name} />
                <InfoRow icon="💳" label={ar ? 'رقم الحساب' : 'Account No.'} value={supplier.bank_account} />
              </div>

              {/* ملاحظات */}
              {supplier.notes && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 1 }}>
                    📝 {ar ? 'ملاحظات' : 'Notes'}
                  </h3>
                  <div style={{ padding: 14, background: '#fffbeb', borderRadius: 8, fontSize: 13, color: '#374151', border: '1px solid #fde68a', lineHeight: 1.6 }}>
                    {supplier.notes}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── Tab: Purchases ─────────────────────────────── */}
          {activeTab === 'purchases' && (
            <div style={{ padding: 28 }}>
              {purchases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                  <div style={{ fontSize: 48 }}>🛒</div>
                  <div style={{ marginTop: 10 }}>{ar ? 'لا توجد مشتريات بعد' : 'No purchases yet'}</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      {(ar
                        ? ['#', 'رقم الفاتورة', 'التاريخ', 'الإجمالي', 'الحالة']
                        : ['#', 'Reference', 'Date', 'Total', 'Status']
                      ).map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: ar ? 'right' : 'left', fontWeight: 700, fontSize: 13, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      >
                        <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 13 }}>{i + 1}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#1a56db' }}>
                          {p.reference || `PO-${p.id}`}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{fmtDate(p.created_at)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#111827' }}>{fmt(p.total)} ج.م</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: p.status === 'paid' ? '#d1fae5' : '#fef3c7',
                            color: p.status === 'paid' ? '#065f46' : '#92400e',
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          }}>
                            {p.status === 'paid' ? (ar ? 'مدفوع' : 'Paid') : (ar ? 'معلق' : 'Pending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Tab: Ledger ────────────────────────────────── */}
          {activeTab === 'ledger' && (
            <div style={{ padding: 28 }}>

              {/* Balance Summary */}
              {stats && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: stats.balance > 0 ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${stats.balance > 0 ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: 10, padding: '16px 22px', marginBottom: 24,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>{ar ? 'الرصيد الحالي' : 'Current Balance'}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: stats.balance > 0 ? '#dc2626' : '#059669', marginTop: 4 }}>
                      {fmt(Math.abs(stats.balance))} ج.م
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: stats.balance > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>
                    {stats.balance > 0 ? (ar ? '⬆️ مستحق للمورد' : '⬆️ Owed to supplier') : (ar ? '✅ لا يوجد رصيد' : '✅ No balance')}
                  </div>
                </div>
              )}

              {ledger.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                  <div style={{ fontSize: 48 }}>💰</div>
                  <div style={{ marginTop: 10 }}>{ar ? 'لا توجد حركات حتى الآن' : 'No transactions yet'}</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      {(ar
                        ? ['النوع', 'المرجع', 'التاريخ', 'المبلغ', 'الرصيد بعد']
                        : ['Type', 'Reference', 'Date', 'Amount', 'Balance After']
                      ).map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: ar ? 'right' : 'left', fontWeight: 700, fontSize: 13, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map(entry => {
                      const cfg = TYPE_CFG[entry.type]
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                              {cfg.icon} {ar ? cfg.labelAr : cfg.labelEn}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>
                            {entry.reference || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{fmtDate(entry.created_at)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: 14, fontWeight: 700,
                              color: entry.direction === 'credit' ? '#059669' : '#dc2626',
                            }}>
                              {entry.direction === 'credit' ? '-' : '+'} {fmt(entry.amount)} ج.م
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                            {fmt(entry.balance_after)} ج.م
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Tab: Attachments ───────────────────────────── */}
          {activeTab === 'attachments' && (
            <div style={{ padding: 28 }}>
              <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                <div style={{ fontSize: 48 }}>📎</div>
                <div style={{ marginTop: 10, fontSize: 15 }}>{ar ? 'لا توجد مرفقات بعد' : 'No attachments yet'}</div>
                <button
                  onClick={() => setModal('upload')}
                  style={{ marginTop: 16, background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700 }}>
                  {ar ? '+ رفع مرفق' : '+ Upload Attachment'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </ERPLayout>
  )
}