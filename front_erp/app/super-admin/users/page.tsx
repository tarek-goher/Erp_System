'use client'
import { useState, useEffect } from 'react'
import { api, extractArray } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { StatCard, Badge, EmptyState, SearchInput, ToastContainer, Modal } from '../../../components/ui'

type SAUser = {
  id: string; name: string; email: string; phone: string
  company: string; role: string; is_active: boolean; last_login: string; created_at: string
}

const INP: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem',
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
  fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
}

export default function SuperAdminUsersPage() {
  const { toasts, show, remove } = useToast()
  const [users, setUsers]             = useState<SAUser[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState<'all'|'active'|'inactive'>('all')
  const [resetTarget, setResetTarget] = useState<SAUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting]     = useState(false)

  // ── حالة التعديل ──────────────────────────────────────
  const [editTarget, setEditTarget]   = useState<SAUser | null>(null)
  const [editForm, setEditForm]       = useState({ name: '', email: '', phone: '', role: '' })
  const [editSaving, setEditSaving]   = useState(false)
  const [editErr, setEditErr]         = useState('')

  const load = async () => {
    setLoading(true)
    const res = await api.get('/super-admin/users')
    if (res.error) {
      show(res.error, 'error')
    } else if (res.data) {
      const list = extractArray(res.data)
      setUsers(list.map((u: any) => ({
        id: String(u.id), name: u.name ?? '', email: u.email ?? '', phone: u.phone ?? '',
        company: u.company?.name ?? u.company_name ?? '—',
        role: (typeof u.roles?.[0] === 'object' ? (u.roles?.[0] as any)?.name : u.roles?.[0]) ?? u.role ?? '—',
        is_active: u.is_active ?? u.status === 'active' ?? true,
        last_login: (u.last_login ?? u.last_login_at ?? '').slice(0, 10),
        created_at: (u.created_at ?? '').slice(0, 10),
      })))
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.company.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || (filter === 'active' && u.is_active) || (filter === 'inactive' && !u.is_active)
    return matchSearch && matchFilter
  })

  const toggleActive = async (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u))
    const res = await api.post(`/super-admin/users/${id}/toggle-active`)
    if (res.error) { show(res.error, 'error'); load() } else show('تم تحديث الحالة ✅')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
    const res = await api.delete(`/super-admin/users/${id}`)
    if (res.error) { show(res.error, 'error'); return }
    show('تم الحذف ✅'); setUsers(prev => prev.filter(u => u.id !== id))
  }

  const handleResetPassword = async () => {
    if (!resetTarget || newPassword.length < 8) { show('الباسورد لازم يكون 8 أحرف على الأقل', 'error'); return }
    setResetting(true)
    const res = await api.post(`/super-admin/users/${resetTarget.id}/reset-password`, {
      password: newPassword, password_confirmation: newPassword,
    })
    setResetting(false)
    if (res.error) { show(res.error, 'error'); return }
    show(`تم تغيير باسورد ${resetTarget.name} ✅`); setResetTarget(null); setNewPassword('')
  }

  // ── فتح مودال التعديل ────────────────────────────────
  const openEdit = (u: SAUser) => {
    setEditTarget(u)
    setEditForm({ name: u.name, email: u.email, phone: u.phone, role: u.role })
    setEditErr('')
  }

  // ── حفظ التعديل ─────────────────────────────────────
  const handleEdit = async () => {
    if (!editTarget) return
    setEditErr('')
    if (!editForm.name.trim() || !editForm.email.trim()) { setEditErr('الاسم والبريد مطلوبان'); return }
    setEditSaving(true)
    const res = await api.patch(`/super-admin/users/${editTarget.id}`, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim() || undefined,
      role: editForm.role || undefined,
    })
    setEditSaving(false)
    if (res.error) { setEditErr(res.error); return }
    show(`تم تعديل ${editForm.name} ✅`)
    setEditTarget(null)
    load()
  }

  return (
    <div>
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div><h1 className="page-title">👤 إدارة المستخدمين</h1><p className="page-subtitle">عرض وإدارة جميع مستخدمي النظام</p></div>
      </div>
      <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
        <StatCard icon="👥" label="إجمالي المستخدمين" value={users.length} />
        <StatCard icon="🟢" label="نشط"   value={users.filter(u=>u.is_active).length}  accent="var(--color-success)" />
        <StatCard icon="🔴" label="معطّل" value={users.filter(u=>!u.is_active).length} accent="var(--color-danger)" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو البريد أو الشركة..." />
        {(['all','active','inactive'] as const).map(f => (
          <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f==='all'?'الكل':f==='active'?'نشط':'معطّل'}
          </button>
        ))}
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array(6).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      ) : filtered.length === 0 ? <EmptyState icon="👤" title="لا يوجد مستخدمون" /> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>الاسم</th><th>البريد</th><th>الشركة</th><th>الدور</th><th>آخر دخول</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontSize: '0.8rem', direction: 'ltr' }}>{u.email}</td>
                  <td style={{ fontSize: '0.8rem' }}>{u.company}</td>
                  <td><Badge color="gray">{u.role !== '—' ? u.role : <span style={{color:'var(--text-muted)'}}>—</span>}</Badge></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.last_login || '—'}</td>
                  <td><Badge color={u.is_active?'success':'danger'}>{u.is_active?'نشط':'معطّل'}</Badge></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background:'var(--color-primary-light)',color:'var(--color-primary)' }} onClick={() => openEdit(u)}>✏️ تعديل</button>
                      <button className="btn btn-sm" style={{ background: u.is_active?'var(--color-danger-light)':'var(--color-success-light)', color: u.is_active?'var(--color-danger)':'var(--color-success)' }} onClick={() => toggleActive(u.id)}>
                        {u.is_active?'تعطيل':'تفعيل'}
                      </button>
                      <button className="btn btn-sm" style={{ background:'var(--color-warning-light)',color:'var(--color-warning)' }} onClick={() => setResetTarget(u)}>🔑 باسورد</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── مودال التعديل ─────────────────────────────── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)}
        title={`✏️ تعديل: ${editTarget?.name}`} size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEditTarget(null)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleEdit} disabled={editSaving}>{editSaving?'⏳ جارٍ الحفظ...':'💾 حفظ التعديلات'}</button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="input-group">
            <label className="input-label">الاسم *</label>
            <input style={INP} value={editForm.name} onChange={e => setEditForm(p=>({...p, name: e.target.value}))} />
          </div>
          <div className="input-group">
            <label className="input-label">البريد الإلكتروني *</label>
            <input style={INP} type="email" dir="ltr" value={editForm.email} onChange={e => setEditForm(p=>({...p, email: e.target.value}))} />
          </div>
          <div className="input-group">
            <label className="input-label">الهاتف</label>
            <input style={INP} dir="ltr" value={editForm.phone} onChange={e => setEditForm(p=>({...p, phone: e.target.value}))} />
          </div>
          <div className="input-group">
            <label className="input-label">الدور</label>
            <select style={INP} value={editForm.role} onChange={e => setEditForm(p=>({...p, role: e.target.value}))}>
              <option value="">— بدون دور —</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="sales">Sales</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          {editErr && <div style={{ color:'var(--color-danger)', fontSize:'0.875rem', padding:'0.5rem', background:'var(--color-danger-light)', borderRadius:'var(--radius-md)' }}>⚠️ {editErr}</div>}
        </div>
      </Modal>

      {/* ── مودال تغيير الباسورد ──────────────────────── */}
      <Modal open={!!resetTarget} onClose={() => { setResetTarget(null); setNewPassword('') }}
        title={`🔑 تغيير باسورد: ${resetTarget?.name}`} size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => { setResetTarget(null); setNewPassword('') }}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleResetPassword} disabled={resetting}>{resetting?'⏳ جارٍ...':'تأكيد التغيير'}</button></>}>
        <div className="input-group">
          <label className="input-label">الباسورد الجديد (8 أحرف على الأقل)</label>
          <input type="password" className="input" dir="ltr" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
        </div>
      </Modal>
    </div>
  )
}
