'use client'

// ══════════════════════════════════════════════════════════
// app/suppliers/page.tsx — صفحة الموردين
// API:
//   GET    /api/suppliers              → قائمة الموردين
//   POST   /api/suppliers              → إضافة مورد
//   PUT    /api/suppliers/{id}         → تعديل مورد
//   DELETE /api/suppliers/{id}         → حذف مورد
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Supplier = {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  payment_terms?: string
  notes?: string
  is_active: boolean
  created_at: string
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '', payment_terms: '', notes: '', is_active: true,
}

export default function SuppliersPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<Supplier | null>(null)
  const [form,      setForm]      = useState({ ...EMPTY_FORM })
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [toast,     setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchSuppliers = async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), ...(search && { search }) })
    const res = await api.get(`/suppliers?${p}`)
    if (res.data) {
      setSuppliers(res.data.data ?? res.data)
      setTotal(res.data.total ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { fetchSuppliers() }, [page, search])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (s: Supplier) => {
    setEditing(s)
    setForm({
      name: s.name, email: s.email ?? '', phone: s.phone ?? '',
      address: s.address ?? '', payment_terms: s.payment_terms ?? '',
      notes: s.notes ?? '', is_active: s.is_active,
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name  = ar ? 'اسم المورد مطلوب' : 'Name is required'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = ar ? 'بريد إلكتروني غير صحيح' : 'Invalid email'
    if (form.phone && form.phone.length < 7) e.phone = ar ? 'رقم هاتف غير صحيح' : 'Invalid phone'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const res = editing
      ? await api.put(`/suppliers/${editing.id}`, form)
      : await api.post('/suppliers', form)
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    showToast(ar ? (editing ? 'تم تحديث المورد' : 'تم إضافة المورد') : (editing ? 'Supplier updated' : 'Supplier added'))
    setModalOpen(false)
    fetchSuppliers()
  }

  const handleDelete = async (s: Supplier) => {
    if (!confirm(ar ? `حذف "${s.name}"؟` : `Delete "${s.name}"?`)) return
    const res = await api.delete(`/suppliers/${s.id}`)
    if (res.error) { showToast(res.error, 'error'); return }
    showToast(ar ? 'تم حذف المورد' : 'Supplier deleted')
    fetchSuppliers()
  }

  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '12px 20px', borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: 600,
          }}>{toast.msg}</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
              {ar ? '🏭 الموردون' : '🏭 Suppliers'}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
              {ar ? `إجمالي: ${total} مورد` : `Total: ${total} suppliers`}
            </p>
          </div>
          <button onClick={openAdd} style={{
            background: '#1a56db', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            {ar ? '+ إضافة مورد' : '+ Add Supplier'}
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder={ar ? 'بحث باسم المورد...' : 'Search suppliers...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 20,
            border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14,
            boxSizing: 'border-box', outline: 'none',
          }}
        />

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            <div style={{ fontSize: 32 }}>⏳</div>
            <div>{ar ? 'جاري التحميل...' : 'Loading...'}</div>
          </div>
        ) : suppliers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            <div style={{ fontSize: 48 }}>🏭</div>
            <div style={{ marginTop: 8 }}>{ar ? 'لا يوجد موردون' : 'No suppliers found'}</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {[
                    ar ? 'الاسم' : 'Name',
                    ar ? 'الهاتف' : 'Phone',
                    ar ? 'البريد' : 'Email',
                    ar ? 'شروط الدفع' : 'Payment Terms',
                    ar ? 'الحالة' : 'Status',
                    ar ? 'إجراءات' : 'Actions',
                  ].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: 13, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{s.phone || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{s.email || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{s.payment_terms || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: s.is_active ? '#d1fae5' : '#fee2e2',
                        color: s.is_active ? '#065f46' : '#991b1b',
                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      }}>
                        {s.is_active ? (ar ? 'نشط' : 'Active') : (ar ? 'موقوف' : 'Inactive')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => openEdit(s)} style={{
                        background: '#eff6ff', color: '#1a56db', border: 'none',
                        borderRadius: 6, padding: '6px 12px', cursor: 'pointer', marginLeft: 6, fontSize: 12,
                      }}>
                        {ar ? 'تعديل' : 'Edit'}
                      </button>
                      <button onClick={() => handleDelete(s)} style={{
                        background: '#fef2f2', color: '#dc2626', border: 'none',
                        borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12,
                      }}>
                        {ar ? 'حذف' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', background: page === 1 ? '#f9fafb' : '#fff' }}>
              {ar ? 'السابق' : 'Prev'}
            </button>
            <span style={{ padding: '8px 16px', color: '#6b7280' }}>{ar ? `صفحة ${page}` : `Page ${page}`}</span>
            <button disabled={suppliers.length < 15} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}>
              {ar ? 'التالي' : 'Next'}
            </button>
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>
                {editing ? (ar ? 'تعديل المورد' : 'Edit Supplier') : (ar ? 'إضافة مورد جديد' : 'Add Supplier')}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'اسم المورد *' : 'Supplier Name *'}
                  </label>
                  <input value={form.name} onChange={f('name')} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  {errors.name && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.name}</p>}
                </div>

                {/* Phone */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'الهاتف' : 'Phone'}
                  </label>
                  <input value={form.phone} onChange={f('phone')} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.phone ? '#ef4444' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  {errors.phone && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.phone}</p>}
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input type="email" value={form.email} onChange={f('email')} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  {errors.email && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.email}</p>}
                </div>

                {/* Address */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'العنوان' : 'Address'}
                  </label>
                  <input value={form.address} onChange={f('address')} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>

                {/* Payment Terms */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'شروط الدفع' : 'Payment Terms'}
                  </label>
                  <select value={form.payment_terms} onChange={f('payment_terms')} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}>
                    <option value="">{ar ? 'اختر شروط الدفع' : 'Select terms'}</option>
                    <option value="cash">{ar ? 'نقدي' : 'Cash'}</option>
                    <option value="net_30">{ar ? 'صافي 30 يوم' : 'Net 30'}</option>
                    <option value="net_60">{ar ? 'صافي 60 يوم' : 'Net 60'}</option>
                    <option value="net_90">{ar ? 'صافي 90 يوم' : 'Net 90'}</option>
                  </select>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'ملاحظات' : 'Notes'}
                  </label>
                  <textarea value={form.notes} onChange={f('notes')} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                {/* Active */}
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={f('is_active')} style={{ width: 16, height: 16 }} />
                  <label htmlFor="is_active" style={{ fontWeight: 600, fontSize: 13 }}>
                    {ar ? 'مورد نشط' : 'Active Supplier'}
                  </label>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{
                    padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8,
                    background: '#fff', cursor: 'pointer', fontWeight: 600,
                  }}>
                    {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={saving} style={{
                    padding: '10px 20px', border: 'none', borderRadius: 8,
                    background: saving ? '#93c5fd' : '#1a56db', color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {saving && <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                    {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'حفظ' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </ERPLayout>
  )
}
