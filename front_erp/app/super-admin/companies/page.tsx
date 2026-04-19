'use client'
import { useState, useEffect, useRef, ChangeEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../../lib/auth'
import { api, extractArray } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { StatCard, SearchInput, Badge, EmptyState, ToastContainer, ConfirmDialog } from '../../../components/ui'

// Local modal to avoid z-index issues with the shared Modal component
function InlineModal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 99999, padding: '1rem',
  }
  const box: React.CSSProperties = {
    background: 'var(--bg-card, #1e1e2e)', border: '1px solid var(--border, #333)',
    borderRadius: 'var(--radius-lg, 12px)', width: '100%', maxWidth: 600,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  }
  const header: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border, #333)',
  }
  const body: React.CSSProperties = { padding: '1.4rem', overflowY: 'auto', flex: 1 }
  const foot: React.CSSProperties = {
    padding: '1rem 1.4rem', borderTop: '1px solid var(--border, #333)',
    display: 'flex', justifyContent: 'flex-end', gap: 8,
  }

  const modal = (
    <div style={overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={box}>
        <div style={header}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted, #aaa)', lineHeight: 1 }}>×</button>
        </div>
        <div style={body}>{children}</div>
        {footer && <div style={foot}>{footer}</div>}
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modal, document.body) : null
}

const PLAN_COLORS: Record<string, string> = {
  starter: '#06B6D4', professional: '#7c3aed', enterprise: '#F59E0B',
}
const STATUS_META: Record<string, { label: string; color: string }> = {
  active:       { label: 'نشط',           color: '#22C55E' },
  suspended:    { label: 'موقوف',         color: '#EF4444' },
  trial:        { label: 'تجريبي',        color: '#8B5CF6' },
  inactive:     { label: 'منتهي',         color: '#9CA3AF' },
}

type Company = {
  id: number; name: string; email: string; phone: string; subscription_plan: string
  status: 'active' | 'suspended' | 'trial' | 'inactive'
  is_active: boolean; country: string; created_at: string; users_count?: number
}

const EMPTY_FORM = { company_name: '', name: '', email: '', phone: '', subscription_plan: 'starter', country: 'مصر', password: '' }

export default function CompaniesPage() {
  const { token } = useAuth()
  const { toasts, show, remove } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd]     = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [viewCompany, setViewCompany] = useState<Company | null>(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [importRows, setImportRows] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [deleteId, setDeleteId]   = useState<number | null>(null)

  const fetchCompanies = async () => {
    setLoading(true)
    const params = new URLSearchParams({ per_page: '100' })
    if (search) params.set('search', search)
    if (filterStatus !== 'all') params.set('status', filterStatus)
    const res = await api.get(`/super-admin/companies?${params}`)
    if (res.data) setCompanies(extractArray(res.data))
    setLoading(false)
  }
  useEffect(() => { fetchCompanies() }, [search, filterStatus])

  const handleAdd = async () => {
    if (!form.company_name || !form.email || !form.name) {
      show('اسم الشركة، المسؤول، والإيميل مطلوبان', 'error'); return
    }
    if (form.password && form.password.length < 8) {
      show('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error'); return
    }
    const pwd = (form.password && form.password.length >= 8) ? form.password : 'password123'
    setSaving(true)
    const payload = {
      company_name:          form.company_name,
      name:                  form.name,
      email:                 form.email,
      phone:                 form.phone,
      subscription_plan:     form.subscription_plan,
      country:               form.country,
      password:              pwd,
      password_confirmation: pwd,
    }
    const res = await api.post('/auth/register', payload)
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(`تم إضافة الشركة ${form.company_name} والمدير ${form.name} ✅`)
    setForm(EMPTY_FORM); setShowAdd(false); fetchCompanies()
  }

  const toggleStatus = async (company: Company) => {
    const endpoint = company.status === 'active'
      ? `/super-admin/companies/${company.id}/suspend`
      : `/super-admin/companies/${company.id}/activate`
    const res = await api.post(endpoint)
    if (res.error) { show(res.error, 'error'); return }
    show(company.status === 'active' ? `تم إيقاف ${company.name}` : `تم تفعيل ${company.name} ✅`)
    fetchCompanies()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await api.delete(`/super-admin/companies/${deleteId}`, { confirm: 'DELETE' })
    if (res.error) { show(res.error, 'error'); return }
    show('تم الحذف بنجاح'); setDeleteId(null); fetchCompanies()
  }

  const handleExport = () => {
    show('خاصية التصدير غير مفعلة حالياً (تطلب مكتبة xlsx)', 'info')
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    show('خاصية الاستيراد غير مفعلة حالياً (تطلب مكتبة xlsx)', 'info')
  }

  const handleImport = async () => {
    if (!importRows.length) return
    setImporting(true); let success = 0, failed = 0
    for (const row of importRows) {
      const body = {
        name: row['الاسم'] || row['name'] || '',
        email: row['الإيميل'] || row['email'] || '',
        phone: row['الهاتف'] || row['phone'] || '',
        plan: row['الخطة'] || row['plan'] || 'starter',
        country: row['البلد'] || row['country'] || 'مصر',
        password: 'password123', password_confirmation: 'password123',
      }
      if (!body.name || !body.email) { failed++; continue }
      const res = await api.post('/auth/register', body)
      if (!res.error) success++; else failed++
    }
    show(`تم استيراد ${success} شركة${failed > 0 ? ` — فشل ${failed}` : ''} ✅`)
    setShowImport(false); setImportRows([]); fetchCompanies(); setImporting(false)
  }

  const getStatus = (c: Company) => c.status ?? (c.is_active ? 'active' : 'inactive')

  const INP: React.CSSProperties = {
    width: '100%', padding: '0.6rem 1rem', background: 'var(--bg-input)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div>
      <ToastContainer toasts={toasts} remove={remove} />
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileChange} />
      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 إدارة الشركات</h1>
          <p className="page-subtitle">الشركات المشتركة في منصة CodeSphere</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>📥 تصدير</button>
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>📤 استيراد</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ شركة جديدة</button>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <StatCard icon="🏢" label="إجمالي الشركات"  value={companies.length} />
        <StatCard icon="✅" label="نشطة"             value={companies.filter(c => c.status === 'active').length}       accent="var(--color-success)" />
        <StatCard icon="🔍" label="تجريبية"          value={companies.filter(c => c.status === 'trial').length}        accent="#8B5CF6" />
        <StatCard icon="⛔" label="موقوفة"           value={companies.filter(c => c.status === 'suspended').length}    accent="var(--color-danger)" />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو الإيميل..." />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input" style={{ width: 'auto', minWidth: 140 }}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="trial">تجريبي</option>
          <option value="suspended">موقوف</option>
          <option value="inactive">منتهي</option>
        </select>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState icon="🏢" title="لا توجد شركات" description="لم يتم تسجيل أي شركات بعد" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>الشركة</th><th>الهاتف</th><th>الخطة</th><th>الحالة</th><th>البلد</th><th>تاريخ التسجيل</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {companies.map(c => {
                const sk = getStatus(c); const st = STATUS_META[sk] ?? STATUS_META['inactive']
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🏢</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', direction: 'ltr' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', direction: 'ltr' }}>{c.phone || '—'}</td>
                    <td>
                      <span style={{ background: (PLAN_COLORS[c.subscription_plan] ?? '#888') + '22', color: PLAN_COLORS[c.subscription_plan] ?? '#888', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>{c.subscription_plan?.toUpperCase()}</span>
                    </td>
                    <td>
                      <span style={{ background: st.color + '22', color: st.color, padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>{st.label}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{c.country || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewCompany(c)}>👁 عرض</button>
                        <button className="btn btn-sm" style={{ background: c.status === 'active' ? 'var(--color-danger-light)' : 'var(--color-success-light)', color: c.status === 'active' ? 'var(--color-danger)' : 'var(--color-success)' }} onClick={() => toggleStatus(c)}>
                          {c.status === 'active' ? 'إيقاف' : 'تفعيل'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(c.id)}>حذف</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <InlineModal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة شركة جديدة"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? '⏳ جارٍ الحفظ...' : '✅ إضافة'}</button></>}>
        <div className="form-grid form-grid-2">
          <div className="input-group"><label className="input-label">اسم الشركة *</label>
            <input style={INP} value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder="شركة النيل" /></div>
          <div className="input-group"><label className="input-label">اسم المسؤول *</label>
            <input style={INP} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="محمد أحمد" /></div>
          <div className="input-group"><label className="input-label">البريد الإلكتروني *</label>
            <input style={INP} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} dir="ltr" /></div>
          <div className="input-group"><label className="input-label">الهاتف</label>
            <input style={INP} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} dir="ltr" /></div>
          <div className="input-group"><label className="input-label">الخطة</label>
            <select style={INP} value={form.subscription_plan} onChange={e => setForm(p => ({ ...p, subscription_plan: e.target.value }))}>
              <option value="starter">STARTER</option><option value="professional">PROFESSIONAL</option><option value="enterprise">ENTERPRISE</option>
            </select></div>
          <div className="input-group"><label className="input-label">البلد</label>
            <select style={INP} value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}>
              {['مصر','السعودية','الإمارات','الكويت','الأردن','البحرين','عُمان','قطر','ليبيا','المغرب','تونس','الجزائر'].map(c => <option key={c}>{c}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">باسورد المدير</label>
            <input style={INP} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="اتركه فارغاً → password123" dir="ltr" /></div>
        </div>
      </InlineModal>
      <InlineModal open={!!viewCompany} onClose={() => setViewCompany(null)} title={`تفاصيل: ${viewCompany?.name}`}
        footer={<button className="btn btn-secondary" onClick={() => setViewCompany(null)}>إغلاق</button>}>
        {viewCompany && (
          <div className="form-grid form-grid-2">
            {[
              { label: 'اسم الشركة', val: viewCompany.name },
              { label: 'البريد الإلكتروني', val: viewCompany.email },
              { label: 'الهاتف', val: viewCompany.phone || '—' },
              { label: 'الخطة', val: viewCompany.subscription_plan?.toUpperCase() },
              { label: 'البلد', val: viewCompany.country || '—' },
              { label: 'الحالة', val: STATUS_META[viewCompany.status]?.label ?? viewCompany.status },
              { label: 'عدد المستخدمين', val: String(viewCompany.users_count ?? '—') },
              { label: 'تاريخ التسجيل', val: new Date(viewCompany.created_at).toLocaleDateString('ar-EG') },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}
      </InlineModal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="حذف الشركة" message="هل أنت متأكد من حذف هذه الشركة؟" />
    </div>
  )
}