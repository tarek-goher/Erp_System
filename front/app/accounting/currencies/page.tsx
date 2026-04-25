'use client'

// ══════════════════════════════════════════════════════════
// app/accounting/currencies/page.tsx — إدارة العملات
// API: GET /api/currencies
//      POST /api/currencies
//      PUT /api/currencies/{id}
//      DELETE /api/currencies/{id}
//      POST /api/currencies/{id}/set-default
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { Modal, ToastContainer, EmptyState, Badge } from '../../../components/ui'

type Currency = {
  id: number
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_default: boolean  // ← ده ناقص
  is_active: boolean
}

const EMPTY_FORM = { code: '', name: '', symbol: '', exchange_rate: 1, is_active: true }

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'دولار أمريكي',   symbol: '$'  },
  { code: 'EUR', name: 'يورو',            symbol: '€'  },
  { code: 'GBP', name: 'جنيه إسترليني',  symbol: '£'  },
  { code: 'SAR', name: 'ريال سعودي',      symbol: 'ر.س'},
  { code: 'AED', name: 'درهم إماراتي',   symbol: 'د.إ'},
  { code: 'KWD', name: 'دينار كويتي',    symbol: 'د.ك'},
  { code: 'EGP', name: 'جنيه مصري',      symbol: 'ج.م'},
  { code: 'JOD', name: 'دينار أردني',    symbol: 'د.أ'},
  { code: 'QAR', name: 'ريال قطري',      symbol: 'ر.ق'},
  { code: 'BHD', name: 'دينار بحريني',   symbol: 'د.ب'},
]

const INP: React.CSSProperties = {
  width: '100%', padding: '0.6rem 1rem', background: 'var(--bg-input)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
}

export default function CurrenciesPage() {
  const { toasts, show, remove } = useToast()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editItem, setEditItem]     = useState<Currency | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState<number | null>(null)
const load = async () => {
    setLoading(true)
    const res = await api.get('/currencies')
    if (res.data) {
      const arr = Array.isArray(res.data) ? res.data : (res.data.data ?? [])
      setCurrencies(arr.map((c: any) => ({ ...c, exchange_rate: parseFloat(c.exchange_rate) || 1 })))
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (c: Currency) => {
    setEditItem(c)
    setForm({ code: c.code, name: c.name, symbol: c.symbol, exchange_rate: c.exchange_rate, is_active: c.is_active })
    setShowForm(true)
  }

  const fillCommon = (code: string) => {
    const found = COMMON_CURRENCIES.find(c => c.code === code)
    if (found) setForm(f => ({ ...f, code: found.code, name: found.name, symbol: found.symbol }))
  }

  const handleSave = async () => {
    if (!form.code || !form.name) { show('الكود والاسم مطلوبان', 'error'); return }
    setSaving(true)
    const res = editItem
      ? await api.put(`/currencies/${editItem.id}`, form)
      : await api.post('/currencies', form)
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(editItem ? '✅ تم التحديث' : '✅ تم الإضافة')
    setShowForm(false); load()
  }

  const handleSetDefault = async (c: Currency) => {
    const res = await api.post(`/currencies/${c.id}/set-default`)
    if (res.error) { show(res.error, 'error'); return }
    show(`✅ ${c.name} أصبحت العملة الافتراضية`)
    load()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await api.delete(`/currencies/${deleteId}`)
    if (res.error) { show(res.error, 'error'); return }
    show('تم الحذف'); setDeleteId(null); load()
  }

  const defaultCurrency = currencies.find(c => c.is_default)

  return (
    <ERPLayout pageTitle="إدارة العملات">
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="page-header">
        <div>
          <h1 className="page-title">💱 إدارة العملات</h1>
          <p className="page-subtitle">إضافة العملات وتحديد أسعار الصرف</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ إضافة عملة</button>
      </div>

      {defaultCurrency && (
        <div style={{ background:'var(--color-success-light)', border:'1px solid var(--color-success)', borderRadius:'var(--radius-md)', padding:'0.75rem 1rem', marginBottom:'1.25rem', fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8 }}>
          ✅ العملة الافتراضية الحالية: <strong>{defaultCurrency.name} ({defaultCurrency.code})</strong> — سعر الصرف = 1
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:10 }}>
            {Array(4).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:44 }} />)}
          </div>
        ) : currencies.length === 0 ? (
          <EmptyState icon="💱" title="لا توجد عملات" description="أضف عملتك الأولى للبدء" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>الاسم</th>
                  <th>الرمز</th>
                  <th>سعر الصرف</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight:700, fontFamily:'monospace', fontSize:'1rem' }}>{c.code}</span>
                      {c.is_default && <span style={{ marginRight:6, background:'var(--color-success-light)', color:'var(--color-success)', fontSize:'0.7rem', padding:'1px 6px', borderRadius:'var(--radius-full)', fontWeight:700 }}>افتراضي</span>}
                    </td>
                    <td>{c.name}</td>
                    <td style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--color-primary)' }}>{c.symbol}</td>
                    <td style={{ fontFamily:'monospace' }}>
                      {c.is_default ? '1.0000 (أساسي)' : (c.exchange_rate as number).toFixed(4)}
                    </td>
                    <td>
                      <span className={`badge ${c.is_active ? 'badge-success' : 'badge-muted'}`}>
                        {c.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {!c.is_default && (
                          <button className="btn btn-sm" style={{ background:'var(--color-success-light)', color:'var(--color-success)' }} onClick={() => handleSetDefault(c)}>
                            ⭐ افتراضي
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>تعديل</button>
                        {!c.is_default && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(c.id)}>حذف</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal إضافة / تعديل */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editItem ? `تعديل: ${editItem.name}` : 'إضافة عملة جديدة'}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ جارٍ الحفظ...' : '✅ حفظ'}
            </button>
          </>
        }
      >
        {!editItem && (
          <div className="input-group" style={{ marginBottom:'1rem' }}>
            <label className="input-label">اختر من العملات الشائعة</label>
            <select style={INP} onChange={e => fillCommon(e.target.value)} defaultValue="">
              <option value="">— اختر سريع —</option>
              {COMMON_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-grid form-grid-2">
          <div className="input-group">
            <label className="input-label">كود العملة * (مثال: USD)</label>
            <input style={INP} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EGP" maxLength={3} />
          </div>
          <div className="input-group">
            <label className="input-label">اسم العملة *</label>
            <input style={INP} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="جنيه مصري" />
          </div>
          <div className="input-group">
            <label className="input-label">الرمز</label>
            <input style={INP} value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="ج.م" />
          </div>
          <div className="input-group">
            <label className="input-label">سعر الصرف (مقابل العملة الافتراضية)</label>
            <input style={INP} type="number" step="0.0001" min="0.0001" value={form.exchange_rate} onChange={e => setForm(f => ({ ...f, exchange_rate: parseFloat(e.target.value) || 1 }))} />
          </div>
          <div className="input-group">
            <label className="input-label">الحالة</label>
            <select style={INP} value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'active' }))}>
              <option value="active">نشط</option>
              <option value="inactive">معطل</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* تأكيد الحذف */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign:'center', padding:'2rem' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🗑️</div>
              <h3>حذف العملة؟</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginTop:8 }}>لا يمكن التراجع عن هذا الإجراء</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDelete}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </ERPLayout>
  )
}
