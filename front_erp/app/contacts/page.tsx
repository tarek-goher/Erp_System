'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { StatCard, Badge, EmptyState, SearchInput, Modal, ToastContainer, ConfirmDialog } from '../../components/ui'

type Contact = {
  id: number; name: string; email: string; phone?: string
  type: 'customer'|'supplier'; company?: string; address?: string; notes?: string
}

export default function ContactsPage() {
  const { toasts, show, remove } = useToast()
  const [contacts,   setContacts]   = useState<Contact[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAdd,    setShowAdd]    = useState(false)
  const [editItem,   setEditItem]   = useState<Contact | null>(null)
  const [deleteId,   setDeleteId]   = useState<number | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'', type:'customer', company:'', address:'', notes:'' })

  const load = async () => {
    setLoading(true)
    const [cRes, sRes] = await Promise.all([api.get('/customers?per_page=200'), api.get('/suppliers?per_page=200')])
    const customers = (Array.isArray(cRes.data)?cRes.data:(cRes.data?.data??[])).map((c:any) => ({...c, type:'customer'}))
    const suppliers = (Array.isArray(sRes.data)?sRes.data:(sRes.data?.data??[])).map((s:any) => ({...s, type:'supplier'}))
    setContacts([...customers, ...suppliers])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = contacts.filter(c => {
    const ms = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
    const mt = typeFilter==='all' || c.type===typeFilter
    return ms && mt
  })

  const openAdd = () => { setEditItem(null); setForm({name:'',email:'',phone:'',type:'customer',company:'',address:'',notes:''}); setShowAdd(true) }
  const openEdit = (c: Contact) => { setEditItem(c); setForm({name:c.name,email:c.email,phone:c.phone??'',type:c.type,company:c.company??'',address:c.address??'',notes:c.notes??''}); setShowAdd(true) }

  const handleSave = async () => {
    if (!form.name) { show('الاسم مطلوب', 'error'); return }
    setSaving(true)
    const endpoint = form.type==='customer' ? '/customers' : '/suppliers'
    const res = editItem
      ? await api.patch(`${endpoint}/${editItem.id}`, form)
      : await api.post(endpoint, form)
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show(editItem ? 'تم التحديث ✅' : 'تمت الإضافة ✅'); setShowAdd(false); load()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const c = contacts.find(x => x.id===deleteId)
    if (!c) return
    const endpoint = c.type==='customer' ? '/customers' : '/suppliers'
    const res = await api.delete(`${endpoint}/${deleteId}`)
    if (res.error) { show(res.error, 'error'); return }
    show('تم الحذف ✅'); setDeleteId(null); setContacts(p => p.filter(x => x.id!==deleteId))
  }

  const INP: React.CSSProperties = {
    width:'100%', padding:'0.6rem 1rem', background:'var(--bg-input)',
    border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
    color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'inherit', outline:'none',
  }

  return (
    <ERPLayout pageTitle="جهات الاتصال">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div><h1 className="page-title">📇 جهات الاتصال</h1><p className="page-subtitle">العملاء والموردون في مكان واحد</p></div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ إضافة جهة اتصال</button>
      </div>
      <div className="grid-3" style={{marginBottom:'1.25rem'}}>
        <StatCard icon="📇" label="إجمالي جهات الاتصال" value={contacts.length} />
        <StatCard icon="👤" label="عملاء"  value={contacts.filter(c=>c.type==='customer').length} accent="var(--color-primary)" />
        <StatCard icon="🏭" label="موردون" value={contacts.filter(c=>c.type==='supplier').length} accent="var(--color-secondary)" />
      </div>
      <div style={{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}}>
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو البريد..." />
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{...INP,width:'auto',minWidth:130}}>
          <option value="all">الكل</option>
          <option value="customer">عملاء</option>
          <option value="supplier">موردون</option>
        </select>
      </div>
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {Array(6).fill(0).map((_,i) => <div key={i} className="skeleton" style={{height:52}} />)}
        </div>
      ) : filtered.length===0 ? <EmptyState icon="📇" title="لا توجد جهات اتصال" /> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الهاتف</th><th>الشركة</th><th>النوع</th><th>إجراءات</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={`${c.type}-${c.id}`}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:'50%',background:c.type==='customer'?'var(--color-primary-light)':'var(--color-secondary-light)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:c.type==='customer'?'var(--color-primary)':'var(--color-secondary)',fontSize:'0.85rem',flexShrink:0}}>
                        {c.name.charAt(0)}
                      </div>
                      <span style={{fontWeight:700,fontSize:'0.875rem'}}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{fontSize:'0.8rem',direction:'ltr'}}>{c.email||'—'}</td>
                  <td style={{fontSize:'0.8rem',direction:'ltr'}}>{c.phone||'—'}</td>
                  <td style={{fontSize:'0.8rem'}}>{c.company||'—'}</td>
                  <td><Badge color={c.type==='customer'?'info':'purple'}>{c.type==='customer'?'عميل':'مورد'}</Badge></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(c)}>تعديل</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>setDeleteId(c.id)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title={editItem?'تعديل جهة الاتصال':'إضافة جهة اتصال جديدة'} size="md"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowAdd(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'⏳...':'حفظ'}</button></>}>
        <div className="form-grid form-grid-2">
          <div className="input-group"><label className="input-label">الاسم *</label>
            <input style={INP} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
          <div className="input-group"><label className="input-label">النوع</label>
            <select style={INP} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              <option value="customer">عميل</option><option value="supplier">مورد</option>
            </select></div>
          <div className="input-group"><label className="input-label">البريد الإلكتروني</label>
            <input style={INP} type="email" dir="ltr" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
          <div className="input-group"><label className="input-label">الهاتف</label>
            <input style={INP} dir="ltr" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div>
          <div className="input-group"><label className="input-label">الشركة</label>
            <input style={INP} value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} /></div>
          <div className="input-group"><label className="input-label">العنوان</label>
            <input style={INP} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} /></div>
          <div className="input-group" style={{gridColumn:'1/-1'}}><label className="input-label">ملاحظات</label>
            <textarea rows={2} style={INP} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={handleDelete} title="حذف جهة الاتصال" />
    </ERPLayout>
  )
}
