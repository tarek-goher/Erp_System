'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useToast } from '../../hooks/useToast'  // ← استيراد صحيح (بدون ToastContainer)
import { useI18n } from '../../lib/i18n'

// ─── أنواع البيانات ────────────────────────────────────
type SaleItem = {
  id: number
  product_id?: number
  product?: { id: number; name: string; sku?: string; unit?: string }
  product_name?: string
  qty: number
  price: number
  discount?: number
  total: number
  tax_amount?: number
  warehouse?: { id: number; name: string }
  warehouse_id?: number
}

type ReturnItem = {
  sale_item_id: number
  product_id: number
  product_name: string
  qty_sold: number
  qty_return: number
  price: number
  warehouse_id: number
  warehouse_name: string
  reason: string
}

type Sale = {
  id: number
  invoice_number: string
  customer?: { id: number; name: string; email?: string; phone?: string }
  status: string
  payment_method?: string
  subtotal?: number
  tax?: number
  discount?: number
  total: number
  notes?: string
  created_at: string
  items?: SaleItem[]
}

type Return = {
  id: number
  return_number: string
  original_invoice: string
  customer_name: string
  total_refunded: number
  status: string
  reason: string
  return_date: string
  items_count: number
  refund_method: string
  sale_id: number
}

type Stats = {
  total_returns: number
  total_refunded: number
  pending_returns: number
  completed_returns: number
}

type Customer = { id: number; name: string }

// ─── ألوان الحالات ────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; color: string; ar: string; en: string }> = {
  draft:     { bg: '#f3f4f6', color: '#6b7280', ar: 'مسودة',       en: 'Draft' },
  pending:   { bg: '#fef3c7', color: '#b45309', ar: 'قيد المراجعة', en: 'Pending' },
  completed: { bg: '#d1fae5', color: '#166534', ar: 'مكتمل',       en: 'Completed' },
  cancelled: { bg: '#fee2e2', color: '#ac1f1f', ar: 'ملغي',        en: 'Cancelled' },
  refunded:  { bg: '#ede9fe', color: '#5b21b6', ar: 'مسترد',       en: 'Refunded' },
  partial:   { bg: '#fef9c3', color: '#92400e', ar: 'جزئي',        en: 'Partial' },
}

const RETURN_REASONS = [
  { value: 'defective',  ar: 'منتج معيب',        en: 'Defective product' },
  { value: 'wrong_item', ar: 'منتج خاطئ',        en: 'Wrong item sent' },
  { value: 'not_needed', ar: 'لا يحتاجه العميل', en: 'Not needed' },
  { value: 'damaged',    ar: 'تالف أثناء الشحن', en: 'Damaged in shipping' },
  { value: 'expired',    ar: 'منتهي الصلاحية',   en: 'Expired product' },
  { value: 'quality',    ar: 'جودة غير مقبولة',  en: 'Poor quality' },
  { value: 'other',      ar: 'سبب آخر',          en: 'Other' },
]

const REFUND_METHODS = [
  { value: 'cash',          ar: 'نقدي',       en: 'Cash' },
  { value: 'bank_transfer', ar: 'تحويل بنكي', en: 'Bank Transfer' },
  { value: 'credit_note',   ar: 'إشعار دائن', en: 'Credit Note' },
  { value: 'store_credit',  ar: 'رصيد متجر',  en: 'Store Credit' },
]

// ─── رقم مرتجع تلقائي ──────────────────────────────────
function genReturnNumber() {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rnd = Math.floor(Math.random() * 9000) + 1000
  return `RTN-${yy}${mm}${dd}-${rnd}`
}

const PER_PAGE = 15

// ──────────────────────────────────────────────────────
// الصفحة الرئيسية
// ──────────────────────────────────────────────────────
export default function ReturnsPage() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const { show } = useToast()  // ✅ FIX: استخدم `show` فقط بدون `toasts` و `remove`

  const ar = lang === 'ar'

  // ─── بيانات ────────────────────────────────────────
  const [returns,   setReturns]   = useState<Return[]>([])
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading,   setLoading]   = useState(true)
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)

  // ─── فلاتر ─────────────────────────────────────────
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [dateFrom,       setDateFrom]       = useState('')
  const [dateTo,         setDateTo]         = useState('')
  const [customerFilter, setCustomerFilter] = useState('')

  // ─── مودال إنشاء مرتجع ─────────────────────────────
  const [createModal,    setCreateModal]    = useState(false)
  const [invoiceSearch,  setInvoiceSearch]  = useState('')
  const [invoiceResults, setInvoiceResults] = useState<Sale[]>([])
  const [selectedSale,   setSelectedSale]   = useState<Sale | null>(null)
  const [returnItems,    setReturnItems]    = useState<ReturnItem[]>([])
  const [returnReason,   setReturnReason]   = useState('')
  const [refundMethod,   setRefundMethod]   = useState('cash')
  const [returnNotes,    setReturnNotes]    = useState('')
  const [returnNumber,   setReturnNumber]   = useState('')
  const [searchingInv,   setSearchingInv]   = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [formErr,        setFormErr]        = useState('')
  const [step,           setStep]           = useState<1 | 2 | 3>(1)
  const [noItemsWarning, setNoItemsWarning] = useState(false)

  // ─── مودال التفاصيل ────────────────────────────────
  const [detailModal,   setDetailModal]   = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)
  const [saleDetail,    setSaleDetail]    = useState<Sale | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // ══════════════════════════════════════════════════════
  // جلب البيانات
  // ══════════════════════════════════════════════════════

  // FIX 1: fetchReturns كـ useCallback عشان نقدر نستدعيه من أماكن مختلفة
  const fetchReturns = useCallback(async (pg: number, overrideStatus?: string) => {
    setLoading(true)
    // FIX 2: الـ statusFilter بيتحترم صح — لو فاضي بنجيب refunded,partial
    const statusParam = overrideStatus ?? (statusFilter || 'refunded,partial')
    const params = new URLSearchParams({
      status:   statusParam,
      page:     String(pg),
      per_page: String(PER_PAGE),
    })
    if (search)         params.set('search', search)
    if (dateFrom)       params.set('from', dateFrom)
    if (dateTo)         params.set('to', dateTo)
    if (customerFilter) params.set('customer_id', customerFilter)

    const res = await api.get(`/sales?${params}`)
    if (res.data) {
      const arr = extractArray<Sale>(res.data)
      const mapped: Return[] = arr.map(s => ({
        id:             s.id,
        return_number:  `RTN-${s.invoice_number}`,
        original_invoice: s.invoice_number,
        customer_name:  s.customer?.name || '—',
        total_refunded: s.total,
        status:         s.status === 'partial' ? 'partial' : 'refunded',
        reason:         s.notes || '—',
        return_date:    s.created_at,
        items_count:    s.items?.length || 0,
        refund_method:  s.payment_method || 'cash',
        sale_id:        s.id,
      }))
      setReturns(mapped)
      setTotal(res.data?.total ?? res.data?.meta?.total ?? arr.length)
    }
    setLoading(false)
  }, [search, statusFilter, dateFrom, dateTo, customerFilter])

  // FIX 3: fetchStats بدون API call زيادة — بتجيب البيانات مرة واحدة بس
  const fetchStats = useCallback(async () => {
    const refRes = await api.get('/sales?status=refunded,partial&per_page=1000')
    if (refRes.data) {
      const arr = extractArray<Sale>(refRes.data)
      const totalRefunded = arr.reduce((sum, s) => sum + s.total, 0)
      const partialCount  = arr.filter(s => s.status === 'partial').length
      const refundedCount = arr.filter(s => s.status === 'refunded').length
      setStats({
        total_returns:     arr.length,
        total_refunded:    totalRefunded,
        pending_returns:   partialCount,
        completed_returns: refundedCount,
      })
    }
  }, [])

  const fetchCustomers = useCallback(async () => {
    const res = await api.get('/customers?per_page=200')
    if (res.data) setCustomers(extractArray(res.data))
  }, [])

  // Mount: جيب الإحصائيات والعملاء مرة واحدة
  useEffect(() => {
    fetchStats()
    fetchCustomers()
  }, [])

  // FIX 4: لما الفلاتر تتغير نرجع لصفحة 1 ونعمل fetch
  useEffect(() => {
    setPage(1)
    fetchReturns(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFrom, dateTo, customerFilter])

  // FIX 5: الـ page effect منفصل — بس يشتغل لما page تتغير (مش الفلاتر)
  useEffect(() => {
    fetchReturns(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // ─── بحث manual (زر بحث / Enter) ──────────────────
  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchReturns(1)
  }

  const handleClear = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setCustomerFilter('')
    setStatusFilter('')
    setPage(1)
    // سيطلق الـ useEffect تلقائياً بعد تغيير الـ state
  }

  // ══════════════════════════════════════════════════════
  // البحث عن فاتورة لإنشاء مرتجع
  // ══════════════════════════════════════════════════════
  const searchInvoice = async () => {
    if (!invoiceSearch.trim()) return
    setSearchingInv(true)
    setInvoiceResults([])
    const res = await api.get(`/sales?search=${invoiceSearch}&status=completed&per_page=10`)
    if (res.data) setInvoiceResults(extractArray<Sale>(res.data))
    setSearchingInv(false)
  }

  const selectSale = async (sale: Sale) => {
    const res = await api.get(`/sales/${sale.id}`)
    const full: Sale = res.data || sale

    // FIX 6: تحقق إن الـ items موجودة وإلا أظهر تحذير
    if (!full.items || full.items.length === 0) {
      setNoItemsWarning(true)
      setSelectedSale(full)
      setReturnItems([])
      setReturnNumber(genReturnNumber())
      setStep(2)
      return
    }
    setNoItemsWarning(false)

    const items: ReturnItem[] = full.items.map(item => ({
      sale_item_id: item.id,
      product_id:   item.product_id || item.product?.id || 0,
      product_name: item.product?.name || item.product_name || '—',
      qty_sold:     item.qty,
      qty_return:   0,
      price:        item.price,
      warehouse_id: item.warehouse?.id || item.warehouse_id || 0,
      warehouse_name: item.warehouse?.name || '—',
      reason:       '',
    }))
    setSelectedSale(full)
    setReturnItems(items)
    setReturnNumber(genReturnNumber())
    setStep(2)
  }

  const openCreateModal = () => {
    setCreateModal(true)
    setStep(1)
    setInvoiceSearch('')
    setInvoiceResults([])
    setSelectedSale(null)
    setReturnItems([])
    setReturnReason('')
    setRefundMethod('cash')
    setReturnNotes('')
    setFormErr('')
    setNoItemsWarning(false)
  }

  // ─── إجمالي المرتجع ────────────────────────────────
  const returnTotal = returnItems.reduce(
    (sum, it) => sum + it.qty_return * it.price,
    0
  )

  // ══════════════════════════════════════════════════════
  // حفظ المرتجع
  // ══════════════════════════════════════════════════════
  const handleSubmitReturn = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')

    const hasItems = returnItems.some(it => it.qty_return > 0)
    if (!hasItems) {
      setFormErr(ar ? 'يجب إدخال كمية مرتجعة لصنف واحد على الأقل' : 'Please enter at least one return quantity')
      return
    }
    if (!returnReason) {
      setFormErr(ar ? 'يجب اختيار سبب الإرجاع' : 'Please select a return reason')
      return
    }
    for (const item of returnItems) {
      if (item.qty_return > 0 && item.qty_return > item.qty_sold) {
        setFormErr(ar
          ? `كمية المرتجع (${item.qty_return}) تتجاوز الكمية المباعة (${item.qty_sold}) للمنتج: ${item.product_name}`
          : `Return qty (${item.qty_return}) exceeds sold qty (${item.qty_sold}) for: ${item.product_name}`)
        return
      }
    }

    setSaving(true)
    try {
      const itemsToReturn = returnItems.filter(it => it.qty_return > 0)
      const isFullReturn  = returnItems.every(item => item.qty_return >= item.qty_sold)

      // 1. تحديث حالة الفاتورة
      await api.put(`/sales/${selectedSale!.id}`, {
        status: isFullReturn ? 'refunded' : 'partial',
        notes:  `[مرتجع ${returnNumber}] ${returnReason}${returnNotes ? ' — ' + returnNotes : ''}`,
      })

      // 2. تسجيل حركات المخزون (in)
      for (const item of itemsToReturn) {
        if (item.warehouse_id) {
          await api.post('/stock-movements', {
            product_id:   item.product_id,
            warehouse_id: item.warehouse_id,
            type:         'in',
            qty:          item.qty_return,
            notes:        `مرتجع ${returnNumber} — ${item.reason || returnReason}`,
          })
        }
      }

      // ✅ FIX: استخدم `show()` بدلاً من `toast.success()`
      show(ar ? 'تم تسجيل المرتجع بنجاح ✓' : 'Return registered successfully ✓', 'success')
      setCreateModal(false)
      setPage(1)
      fetchReturns(1)
      fetchStats()
    } catch (err: any) {
      setFormErr(err.message || (ar ? 'حدث خطأ' : 'An error occurred'))
      show(err.message || (ar ? 'حدث خطأ' : 'An error occurred'), 'error')
    }
    setSaving(false)
  }

  // ══════════════════════════════════════════════════════
  // عرض تفاصيل مرتجع
  // ══════════════════════════════════════════════════════
  const openDetail = async (ret: Return) => {
    setSelectedReturn(ret)
    setSaleDetail(null)
    setDetailModal(true)
    setLoadingDetail(true)
    const res = await api.get(`/sales/${ret.sale_id}`)
    if (res.data) setSaleDetail(res.data)
    setLoadingDetail(false)
  }

  // ══════════════════════════════════════════════════════
  // قبول مرتجع
  // ══════════════════════════════════════════════════════
  const handleAcceptReturn = async (returnId: number) => {
    setSaving(true)
    const res = await api.patch(`/returns/${returnId}/accept`, {})
    setSaving(false)
    if (res.error) {
      show(res.error, 'error')
      return
    }
    show(ar ? 'تم قبول المرتجع بنجاح ✓' : 'Return accepted successfully ✓', 'success')
    setPage(1)
    fetchReturns(1)
    fetchStats()
  }

  // ══════════════════════════════════════════════════════
  // رفض مرتجع
  // ══════════════════════════════════════════════════════
  const handleRejectReturn = async (returnId: number) => {
    setSaving(true)
    const res = await api.patch(`/returns/${returnId}/reject`, {})
    setSaving(false)
    if (res.error) {
      show(res.error, 'error')
      return
    }
    show(ar ? 'تم رفض المرتجع بنجاح ✓' : 'Return rejected successfully ✓', 'success')
    setPage(1)
    fetchReturns(1)
    fetchStats()
  }

  // ══════════════════════════════════════════════════════
  // مساعدات تنسيق
  // ══════════════════════════════════════════════════════
  const fmt = (n: number) =>
    new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const getStatus = (s: string) =>
    STATUS_COLORS[s] || { bg: '#f3f4f6', color: '#6b7280', ar: s, en: s }

  const totalPages = Math.ceil(total / PER_PAGE)

  // ══════════════════════════════════════════════════════
  // الـ JSX
  // ══════════════════════════════════════════════════════
  return (
    <ERPLayout pageTitle={ar ? 'المرتجعات' : 'Returns'}>
      {/* ✅ FIX: حذفنا <ToastContainer> من هنا — الـ Provider بيعرضها تلقائي! */}

      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ══ العنوان + زر إضافة ══════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              🔄 {ar ? 'إدارة المرتجعات' : 'Returns Management'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              {ar ? 'تسجيل ومتابعة مرتجعات المبيعات' : 'Track and manage sales returns'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
            {ar ? 'مرتجع جديد' : 'New Return'}
          </button>
        </div>

        {/* ══ بطاقات الإحصائيات ══════════════════════════ */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard icon="🔄" label={ar ? 'إجمالي المرتجعات' : 'Total Returns'}        value={String(stats.total_returns)}     color="#5b21b6" />
            <StatCard icon="💰" label={ar ? 'إجمالي المبالغ المستردة' : 'Total Refunded'} value={`${fmt(stats.total_refunded)} EGP`} color="#166534" />
            <StatCard icon="✅" label={ar ? 'مكتملة' : 'Completed'}                        value={String(stats.completed_returns)}  color="#0f5f6e" />
            <StatCard icon="⏳" label={ar ? 'جزئية' : 'Partial'}                           value={String(stats.pending_returns)}    color="#a83d0c" />
          </div>
        )}

        {/* ══ شريط الفلاتر والبحث ══════════════════════ */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 220px' }}>
              <label className="label">{ar ? 'البحث' : 'Search'}</label>
              <input
                className="input"
                placeholder={ar ? 'رقم المرتجع أو الفاتورة...' : 'Return or invoice number...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* FIX 7: فلتر الحالة موجود في الـ UI دلوقتي */}
            <div style={{ flex: '1 1 150px' }}>
              <label className="label">{ar ? 'الحالة' : 'Status'}</label>
              <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">{ar ? 'الكل' : 'All'}</option>
                <option value="refunded">{ar ? 'مسترد' : 'Refunded'}</option>
                <option value="partial">{ar ? 'جزئي' : 'Partial'}</option>
              </select>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label className="label">{ar ? 'من تاريخ' : 'From Date'}</label>
              <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label className="label">{ar ? 'إلى تاريخ' : 'To Date'}</label>
              <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label className="label">{ar ? 'العميل' : 'Customer'}</label>
              <select className="input" value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}>
                <option value="">{ar ? 'كل العملاء' : 'All Customers'}</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">🔍 {ar ? 'بحث' : 'Search'}</button>
              <button type="button" className="btn btn-outline" onClick={handleClear}>
                ✕ {ar ? 'مسح' : 'Clear'}
              </button>
            </div>
          </form>
        </div>

        {/* ══ الجدول ═══════════════════════════════════ */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              {ar ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : returns.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
              <p style={{ fontSize: 15 }}>{ar ? 'لا توجد مرتجعات' : 'No returns found'}</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateModal}>
                {ar ? 'إنشاء أول مرتجع' : 'Create First Return'}
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{ar ? 'رقم المرتجع' : 'Return #'}</th>
                    <th>{ar ? 'رقم الفاتورة' : 'Invoice #'}</th>
                    <th>{ar ? 'العميل' : 'Customer'}</th>
                    <th>{ar ? 'المبلغ المسترد' : 'Refunded'}</th>
                    <th>{ar ? 'طريقة الاسترداد' : 'Refund Method'}</th>
                    <th>{ar ? 'الحالة' : 'Status'}</th>
                    <th>{ar ? 'التاريخ' : 'Date'}</th>
                    <th>{ar ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(ret => {
                    const st = getStatus(ret.status)
                    const rm = REFUND_METHODS.find(m => m.value === ret.refund_method)
                    return (
                      <tr key={ret.id}>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                            {ret.return_number}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            {ret.original_invoice}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{ret.customer_name}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                            {fmt(ret.total_refunded)} <small style={{ fontWeight: 400, fontSize: 11 }}>EGP</small>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {ar ? (rm?.ar || ret.refund_method) : (rm?.en || ret.refund_method)}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                            background: st.bg, color: st.color,
                          }}>
                            {ar ? st.ar : st.en}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {fmtDate(ret.return_date)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => openDetail(ret)}
                              title={ar ? 'عرض التفاصيل' : 'View Details'}
                            >
                              👁 {ar ? 'عرض' : 'View'}
                            </button>
                            {ret.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-success"
                                  style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => handleAcceptReturn(ret.id)}
                                  title={ar ? 'قبول المرتجع' : 'Accept Return'}
                                >
                                  ✓ {ar ? 'قبول' : 'Accept'}
                                </button>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => handleRejectReturn(ret.id)}
                                  title={ar ? 'رفض المرتجع' : 'Reject Return'}
                                >
                                  ✕ {ar ? 'رفض' : 'Reject'}
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => router.push(`/sales/${ret.sale_id}`)}
                              title={ar ? 'الفاتورة الأصلية' : 'Original Invoice'}
                            >
                              🧾
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

          {/* ─── Pagination ─── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 12px' }}>
                {ar ? '← السابق' : '← Prev'}
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {ar ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 12px' }}>
                {ar ? 'التالي →' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          مودال إنشاء مرتجع
      ════════════════════════════════════════════════ */}
      {createModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-modal)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: 780, maxHeight: '90vh',
            overflow: 'auto', boxShadow: 'var(--shadow-xl)',
          }}>
            {/* رأس المودال */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1,
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  🔄 {ar ? 'إنشاء مرتجع جديد' : 'New Return'}
                </h2>
                {/* خطوات */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[
                    { n: 1, label: ar ? 'اختر الفاتورة' : 'Select Invoice' },
                    { n: 2, label: ar ? 'حدد الأصناف'   : 'Select Items' },
                    { n: 3, label: ar ? 'تأكيد'         : 'Confirm' },
                  ].map(s => (
                    <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 99,
                        background: step >= s.n ? 'var(--color-primary)' : 'var(--border)',
                        color: step >= s.n ? '#fff' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, transition: 'var(--transition)',
                      }}>{s.n}</div>
                      <span style={{ fontSize: 12, color: step >= s.n ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
                      {s.n < 3 && <span style={{ color: 'var(--border)', margin: '0 2px' }}>›</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px' }}>

              {/* ─── الخطوة 1: البحث عن فاتورة ─── */}
              {step === 1 && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
                    {ar ? 'ابحث عن فاتورة المبيعات المراد إرجاعها' : 'Search for the sale invoice to return'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      placeholder={ar ? 'رقم الفاتورة أو اسم العميل...' : 'Invoice number or customer name...'}
                      value={invoiceSearch}
                      onChange={e => setInvoiceSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchInvoice()}
                    />
                    <button className="btn btn-primary" onClick={searchInvoice} disabled={searchingInv}>
                      {searchingInv ? '...' : `🔍 ${ar ? 'بحث' : 'Search'}`}
                    </button>
                  </div>

                  {invoiceResults.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table className="table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>{ar ? 'رقم الفاتورة' : 'Invoice #'}</th>
                            <th>{ar ? 'العميل' : 'Customer'}</th>
                            <th>{ar ? 'الإجمالي' : 'Total'}</th>
                            <th>{ar ? 'التاريخ' : 'Date'}</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceResults.map(s => (
                            <tr key={s.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.invoice_number}</td>
                              <td>{s.customer?.name || '—'}</td>
                              <td style={{ fontWeight: 600 }}>{fmt(s.total)} EGP</td>
                              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(s.created_at)}</td>
                              <td>
                                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => selectSale(s)}>
                                  {ar ? 'اختر' : 'Select'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {invoiceResults.length === 0 && invoiceSearch && !searchingInv && (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      {ar ? 'لم يتم العثور على فواتير مكتملة بهذا البحث' : 'No completed invoices found'}
                    </div>
                  )}
                </div>
              )}

              {/* ─── الخطوة 2: تحديد الأصناف المرتجعة ─── */}
              {step === 2 && selectedSale && (
                <form onSubmit={e => { e.preventDefault(); if (returnItems.some(i => i.qty_return > 0)) setStep(3); else setFormErr(ar ? 'حدد كمية لصنف واحد على الأقل' : 'Select qty for at least one item') }}>
                  {/* معلومات الفاتورة */}
                  <div style={{
                    background: 'var(--bg-table-alt)', borderRadius: 'var(--radius-md)',
                    padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap',
                  }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ar ? 'رقم الفاتورة' : 'Invoice'}</span>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedSale.invoice_number}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ar ? 'العميل' : 'Customer'}</span>
                      <div style={{ fontWeight: 600 }}>{selectedSale.customer?.name || '—'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ar ? 'إجمالي الفاتورة' : 'Invoice Total'}</span>
                      <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>{fmt(selectedSale.total)} EGP</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ar ? 'رقم المرتجع' : 'Return #'}</span>
                      <div style={{ fontWeight: 600, color: 'var(--color-info)', fontFamily: 'monospace' }}>{returnNumber}</div>
                    </div>
                    <button type="button" style={{ marginInlineStart: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }} onClick={() => setStep(1)}>
                      ← {ar ? 'تغيير الفاتورة' : 'Change Invoice'}
                    </button>
                  </div>

                  {/* FIX 6: تحذير لو مفيش أصناف */}
                  {noItemsWarning && (
                    <div style={{
                      background: '#fef3c7', border: '1px solid #fde68a',
                      borderRadius: 'var(--radius-md)', padding: '10px 14px',
                      marginBottom: 16, fontSize: 13, color: '#92400e',
                      display: 'flex', gap: 8,
                    }}>
                      <span>⚠️</span>
                      <span>{ar ? 'هذه الفاتورة لا تحتوي على أصناف مسجلة. اختر فاتورة أخرى.' : 'This invoice has no recorded items. Please select another invoice.'}</span>
                    </div>
                  )}

                  {/* جدول الأصناف */}
                  {returnItems.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <label className="label" style={{ marginBottom: 8, display: 'block' }}>
                        {ar ? 'الأصناف — حدد الكميات المرتجعة' : 'Items — Set return quantities'}
                      </label>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <table className="table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>{ar ? 'المنتج' : 'Product'}</th>
                              <th>{ar ? 'المخزن' : 'Warehouse'}</th>
                              <th style={{ textAlign: 'center' }}>{ar ? 'الكمية المباعة' : 'Sold Qty'}</th>
                              <th style={{ textAlign: 'center' }}>{ar ? 'كمية الإرجاع' : 'Return Qty'}</th>
                              <th style={{ textAlign: 'left' }}>{ar ? 'السعر' : 'Price'}</th>
                              <th style={{ textAlign: 'left' }}>{ar ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {returnItems.map((item, idx) => (
                              <tr key={item.sale_item_id} style={{ background: item.qty_return > 0 ? 'var(--color-success-light, #f0fdf4)' : undefined }}>
                                <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.warehouse_name}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span style={{ fontWeight: 600 }}>{item.qty_sold}</span>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="input"
                                    style={{ width: 80, textAlign: 'center', padding: '4px 8px' }}
                                    min={0}
                                    max={item.qty_sold}
                                    value={item.qty_return || ''}
                                    placeholder="0"
                                    onChange={e => {
                                      const v = Math.min(Math.max(0, Number(e.target.value)), item.qty_sold)
                                      setReturnItems(prev => prev.map((it, i) => i === idx ? { ...it, qty_return: v } : it))
                                    }}
                                  />
                                </td>
                                <td style={{ textAlign: 'left' }}>{fmt(item.price)}</td>
                                <td style={{ textAlign: 'left', fontWeight: 600, color: item.qty_return > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>
                                  {fmt(item.qty_return * item.price)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={5} style={{ textAlign: ar ? 'left' : 'right', fontWeight: 700, padding: '10px 16px', fontSize: 14 }}>
                                {ar ? 'إجمالي الاسترداد:' : 'Return Total:'}
                              </td>
                              <td style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-success)', padding: '10px 16px' }}>
                                {fmt(returnTotal)} EGP
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {formErr && (
                    <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>⚠️ {formErr}</div>
                  )}

                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={noItemsWarning}>
                      {ar ? 'التالي: تأكيد الإرجاع →' : 'Next: Confirm Return →'}
                    </button>
                  </div>
                </form>
              )}

              {/* ─── الخطوة 3: التأكيد وإتمام المرتجع ─── */}
              {step === 3 && selectedSale && (
                <form onSubmit={handleSubmitReturn}>
                  {/* ملخص */}
                  <div style={{
                    background: 'var(--bg-table-alt)', borderRadius: 'var(--radius-md)',
                    padding: 16, marginBottom: 20,
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                      📋 {ar ? 'ملخص المرتجع' : 'Return Summary'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                      <SummaryRow label={ar ? 'رقم المرتجع'      : 'Return #'}      value={returnNumber} mono />
                      <SummaryRow label={ar ? 'الفاتورة'         : 'Invoice'}       value={selectedSale.invoice_number} mono />
                      <SummaryRow label={ar ? 'العميل'           : 'Customer'}      value={selectedSale.customer?.name || '—'} />
                      <SummaryRow label={ar ? 'عدد الأصناف'      : 'Items'}         value={String(returnItems.filter(i => i.qty_return > 0).length)} />
                      <SummaryRow label={ar ? 'إجمالي الاسترداد' : 'Total Refund'}  value={`${fmt(returnTotal)} EGP`} bold />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="label">{ar ? 'سبب الإرجاع *' : 'Return Reason *'}</label>
                      <select className="input" value={returnReason} onChange={e => setReturnReason(e.target.value)} required>
                        <option value="">{ar ? '— اختر السبب —' : '— Select Reason —'}</option>
                        {RETURN_REASONS.map(r => (
                          <option key={r.value} value={r.value}>{ar ? r.ar : r.en}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">{ar ? 'طريقة الاسترداد *' : 'Refund Method *'}</label>
                      <select className="input" value={refundMethod} onChange={e => setRefundMethod(e.target.value)} required>
                        {REFUND_METHODS.map(m => (
                          <option key={m.value} value={m.value}>{ar ? m.ar : m.en}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="label">{ar ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                    <textarea
                      className="input"
                      rows={3}
                      style={{ resize: 'vertical' }}
                      placeholder={ar ? 'أي تفاصيل إضافية...' : 'Any additional details...'}
                      value={returnNotes}
                      onChange={e => setReturnNotes(e.target.value)}
                    />
                  </div>

                  {/* تحذير */}
                  <div style={{
                    background: '#fef9c3', border: '1px solid #fde68a',
                    borderRadius: 'var(--radius-md)', padding: '10px 14px',
                    marginBottom: 16, fontSize: 13, color: '#92400e',
                    display: 'flex', gap: 8,
                  }}>
                    <span>⚠️</span>
                    <span>
                      {(() => {
                        const isFull = returnItems.every(i => i.qty_return >= i.qty_sold)
                        return ar
                          ? `سيتم تحديث حالة الفاتورة إلى "${isFull ? 'مسترد' : 'جزئي'}" وإضافة الكميات إلى المخزون تلقائياً.`
                          : `Invoice status will be updated to "${isFull ? 'Refunded' : 'Partial'}" and stock quantities will be restored automatically.`
                      })()}
                    </span>
                  </div>

                  {formErr && (
                    <div style={{
                      background: 'var(--color-danger-light)', color: 'var(--color-danger)',
                      borderRadius: 'var(--radius-md)', padding: '10px 14px',
                      marginBottom: 16, fontSize: 13,
                    }}>
                      ⚠️ {formErr}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-outline" style={{ flex: '0 0 auto' }} onClick={() => setStep(2)}>
                      ← {ar ? 'رجوع' : 'Back'}
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                      {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : `✅ ${ar ? 'تأكيد المرتجع' : 'Confirm Return'}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          مودال التفاصيل
      ════════════════════════════════════════════════ */}
      {detailModal && selectedReturn && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-modal)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1,
            }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                🔄 {ar ? 'تفاصيل المرتجع' : 'Return Details'} — {selectedReturn.return_number}
              </h2>
              <button onClick={() => setDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  {ar ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px',
                    background: 'var(--bg-table-alt)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20,
                  }}>
                    <SummaryRow label={ar ? 'رقم المرتجع'      : 'Return #'}          value={selectedReturn.return_number} mono />
                    <SummaryRow label={ar ? 'الفاتورة الأصلية' : 'Original Invoice'}   value={selectedReturn.original_invoice} mono />
                    <SummaryRow label={ar ? 'العميل'           : 'Customer'}           value={selectedReturn.customer_name} />
                    <SummaryRow label={ar ? 'تاريخ الإرجاع'   : 'Return Date'}        value={fmtDate(selectedReturn.return_date)} />
                    <SummaryRow
                      label={ar ? 'طريقة الاسترداد' : 'Refund Method'}
                      value={ar
                        ? (REFUND_METHODS.find(m => m.value === selectedReturn.refund_method)?.ar || selectedReturn.refund_method)
                        : (REFUND_METHODS.find(m => m.value === selectedReturn.refund_method)?.en || selectedReturn.refund_method)}
                    />
                    <SummaryRow label={ar ? 'المبلغ المسترد' : 'Refunded Amount'} value={`${fmt(selectedReturn.total_refunded)} EGP`} bold />
                  </div>

                  {saleDetail?.items && saleDetail.items.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                        📦 {ar ? 'أصناف الفاتورة' : 'Invoice Items'}
                      </h3>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <table className="table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>{ar ? 'المنتج' : 'Product'}</th>
                              <th style={{ textAlign: 'center' }}>{ar ? 'الكمية' : 'Qty'}</th>
                              <th>{ar ? 'السعر' : 'Price'}</th>
                              <th>{ar ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {saleDetail.items.map(item => (
                              <tr key={item.id}>
                                <td style={{ fontWeight: 500 }}>{item.product?.name || item.product_name || '—'}</td>
                                <td style={{ textAlign: 'center' }}>{item.qty}</td>
                                <td>{fmt(item.price)}</td>
                                <td style={{ fontWeight: 600 }}>{fmt(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {saleDetail?.notes && (
                    <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-table-alt)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{ar ? 'الملاحظات: ' : 'Notes: '}</span>
                      {saleDetail.notes}
                    </div>
                  )}

                  <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={() => setDetailModal(false)}>
                      {ar ? 'إغلاق' : 'Close'}
                    </button>
                    <button className="btn btn-primary" onClick={() => { setDetailModal(false); router.push(`/sales/${selectedReturn.sale_id}`) }}>
                      🧾 {ar ? 'فتح الفاتورة' : 'Open Invoice'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </ERPLayout>
  )
}

// ──────────────────────────────────────────────────────
// مكونات مساعدة
// ──────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, fontFamily: mono ? 'monospace' : undefined, color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  )
}