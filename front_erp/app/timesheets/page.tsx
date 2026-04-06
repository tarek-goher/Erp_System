'use client'
import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { StatCard, EmptyState, SearchInput, Modal, ToastContainer, ConfirmDialog } from '../../components/ui'

type Timesheet = {
  id: number; employee: string; date: string
  clock_in: string; clock_out?: string; hours?: number; notes?: string
}

export default function TimesheetsPage() {
  const { toasts, show, remove } = useToast()
  const [sheets,   setSheets]   = useState<Timesheet[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [form, setForm] = useState({ employee_id:'', date:'', clock_in:'', clock_out:'', notes:'' })

  const load = async () => {
    setLoading(true)
    const [sRes] = await Promise.all([api.get('/timesheets?per_page=100')])
    const raw = sRes.data; setSheets(Array.isArray(raw)?raw:(Array.isArray(raw?.data)?raw.data:[]))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = sheets.filter(s => !search || s.employee?.toLowerCase().includes(search.toLowerCase()))

  const handleSave = async () => {
    if (!form.employee_id || !form.date || !form.clock_in) { show('الموظف والتاريخ ووقت الحضور مطلوبة', 'error'); return }
    setSaving(true)
    const res = await api.post('/timesheets', form)
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show('تم التسجيل ✅'); setShowAdd(false); load()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await api.delete(`/timesheets/${deleteId}`)
    if (res.error) { show(res.error, 'error'); return }
    show('تم الحذف ✅'); setDeleteId(null); setSheets(p => p.filter(s => s.id !== deleteId))
  }

  const INP: React.CSSProperties = {
    width:'100%', padding:'0.6rem 1rem', background:'var(--bg-input)',
    border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
    color:'var(--text-primary)', fontSize:'0.875rem', fontFamily:'inherit', outline:'none',
  }

  const totalHours = sheets.reduce((sum, s) => sum + (s.hours ?? 0), 0)

  return (
    <ERPLayout pageTitle="كشف الوقت">
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div><h1 className="page-title">⏱️ كشف الوقت</h1><p className="page-subtitle">متابعة ساعات العمل والحضور</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ تسجيل حضور</button>
      </div>
      <div className="grid-4" style={{marginBottom:'1.25rem'}}>
        <StatCard icon="📋" label="إجمالي السجلات" value={sheets.length} />
        <StatCard icon="⏰" label="ساعات العمل"    value={`${totalHours.toFixed(1)}h`}         accent="var(--color-primary)" />
        <StatCard icon="✅" label="مكتملة"         value={sheets.filter(s=>s.clock_out).length} accent="var(--color-success)" />
        <StatCard icon="🕐" label="جارية"          value={sheets.filter(s=>!s.clock_out).length} accent="var(--color-warning)" />
      </div>
      <div style={{marginBottom:'1rem'}}>
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالموظف..." />
      </div>
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {Array(5).fill(0).map((_,i) => <div key={i} className="skeleton" style={{height:52}} />)}
        </div>
      ) : filtered.length===0 ? <EmptyState icon="⏱️" title="لا توجد سجلات" /> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>الموظف</th><th>التاريخ</th><th>وقت الحضور</th><th>وقت الانصراف</th><th>الساعات</th><th>ملاحظات</th><th>إجراءات</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{fontWeight:600}}>{s.employee}</td>
                  <td>{s.date}</td>
                  <td style={{direction:'ltr'}}>{s.clock_in}</td>
                  <td style={{direction:'ltr'}}>{s.clock_out||<span style={{color:'var(--color-warning)'}}>جارٍ...</span>}</td>
                  <td style={{fontWeight:700,color:'var(--color-primary)'}}>{s.hours ? `${s.hours.toFixed(1)}h` : '—'}</td>
                  <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{s.notes||'—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={()=>setDeleteId(s.id)}>حذف</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="تسجيل حضور جديد"
        footer={<><button className="btn btn-secondary" onClick={()=>setShowAdd(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'⏳...':'حفظ'}</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">الموظف *</label>
            <input style={INP} value={form.employee_id} onChange={e=>setForm(p=>({...p,employee_id:e.target.value}))} placeholder="رقم أو اسم الموظف" /></div>
          <div className="input-group"><label className="input-label">التاريخ *</label>
            <input style={INP} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} /></div>
          <div className="form-grid form-grid-2">
            <div className="input-group"><label className="input-label">وقت الحضور *</label>
              <input style={INP} type="time" value={form.clock_in} onChange={e=>setForm(p=>({...p,clock_in:e.target.value}))} /></div>
            <div className="input-group"><label className="input-label">وقت الانصراف</label>
              <input style={INP} type="time" value={form.clock_out} onChange={e=>setForm(p=>({...p,clock_out:e.target.value}))} /></div>
          </div>
          <div className="input-group"><label className="input-label">ملاحظات</label>
            <input style={INP} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={handleDelete} title="حذف السجل" />
    </ERPLayout>
  )
}
