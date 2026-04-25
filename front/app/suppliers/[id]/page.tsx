'use client'

// ══════════════════════════════════════════════════════════
// app/suppliers/[id]/page.tsx
// id = "new"  → إضافة مورد جديد
// id = number → تعديل مورد موجود
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

// ── Types ──────────────────────────────────────────────────
type SupplierForm = {
  name:            string
  type:            'company' | 'individual'
  code:            string
  status:          'active' | 'suspended' | 'blocked'
  rating:          number
  phone:           string
  email:           string
  country:         string
  city:            string
  street:          string
  contact_person:  string
  contact_phone:   string
  payment_method:  string
  payment_terms:   string
  bank_name:       string
  bank_account:    string
  products_notes:  string
  notes:           string
  attachments:     File[]
}

const EMPTY: SupplierForm = {
  name: '', type: 'company', code: '', status: 'active', rating: 0,
  phone: '', email: '', country: '', city: '', street: '',
  contact_person: '', contact_phone: '',
  payment_method: 'cash', payment_terms: '', bank_name: '', bank_account: '',
  products_notes: '', notes: '', attachments: [],
}

// ── Star Rating ────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'ضعيف / Poor', 'مقبول / Fair', 'جيد / Good', 'جيد جداً / Very Good', 'ممتاز / Excellent']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s}
            onClick={() => onChange(s === value ? 0 : s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            style={{ fontSize: 28, cursor: 'pointer', color: s <= (hovered || value) ? '#f59e0b' : '#e5e7eb', transition: 'color .1s', userSelect: 'none' }}
          >★</span>
        ))}
      </div>
      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 140 }}>{labels[hovered || value]}</span>
    </div>
  )
}

// ── Section Card ───────────────────────────────────────────
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 22px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>{title}</span>
      </div>
      <div style={{ padding: '22px' }}>{children}</div>
    </div>
  )
}

// ── Field ──────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
    </div>
  )
}

const inputStyle = (err?: string): React.CSSProperties => ({
  width: '100%', padding: '10px 12px', fontSize: 14,
  border: `1px solid ${err ? '#ef4444' : '#d1d5db'}`,
  borderRadius: 8, boxSizing: 'border-box', outline: 'none',
  transition: 'border-color .15s',
})

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14,
  border: '1px solid #d1d5db', borderRadius: 8,
  boxSizing: 'border-box', background: '#fff', cursor: 'pointer',
}

// ══════════════════════════════════════════════════════════
export default function SupplierFormPage() {
  const { lang } = useI18n()
  const ar = lang === 'ar'
  const router = useRouter()
  const params = useParams()
  const isNew = params?.id === 'new'

  const [form,    setForm]    = useState<SupplierForm>({ ...EMPTY })
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null)

  // Autocomplete duplicate check
  const [nameSuggestions, setNameSuggestions] = useState<{ id: number; name: string; code: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }
  const set = (k: keyof SupplierForm, v: any) => setForm(p => ({ ...p, [k]: v }))

  // ── Load existing supplier ──
  useEffect(() => {
    if (isNew) return
    ;(async () => {
      const res = await api.get(`/suppliers/${params?.id}`)
      if (res.data) {
        const s = res.data?.data ?? res.data
        setForm({
          name:           s.name           ?? '',
          type:           s.type           ?? 'company',
          code:           s.code           ?? '',
          status:         s.status         ?? 'active',
          rating:         s.rating         ?? 0,
          phone:          s.phone          ?? '',
          email:          s.email          ?? '',
          country:        s.country        ?? '',
          city:           s.city           ?? '',
          street:         s.street         ?? '',
          contact_person: s.contact_person ?? '',
          contact_phone:  s.contact_phone  ?? '',
          payment_method: s.payment_method ?? 'cash',
          payment_terms:  s.payment_terms  ?? '',
          bank_name:      s.bank_name      ?? '',
          bank_account:   s.bank_account   ?? '',
          products_notes: s.products_notes ?? '',
          notes:          s.notes          ?? '',
          attachments:    [],
        })
      }
      setLoading(false)
    })()
  }, [])

  // ── Name duplicate check (debounced) ──
  const handleNameChange = (val: string) => {
    set('name', val)
    if (nameTimer.current) clearTimeout(nameTimer.current)
    if (!val.trim() || val.length < 2) { setNameSuggestions([]); setShowSuggestions(false); return }
    nameTimer.current = setTimeout(async () => {
      const res = await api.get(`/suppliers?search=${encodeURIComponent(val)}&per_page=5`)
      const list = res.data?.data ?? res.data ?? []
      // ★ استثناء المورد الحالي لما نكون بنعدل
      const filtered = isNew ? list : list.filter((x: any) => x.id !== Number(params?.id))
      setNameSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    }, 300)
  }

  // ── Validate ──
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())
      e.name = ar ? 'اسم المورد مطلوب' : 'Name is required'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      e.email = ar ? 'بريد إلكتروني غير صحيح' : 'Invalid email'
    if (form.phone && !/^\+?[\d\s\-()]{7,}$/.test(form.phone))
      e.phone = ar ? 'رقم هاتف غير صحيح' : 'Invalid phone'
    if (form.contact_phone && !/^\+?[\d\s\-()]{7,}$/.test(form.contact_phone))
      e.contact_phone = ar ? 'رقم غير صحيح' : 'Invalid number'
    if (form.payment_method === 'bank_transfer') {
      if (!form.bank_name.trim())    e.bank_name    = ar ? 'اسم البنك مطلوب'    : 'Bank name required'
      if (!form.bank_account.trim()) e.bank_account = ar ? 'رقم الحساب مطلوب'  : 'Account number required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return                          // ★ منع double submit
    if (!validate()) { flash(ar ? 'يوجد أخطاء في النموذج' : 'Please fix the errors', false); return }
    setSaving(true)

const payload = {
  name:           form.name.trim(),
  code:           form.code.trim(),  // ✅ أضف السطر ده
  type:           form.type,
  status:         form.status,
  rating:         form.rating,
  phone:          form.phone.trim(),
  email:          form.email.trim().toLowerCase(),
  country:        form.country.trim(),
  city:           form.city.trim(),
  street:         form.street.trim(),
  contact_person: form.contact_person.trim(),
  contact_phone:  form.contact_phone.trim(),
  payment_method: form.payment_method,
  payment_terms:  form.payment_terms,
  bank_name:      form.payment_method === 'bank_transfer' ? form.bank_name.trim()    : '',
  bank_account:   form.payment_method === 'bank_transfer' ? form.bank_account.trim() : '',
  products_notes: form.products_notes.trim(),
  notes:          form.notes.trim(),
}

    const res = isNew
      ? await api.post('/suppliers', payload)
      : await api.put(`/suppliers/${params?.id}`, payload)

    if (res.error) { setSaving(false); flash(res.error, false); return }

    // ★ رفع الـ attachments بعد الحفظ
    if (form.attachments.length > 0) {
      const supplierId = res.data?.id ?? res.data?.data?.id
      if (supplierId) await uploadAttachments(supplierId)
    }

    setSaving(false)
    router.push('/suppliers?success=' + (isNew ? 'added' : 'updated'))
  }

  // ★ Attachment validation
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB

  const addAttachments = (files: File[]) => {
    const valid: File[] = []
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        flash(ar ? `❌ "${file.name}" أكبر من 10MB` : `❌ "${file.name}" exceeds 10MB`, false)
        continue
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        flash(ar ? `❌ "${file.name}" نوع غير مسموح` : `❌ "${file.name}" type not allowed`, false)
        continue
      }
      valid.push(file)
    }
    if (valid.length) set('attachments', [...form.attachments, ...valid])
  }

  const uploadAttachments = async (supplierId: number) => {
    if (form.attachments.length === 0) return
    const fd = new FormData()
    form.attachments.forEach(f => fd.append('files[]', f))
    await api.post(`/suppliers/${supplierId}/attachments`, fd)
  }

  if (loading) return (
    <ERPLayout>
      <div style={{ textAlign: 'center', padding: 100, color: '#9ca3af' }}>
        <div style={{ fontSize: 36 }}>⏳</div>
        <div style={{ marginTop: 10 }}>{ar ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    </ERPLayout>
  )

  // ══════════════════════════════════════════════════════════
  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: toast.ok ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '12px 22px', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontWeight: 600,
          }}>{toast.msg}</div>
        )}

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <button onClick={() => router.push('/suppliers')}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, marginBottom: 6, padding: 0 }}>
              ← {ar ? 'العودة للموردين' : 'Back to Suppliers'}
            </button>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              {isNew ? (ar ? '🏭 إضافة مورد جديد' : '🏭 Add New Supplier') : (ar ? '✏️ تعديل المورد' : '✏️ Edit Supplier')}
            </h1>
            {!isNew && form.code && (
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: 6 }}>
                {form.code}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => router.push('/suppliers')}
              style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              {ar ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={handleSubmit as any} disabled={saving}
              style={{ padding: '10px 28px', border: 'none', borderRadius: 8, background: saving ? '#93c5fd' : '#1a56db', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}>
              {saving ? (ar ? '⏳ جاري الحفظ...' : '⏳ Saving...') : (ar ? '💾 حفظ المورد' : '💾 Save Supplier')}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ══ 1. المعلومات الأساسية ══════════════════════ */}
          <Section icon="🏢" title={ar ? 'المعلومات الأساسية' : 'Basic Information'}>

            {/* Name with duplicate check */}
            <Field label={ar ? 'اسم المورد *' : 'Supplier Name *'} error={errors.name}>
              <div style={{ position: 'relative' }}>
                <input
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  style={inputStyle(errors.name)}
                  placeholder={ar ? 'اكتب اسم المورد...' : 'Enter supplier name...'}
                />
                {showSuggestions && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,.12)', maxHeight: 200, overflowY: 'auto',
                  }}>
                    <div style={{ padding: '8px 14px', fontSize: 11, color: '#f59e0b', fontWeight: 700, background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                      ⚠️ {ar ? 'موردون مشابهون موجودون — تأكد قبل الإضافة' : 'Similar suppliers found — check before adding'}
                    </div>
                    {nameSuggestions.map(s => (
                      <div key={s.id} onMouseDown={() => router.push(`/suppliers/${s.id}`)}
                        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      >
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{s.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label={ar ? 'نوع المورد' : 'Supplier Type'}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['company', 'individual'] as const).map(t => (
                    <button key={t} type="button" onClick={() => set('type', t)}
                      style={{
                        flex: 1, padding: '10px',
                        border: `2px solid ${form.type === t ? '#1a56db' : '#e5e7eb'}`,
                        borderRadius: 8,
                        background: form.type === t ? '#eff6ff' : '#fff',
                        cursor: 'pointer', fontWeight: 600, fontSize: 13,
                        color: form.type === t ? '#1a56db' : '#6b7280',
                        transition: 'all .15s',
                      }}>
                      {t === 'company' ? (ar ? '🏢 شركة' : '🏢 Company') : (ar ? '👤 فرد' : '👤 Individual')}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={ar ? 'حالة المورد' : 'Supplier Status'}>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
                  <option value="active">{ar ? '● نشط' : '● Active'}</option>
                  <option value="suspended">{ar ? '● موقوف' : '● Suspended'}</option>
                  <option value="blocked">{ar ? '● محظور' : '● Blocked'}</option>
                </select>
              </Field>
            </div>

            {/* Code */}
            <Field label={ar ? 'كود المورد (يُولَّد تلقائياً أو أدخله يدوياً)' : 'Supplier Code (auto or manual)'}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={form.code}
                  onChange={e => set('code', e.target.value)}
                  placeholder={ar ? 'مثال: SUP-0001' : 'e.g. SUP-0001'}
                  style={{ ...inputStyle(), fontFamily: 'monospace', flex: 1 }}
                />
                {isNew && (
                  <button type="button"
                    onClick={() => set('code', 'SUP-' + String(Math.floor(1000 + Math.random() * 9000)))}
                    style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, background: '#f9fafb', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    🔄 {ar ? 'توليد' : 'Generate'}
                  </button>
                )}
              </div>
              {isNew && (
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                  {ar ? '💡 الأفضل إن الكود يتولد من الـ backend تلقائياً' : '💡 Better to auto-generate the code from the backend'}
                </p>
              )}
            </Field>

            {/* Rating */}
            <Field label={ar ? 'تقييم المورد' : 'Supplier Rating'}>
              <StarRating value={form.rating} onChange={v => set('rating', v)} />
            </Field>

          </Section>

          {/* ══ 2. بيانات التواصل ══════════════════════════ */}
          <Section icon="📞" title={ar ? 'بيانات التواصل' : 'Contact Information'}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label={ar ? 'الهاتف' : 'Phone'} error={errors.phone}>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle(errors.phone)} placeholder="+20 1xx xxxx xxxx" />
              </Field>
              <Field label={ar ? 'البريد الإلكتروني' : 'Email'} error={errors.email}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle(errors.email)} placeholder="supplier@example.com" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label={ar ? 'الدولة' : 'Country'}>
                <input value={form.country} onChange={e => set('country', e.target.value)} style={inputStyle()} placeholder={ar ? 'مصر' : 'Egypt'} />
              </Field>
              <Field label={ar ? 'المدينة' : 'City'}>
                <input value={form.city} onChange={e => set('city', e.target.value)} style={inputStyle()} placeholder={ar ? 'القاهرة' : 'Cairo'} />
              </Field>
            </div>

            <Field label={ar ? 'الشارع / العنوان التفصيلي' : 'Street / Full Address'}>
              <input value={form.street} onChange={e => set('street', e.target.value)} style={inputStyle()} placeholder={ar ? 'رقم العمارة، الشارع، المنطقة...' : 'Building, street, area...'} />
            </Field>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, marginTop: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>
                👤 {ar ? 'الشخص المسؤول' : 'Contact Person'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label={ar ? 'الاسم' : 'Name'}>
                  <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} style={inputStyle()} placeholder={ar ? 'اسم المسؤول' : 'Contact name'} />
                </Field>
                <Field label={ar ? 'رقم الموبايل' : 'Mobile'} error={errors.contact_phone}>
                  <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} style={inputStyle(errors.contact_phone)} placeholder="+20 1xx xxxx xxxx" />
                </Field>
              </div>
            </div>

          </Section>

          {/* ══ 3. بيانات الدفع ════════════════════════════ */}
          <Section icon="💳" title={ar ? 'بيانات الدفع' : 'Payment Details'}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label={ar ? 'طريقة الدفع' : 'Payment Method'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    ['cash',          ar ? '💵 نقدي'       : '💵 Cash'],
                    ['bank_transfer', ar ? '🏦 تحويل بنكي' : '🏦 Bank Transfer'],
                    ['deferred',      ar ? '📅 آجل'         : '📅 Deferred'],
                  ] as [string, string][]).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => set('payment_method', val)}
                      style={{
                        padding: '10px 14px',
                        border: `2px solid ${form.payment_method === val ? '#1a56db' : '#e5e7eb'}`,
                        borderRadius: 8,
                        background: form.payment_method === val ? '#eff6ff' : '#fff',
                        cursor: 'pointer', fontWeight: 600, fontSize: 13, textAlign: 'right',
                        color: form.payment_method === val ? '#1a56db' : '#6b7280',
                        transition: 'all .15s',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={ar ? 'شروط الدفع' : 'Payment Terms'}>
                <select value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} style={selectStyle}>
                  <option value="">{ar ? 'اختر...' : 'Select...'}</option>
                  <option value="net_15">{ar ? 'صافي 15 يوم' : 'Net 15'}</option>
                  <option value="net_30">{ar ? 'صافي 30 يوم' : 'Net 30'}</option>
                  <option value="net_60">{ar ? 'صافي 60 يوم' : 'Net 60'}</option>
                  <option value="net_90">{ar ? 'صافي 90 يوم' : 'Net 90'}</option>
                  <option value="immediate">{ar ? 'فوري' : 'Immediate'}</option>
                </select>
              </Field>
            </div>

            {form.payment_method === 'bank_transfer' && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '16px 20px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: 14 }}>
                  🏦 {ar ? 'تفاصيل البنك' : 'Bank Details'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label={ar ? 'اسم البنك *' : 'Bank Name *'} error={errors.bank_name}>
                    <input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} style={inputStyle(errors.bank_name)} placeholder={ar ? 'البنك الأهلي المصري' : 'Bank name'} />
                  </Field>
                  <Field label={ar ? 'رقم الحساب *' : 'Account Number *'} error={errors.bank_account}>
                    <input value={form.bank_account} onChange={e => set('bank_account', e.target.value)} style={{ ...inputStyle(errors.bank_account), fontFamily: 'monospace' }} placeholder="XXXXXXXXXXXXXXXX" />
                  </Field>
                </div>
              </div>
            )}

          </Section>

          {/* ══ 4. المنتجات المورّدة ════════════════════════ */}
          <Section icon="📦" title={ar ? 'المنتجات المورّدة (اختياري)' : 'Supplied Products (Optional)'}>
            <Field label={ar ? 'المنتجات والفئات التي يوردها هذا المورد' : 'Products and categories this supplier provides'}>
              <textarea
                value={form.products_notes}
                onChange={e => set('products_notes', e.target.value)}
                rows={3}
                placeholder={ar ? 'مثال: قطع غيار سيارات، إلكترونيات...' : 'e.g. Auto parts, electronics...'}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </Field>
          </Section>

          {/* ══ 5. ملاحظات ومرفقات ═════════════════════════ */}
          <Section icon="📎" title={ar ? 'ملاحظات ومرفقات' : 'Notes & Attachments'}>

            <Field label={ar ? 'ملاحظات' : 'Notes'}>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder={ar ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </Field>

            {/* ★ File Upload — بيتعمل فعلياً بعد الحفظ */}
            <Field label={ar ? 'مرفقات (عقود، بطاقات، فواتير...)' : 'Attachments (contracts, IDs, invoices...)'}>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #d1d5db', borderRadius: 10, padding: '28px 20px',
                cursor: 'pointer', background: '#fafafa', gap: 8,
              }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#1a56db' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = '#d1d5db' }}
                onDrop={e => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = '#d1d5db'
                  addAttachments(Array.from(e.dataTransfer.files))
                }}
              >
                <span style={{ fontSize: 28 }}>📂</span>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
                  {ar ? 'اسحب الملفات هنا أو اضغط للرفع' : 'Drag & drop files or click to upload'}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {ar ? 'PDF، صور، Word — حتى 10MB' : 'PDF, images, Word — up to 10MB each'}
                </span>
                <input type="file" multiple hidden onChange={e => {
                  addAttachments(Array.from(e.target.files ?? []))
                  e.target.value = ''   // ★ reset عشان تقدر ترفع نفس الفايل تاني
                }} />
              </label>

              {form.attachments.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {form.attachments.map((file, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: 13 }}>📄 {file.name} <span style={{ color: '#9ca3af', fontSize: 11 }}>({(file.size / 1024).toFixed(0)} KB)</span></span>
                      <button type="button" onClick={() => set('attachments', form.attachments.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {form.attachments.length > 0 && (
                <p style={{ fontSize: 11, color: '#f59e0b', margin: '8px 0 0', fontWeight: 600 }}>
                  ⚠️ {ar ? 'الملفات هترفع بعد حفظ المورد' : 'Files will upload after saving the supplier'}
                </p>
              )}
            </Field>

          </Section>

          {/* ══ Submit Bar ═════════════════════════════════ */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, padding: '20px 0' }}>
            <button type="button" onClick={() => router.push('/suppliers')}
              style={{ padding: '12px 28px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              {ar ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '12px 36px', border: 'none', borderRadius: 8, background: saving ? '#93c5fd' : '#1a56db', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15 }}>
              {saving ? (ar ? '⏳ جاري الحفظ...' : '⏳ Saving...') : (ar ? '💾 حفظ المورد' : '💾 Save Supplier')}
            </button>
          </div>

        </form>
      </div>
    </ERPLayout>
  )
}