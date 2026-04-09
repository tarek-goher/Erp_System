'use client'

// ══════════════════════════════════════════════════════════
// app/users/page.tsx — صفحة إدارة المستخدمين
// API: GET /api/users | POST /api/users
//      PATCH /api/users/{id} | DELETE /api/users/{id}
//      GET /api/roles → للأدوار
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type User = {
  id: number
  name: string
  email: string
  phone?: string
  is_active: boolean
  roles?: string[]
  last_login_at?: string
  created_at: string
}
type Role = { id: number; name: string }

export default function UsersPage() {
  const { t, lang } = useI18n()
  const [users,    setUsers]    = useState<User[]>([])
  const [roles,    setRoles]    = useState<Role[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: '', is_active: true
  })

  const fetchUsers = async () => {
    setLoading(true)
    const p = new URLSearchParams({ per_page: '20', ...(search && { search }) })
    const res = await api.get<{ data: User[] | { data: User[] } }>(`/users?${p}`)
    if (res.data) {
      // 💡 Handle both paginated and simple list responses
      const rawData = res.data?.data ?? res.data
      const usersList = Array.isArray(rawData) ? rawData : (rawData?.data ?? [])
      setUsers(usersList)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [search])
  useEffect(() => {
    api.get('/roles').then(r => {
      const raw = Array.isArray(r.data) ? r.data : ((r.data as any)?.data || [])
      setRoles(raw.map((role: any) => ({ id: role.id, name: typeof role === 'string' ? role : role.name })))
    })
  }, [])

  const openEdit = (user: User) => {
    setEditUser(user)
    const roleVal = typeof user.roles?.[0] === 'object' ? (user.roles?.[0] as any)?.name ?? '' : (user.roles?.[0] as string ?? '')
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', role: roleVal, is_active: user.is_active })
    setModal(true)
  }

  const openAdd = () => {
    setEditUser(null)
    setForm({ name: '', email: '', password: '', phone: '', role: '', is_active: true })
    setModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.name || !form.email) { setFormErr(t('required_field')); return }
    if (!editUser && !form.password) { setFormErr(lang === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required'); return }
    setSaving(true)

    const payload: any = {
      name: form.name, email: form.email, phone: form.phone,
      is_active: form.is_active, role: form.role || undefined,
    }
    if (form.password) payload.password = form.password

    const res = editUser
      ? await api.patch(`/users/${editUser.id}`, payload)
      : await api.post('/users', payload)

    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    fetchUsers()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/users/${deleteId}`)
    setDeleteId(null)
    setUsers(prev => prev.filter(u => u.id !== deleteId))
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'المستخدمون' : 'Users'}>

      <div className="toolbar">
        <div className="search-bar">
          <span>🔍</span>
          <input
            placeholder={lang === 'ar' ? 'بحث في المستخدمين...' : 'Search users...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + {lang === 'ar' ? 'مستخدم جديد' : 'New User'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>{t('email')}</th>
                  <th>{t('phone')}</th>
                  <th>{lang === 'ar' ? 'الدور' : 'Role'}</th>
                  <th>{lang === 'ar' ? 'آخر دخول' : 'Last Login'}</th>
                  <th>{lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="fw-semibold">{user.name}</td>
                    <td className="text-muted">{user.email}</td>
                    <td className="text-muted">{user.phone || '—'}</td>
                    <td>{typeof user.roles?.[0] === 'string' ? user.roles[0] : (user.roles?.[0] as any)?.name || '—'}</td>
                    <td className="text-muted">{user.last_login_at ? fmtDate(user.last_login_at) : '—'}</td>
                    <td className="text-muted">{fmtDate(user.created_at)}</td>
                    <td>
                      <span className={`badge ${user.is_active !== false ? 'badge-success' : 'badge-muted'}`}>
                        {user.is_active !== false ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(user)}>{t('edit')}</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(user.id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: إضافة / تعديل مستخدم */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editUser ? (lang === 'ar' ? 'تعديل المستخدم' : 'Edit User') : (lang === 'ar' ? 'مستخدم جديد' : 'New User')}
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="input-group">
                    <label className="input-label">{t('name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('email')} *</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('phone')}</label>
                    <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">
                      {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                      {editUser && <span className="text-muted" style={{ fontSize: '0.75rem' }}> ({lang === 'ar' ? 'اتركها فارغة للاحتفاظ' : 'leave blank to keep'})</span>}
                    </label>
                    <input
                      className="input"
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required={!editUser}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{lang === 'ar' ? 'الدور' : 'Role'}</label>
                    <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="">{lang === 'ar' ? 'بدون دور' : 'No Role'}</option>
                      {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('status')}</label>
                    <select className="input" value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm({ ...form, is_active: e.target.value === 'active' })}>
                      <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                      <option value="inactive">{lang === 'ar' ? 'غير نشط' : 'Inactive'}</option>
                    </select>
                  </div>
                </div>
                {formErr && <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {formErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
              <h3>{t('confirm_delete')}</h3>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

    </ERPLayout>
  )
} 