'use client'

// ══════════════════════════════════════════════════════════
// app/sales/page.tsx — صفحة المبيعات
// ══════════════════════════════════════════════════════════
// الـ API endpoints المستخدمة:
//   GET    /api/sales              → قائمة المبيعات
//   POST   /api/sales              → إضافة بيع جديد
//   PATCH  /api/sales/{id}/status  → تغيير الحالة
//   DELETE /api/sales/{id}         → حذف
//   GET    /api/customers          → قائمة العملاء (للفورم)
//   POST   /api/customers          → إضافة عميل جديد inline
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { StatCard, Badge, EmptyState, SearchInput, Modal, ToastContainer } from '../../components/ui'
import { useI18n } from '../../lib/i18n'

// ─── أنواع البيانات ────────────────────────────────────
type Sale = {
  id: number
  invoice_number: string
  customer?: { id: number; name: string }
  total: number
  status: string
  notes?: string
  created_at: string
}

type Customer = { id: number; name: string }

// ─── الحالات الممكنة للمبيعات ─────────────────────────
const STATUSES = ['draft', 'pending', 'completed', 'cancelled', 'refunded']

export default function SalesPage() {
  const { show, toasts, remove } = useToast()
  const { t, lang } = useI18n()

  // ─── البيانات ──────────────────────────────────────────
  const [sales,     setSales]     = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading,   setLoading]   = useState(true)
  const [total,     setTotal]     = useState(0)

  // ─── الـ filters ───────────────────────────────────────
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page,      setPage]      = useState(1)

  // ─── حالة الـ modal ─────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)

  // ─── بيانات الفورم (إضافة بيع) ────────────────────────
  const [form, setForm] = useState({
    customer_id: '',
    notes: '',
    status: 'draft',
    tax_rate_id: '',
    payment_method: 'cash',
  })
  const [formError,   setFormError]   = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [taxRates,    setTaxRates]    = useState<{id:number,name:string,rate:number}[]>([])
  const [products,    setProducts]    = useState<{id:number,name:string,price?:number,sell_price?:number}[]>([])

  // أصناف الفاتورة
  type SaleItem = { product_id: string; name: string; qty: number; unit_price: number }
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ product_id: '', name: '', qty: 1, unit_price: 0 }])

  // ─── إضافة عميل inline ───────────────────────────────
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomerName,  setNewCustomerName]  = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [addingCustomer,   setAddingCustomer]   = useState(false)
  const [addCustomerErr,   setAddCustomerErr]   = useState('')

  // ─── حالة تأكيد الحذف ────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // ══════════════════════════════════════════════════════
  // جلب المبيعات من الـ API
  // ══════════════════════════════════════════════════════
  const fetchSales = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      per_page: '15',
      ...(search       && { search }),
      ...(statusFilter && { status: statusFilter }),
    })
    const res = await api.get<{ data: Sale[]; total: number }>(`/sales?${params}`)
    if (res.data) {
      setSales(extractArray(res.data))
      setTotal(res.data.total || 0)
    }
    setLoading(false)
  }

  // جلب العملاء
  const fetchCustomers = async () => {
    const res = await api.get<{ data: Customer[] }>('/customers?per_page=200')
    if (res.data) setCustomers(extractArray(res.data))
  }

  useEffect(() => { fetchSales() }, [page, search, statusFilter])
  useEffect(() => {
    fetchCustomers()
    api.get<any>('/tax-rates').then(r => {
      if (r.data) setTaxRates(extractArray(r.data))
    })
    api.get<any>('/products?per_page=200').then(r => {
      if (r.data) setProducts(extractArray(r.data))
    })
  }, [])

  // ══════════════════════════════════════════════════════
  // إضافة عميل جديد inline
  // ══════════════════════════════════════════════════════
  const handleAddCustomer = async (e: FormEvent) => {
    e.preventDefault()
    setAddCustomerErr('')
    if (!newCustomerName.trim()) { setAddCustomerErr(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required'); return }
    setAddingCustomer(true)
    const res = await api.post('/customers', {
      name:  newCustomerName.trim(),
      email: newCustomerEmail.trim() || undefined,
      phone: newCustomerPhone.trim() || undefined,
    })
    setAddingCustomer(false)
    if (res.error) { setAddCustomerErr(res.error); return }

    // أضف العميل الجديد للقائمة وحدده تلقائياً
    const newC: Customer = { id: res.data?.data?.id || res.data?.id, name: newCustomerName.trim() }
    setCustomers(prev => [...prev, newC])
    setForm(prev => ({ ...prev, customer_id: String(newC.id) }))
    setShowAddCustomer(false)
    setNewCustomerName(''); setNewCustomerEmail(''); setNewCustomerPhone('')
  }

  // ── أصناف الفاتورة helpers ────────────────────────────
  const addSaleItem = () => setSaleItems(prev => [...prev, { product_id: '', name: '', qty: 1, unit_price: 0 }])
  const removeSaleItem = (idx: number) => setSaleItems(prev => prev.filter((_, i) => i !== idx))
  const updateSaleItem = (idx: number, field: string, val: any) => {
    setSaleItems(prev => {
      const arr = [...prev]
      arr[idx] = { ...arr[idx], [field]: val }
      if (field === 'product_id') {
        const p = products.find(p => String(p.id) === val)
        if (p) { arr[idx].name = p.name; arr[idx].unit_price = p.sell_price || p.price || 0 }
      }
      return arr
    })
  }
  const saleSubtotal = saleItems.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const selectedSaleTax = taxRates.find(tx => String(tx.id) === form.tax_rate_id)
  const saleTaxAmount = selectedSaleTax ? Math.round(saleSubtotal * selectedSaleTax.rate) / 100 : 0
  const saleTotal = saleSubtotal + saleTaxAmount

  // ══════════════════════════════════════════════════════
  // إضافة بيع جديد → POST /api/sales
  // ══════════════════════════════════════════════════════
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.customer_id) {
      setFormError(lang === 'ar' ? 'يجب اختيار العميل' : 'Customer is required')
      return
    }

    setFormLoading(true)
    const validItems = saleItems.filter(i => i.product_id && i.qty > 0)
    const res = await api.post('/sales', {
      customer_id:     Number(form.customer_id),
      notes:           form.notes,
      status:          form.status,
      payment_method:  form.payment_method || 'cash',
      items:           validItems.map(i => ({ product_id: Number(i.product_id), qty: i.qty, unit_price: i.unit_price })),
      ...(form.tax_rate_id && { tax_rate_id: Number(form.tax_rate_id) }),
    })
    setFormLoading(false)

    if (res.error) { show(res.error, 'error'); return }

    show('تم تسجيل عملية البيع ✅')
    setModalOpen(false)
    setForm({ customer_id: '', notes: '', status: 'draft', tax_rate_id: '', payment_method: 'cash' })
    setShowAddCustomer(false)
    setSaleItems([{ product_id: '', name: '', qty: 1, unit_price: 0 }])
    fetchSales()
  }

  // ══════════════════════════════════════════════════════
  // حذف بيع → DELETE /api/sales/{id}
  // ══════════════════════════════════════════════════════
  const handleDelete = async () => {
    if (!deleteId) return
    const res = await api.delete(`/sales/${deleteId}`)
    setDeleteId(null)
    if (res.error) { alert(res.error); return }
    setSales((prev) => prev.filter((s) => s.id !== deleteId))
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0)

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')

  const statusBadge = (s: string) => ({
    completed: 'badge-success',
    paid:      'badge-success',
    pending:   'badge-warning',
    draft:     'badge-muted',
    cancelled: 'badge-danger',
    refunded:  'badge-danger',
  }[s] || 'badge-muted')

  return (
    <ERPLayout pageTitle={t('sales')}>
      <ToastContainer toasts={toasts} remove={remove} />
      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder={lang === 'ar' ? 'بحث في المبيعات...' : 'Search sales...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            className="input"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(s)}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + {lang === 'ar' ? 'بيع جديد' : 'New Sale'}
        </button>
      </div>

      {/* ── الجدول ──────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44 }} />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('customer')}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                  <th>{t('date')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <a href={`/sales/${sale.id}`} className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>
                        {sale.invoice_number}
                      </a>
                    </td>
                    <td>{sale.customer?.name || '—'}</td>
                    <td className="fw-semibold">{fmt(sale.total)}</td>
                    <td>
                      <span className={`badge ${statusBadge(sale.status)}`}>
                        {t(sale.status) || sale.status}
                      </span>
                    </td>
                    <td className="text-muted">{fmtDate(sale.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <a href={`/sales/${sale.id}`} className="btn btn-secondary btn-sm">
                          {t('view')}
                        </a>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteId(sale.id)}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ──────────────────────────────── */}
        {total > 15 && (
          <div className="sales-pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {lang === 'ar' ? '← السابق' : '← Prev'}
            </button>
            <span className="text-muted">
              {lang === 'ar' ? `صفحة ${page}` : `Page ${page}`}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={sales.length < 15}
            >
              {lang === 'ar' ? 'التالي →' : 'Next →'}
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          Modal: إضافة بيع جديد
      ══════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => { setModalOpen(false); setShowAddCustomer(false) }}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {lang === 'ar' ? 'بيع جديد' : 'New Sale'}
              </h3>
              <button className="btn-icon" onClick={() => { setModalOpen(false); setShowAddCustomer(false) }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="modal-body">
                <div className="form-grid">

                  {/* العميل + إضافة عميل inline */}
                  <div className="input-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ marginBottom: 0 }}>{t('customer')} *</label>
                      <button
                        type="button"
                        onClick={() => { setShowAddCustomer(!showAddCustomer); setAddCustomerErr('') }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
                          color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600,
                        }}
                      >
                        {showAddCustomer
                          ? (lang === 'ar' ? '← رجوع للقائمة' : '← Back to list')
                          : (lang === 'ar' ? '+ عميل جديد' : '+ New Customer')
                        }
                      </button>
                    </div>

                    {/* إضافة عميل inline */}
                    {showAddCustomer ? (
                      <div style={{ border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: 'var(--color-primary-light)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input
                            className="input"
                            placeholder={lang === 'ar' ? 'الاسم *' : 'Name *'}
                            value={newCustomerName}
                            onChange={e => setNewCustomerName(e.target.value)}
                            autoFocus
                          />
                          <input
                            className="input"
                            placeholder={lang === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}
                            type="email"
                            value={newCustomerEmail}
                            onChange={e => setNewCustomerEmail(e.target.value)}
                          />
                          <input
                            className="input"
                            placeholder={lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}
                            value={newCustomerPhone}
                            onChange={e => setNewCustomerPhone(e.target.value)}
                          />
                          {addCustomerErr && (
                            <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>⚠️ {addCustomerErr}</div>
                          )}
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleAddCustomer}
                            disabled={addingCustomer}
                            style={{ alignSelf: 'flex-start' }}
                          >
                            {addingCustomer ? '⏳...' : (lang === 'ar' ? '✓ حفظ العميل' : '✓ Save Customer')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <select
                        className="input"
                        value={form.customer_id}
                        onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                        required
                      >
                        <option value="">
                          {customers.length === 0
                            ? (lang === 'ar' ? '← اضغط "+ عميل جديد" لإضافة عميل' : '← Click "+ New Customer" to add one')
                            : (lang === 'ar' ? 'اختر العميل' : 'Select Customer')
                          }
                        </option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* الحالة */}
                  <div className="input-group">
                    <label className="input-label">{t('status')}</label>
                    <select
                      className="input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{t(s)}</option>
                      ))}
                    </select>
                  </div>

                  {/* طريقة الدفع */}
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                    <select className="input" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                      <option value="cash">{lang === 'ar' ? 'نقدي' : 'Cash'}</option>
                      <option value="card">{lang === 'ar' ? 'بطاقة بنكية' : 'Card'}</option>
                      <option value="transfer">{lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                      <option value="credit">{lang === 'ar' ? 'آجل (دين)' : 'Credit'}</option>
                    </select>
                  </div>

                  {/* الضريبة */}
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الضريبة (اختياري)' : 'Tax Rate (optional)'}</label>
                    <select className="input" value={form.tax_rate_id} onChange={e => setForm({ ...form, tax_rate_id: e.target.value })}>
                      <option value="">{lang === 'ar' ? 'بدون ضريبة' : 'No Tax'}</option>
                      {taxRates.map(tx => (
                        <option key={tx.id} value={tx.id}>{tx.name} ({tx.rate}%)</option>
                      ))}
                    </select>
                    {form.tax_rate_id && taxRates.find(tx => String(tx.id) === form.tax_rate_id) && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', marginTop: 4 }}>
                        {lang === 'ar'
                          ? `سيُضاف ${taxRates.find(tx => String(tx.id) === form.tax_rate_id)!.rate}% ضريبة على الإجمالي`
                          : `${taxRates.find(tx => String(tx.id) === form.tax_rate_id)!.rate}% tax will be added`}
                      </p>
                    )}
                  </div>

                  {/* ── أصناف الفاتورة ── */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className="fw-semibold">{lang === 'ar' ? 'أصناف الفاتورة' : 'Invoice Items'}</label>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addSaleItem}>+ {lang === 'ar' ? 'صنف' : 'Add Item'}</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {saleItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                          <select className="input" value={item.product_id} onChange={e => updateSaleItem(idx, 'product_id', e.target.value)}>
                            <option value="">{lang === 'ar' ? 'اختر منتج' : 'Select Product'}</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input className="input" type="number" min="0.001" step="0.001" placeholder={lang === 'ar' ? 'الكمية' : 'Qty'} value={item.qty} onChange={e => updateSaleItem(idx, 'qty', Number(e.target.value))} />
                          <input className="input" type="number" min="0" step="0.01" placeholder={lang === 'ar' ? 'سعر البيع' : 'Unit Price'} value={item.unit_price} onChange={e => updateSaleItem(idx, 'unit_price', Number(e.target.value))} />
                          <button type="button" className="btn-icon" onClick={() => removeSaleItem(idx)} style={{ color: 'var(--color-danger)' }}>✕</button>
                        </div>
                      ))}
                    </div>
                    {/* ملخص الإجمالي */}
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <strong>{new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(saleSubtotal)}</strong></div>
                      {selectedSaleTax && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? `ضريبة ${selectedSaleTax.rate}%:` : `Tax ${selectedSaleTax.rate}%:`} <strong>{new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(saleTaxAmount)}</strong></div>}
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>{lang === 'ar' ? 'الإجمالي:' : 'Total:'} {new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(saleTotal)}</div>
                    </div>
                  </div>

                  {/* ملاحظات */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">{t('notes')}</label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder={lang === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                {formError && (
                  <div className="login-error" style={{ marginTop: '1rem' }}>
                    <span>⚠️</span> {formError}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setShowAddCustomer(false) }}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading || showAddCustomer}>
                  {formLoading
                    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('loading')}</>
                    : t('save')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Modal: تأكيد الحذف
      ══════════════════════════════════════════════════ */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{t('confirm_delete')}</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                {lang === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                {t('cancel')}
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

    </ERPLayout>
  )
}
