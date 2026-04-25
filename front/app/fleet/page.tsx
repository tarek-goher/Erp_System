'use client'

// ══════════════════════════════════════════════════════════
// app/fleet/page.tsx — إدارة الأسطول (محدّثة: مركبات + وقود + صيانة)
// API: GET/POST /api/fleet  |  GET/POST /api/fuel  |  GET/POST /api/maintenance
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Vehicle = { id:number; plate?:string; plate_number?:string; model?:string; name?:string; brand?:string; year?:number; color?:string; status:string; odometer?:number; mileage?:number; assigned_to?:string; assigned_driver?:string; created_at:string }
type FuelLog = { id:number; vehicle_id:number; vehicle?:{name?:string;model?:string;plate?:string}; date:string; liters:number; cost:number; odometer?:number; notes?:string }
type Maint   = { id:number; vehicle_id:number; vehicle?:{name?:string;model?:string;plate?:string}; type:string; description?:string; cost:number; date:string; status:string; next_due?:string }

const TABS = ['vehicles','fuel','maintenance'] as const

export default function FleetPage() {
  const { t, lang } = useI18n()
  const ar = (a:string,e:string) => lang==='ar'?a:e
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('vehicles')

  const [vehicles,setVehicles]=useState<Vehicle[]>([]);const [vLoad,setVLoad]=useState(true);const [vSearch,setVSearch]=useState('');const [vModal,setVModal]=useState(false);const [vSave,setVSave]=useState(false);const [vErr,setVErr]=useState('');const [vDel,setVDel]=useState<number|null>(null)
  const [vForm,setVForm]=useState({plate_number:'',model:'',brand:'',year:'',color:'',mileage:'',assigned_driver:'',status:'available'})

  const [fuels,setFuels]=useState<FuelLog[]>([]);const [fLoad,setFLoad]=useState(true);const [fModal,setFModal]=useState(false);const [fSave,setFSave]=useState(false);const [fErr,setFErr]=useState('')
  const [fForm,setFForm]=useState({vehicle_id:'',date:'',liters:'',cost:'',odometer:'',notes:''})

  const [mains,setMains]=useState<Maint[]>([]);const [mLoad,setMLoad]=useState(true);const [mModal,setMModal]=useState(false);const [mSave,setMSave]=useState(false);const [mErr,setMErr]=useState('')
  const [mForm,setMForm]=useState({vehicle_id:'',type:'',description:'',cost:'',date:'',status:'scheduled',next_due:''})

  const ea=(d:any):any[]=>{if(!d)return[];if(Array.isArray(d))return d;if(Array.isArray(d.data))return d.data;return[]}

  useEffect(()=>{(async()=>{setVLoad(true);const r=await api.get(`/fleet?per_page=50${vSearch?'&search='+vSearch:''}`);if(r.data)setVehicles(ea(r.data));setVLoad(false)})()},[vSearch])
  useEffect(()=>{(async()=>{setFLoad(true);const r=await api.get('/fuel?per_page=50');if(r.data)setFuels(ea(r.data));setFLoad(false)})()},[])
  useEffect(()=>{(async()=>{setMLoad(true);const r=await api.get('/maintenance?per_page=50');if(r.data)setMains(ea(r.data));setMLoad(false)})()},[])

  const saveV=async(e:FormEvent)=>{e.preventDefault();setVErr('');if(!vForm.plate_number||!vForm.model){setVErr(ar('اللوحة والموديل مطلوبان','Plate and model required'));return};setVSave(true);const r=await api.post('/fleet',{name:(vForm.brand?vForm.brand+' '+vForm.model:vForm.model).trim(),plate:vForm.plate_number,model:vForm.model,brand:vForm.brand,year:vForm.year?Number(vForm.year):null,color:vForm.color,odometer:vForm.mileage?Number(vForm.mileage):0,assigned_to:vForm.assigned_driver,status:vForm.status});setVSave(false);if(r.error){setVErr(r.error);return};setVModal(false);setVForm({plate_number:'',model:'',brand:'',year:'',color:'',mileage:'',assigned_driver:'',status:'available'});const nr=await api.get('/fleet?per_page=50');if(nr.data)setVehicles(ea(nr.data))}

  const saveF=async(e:FormEvent)=>{e.preventDefault();setFErr('');if(!fForm.vehicle_id||!fForm.date||!fForm.liters||!fForm.cost){setFErr(ar('الحقول الأساسية مطلوبة','Required fields missing'));return};setFSave(true);const r=await api.post('/fuel',{vehicle_id:Number(fForm.vehicle_id),date:fForm.date,liters:Number(fForm.liters),cost:Number(fForm.cost),odometer:fForm.odometer?Number(fForm.odometer):null,notes:fForm.notes});setFSave(false);if(r.error){setFErr(r.error);return};setFModal(false);setFForm({vehicle_id:'',date:'',liters:'',cost:'',odometer:'',notes:''});const nr=await api.get('/fuel?per_page=50');if(nr.data)setFuels(ea(nr.data))}

  const saveM=async(e:FormEvent)=>{e.preventDefault();setMErr('');if(!mForm.vehicle_id||!mForm.type||!mForm.date){setMErr(ar('المركبة والنوع والتاريخ مطلوبة','Vehicle, type and date required'));return};setMSave(true);const r=await api.post('/maintenance',{vehicle_id:Number(mForm.vehicle_id),type:mForm.type,description:mForm.description,cost:mForm.cost?Number(mForm.cost):0,date:mForm.date,status:mForm.status,next_due:mForm.next_due||null});setMSave(false);if(r.error){setMErr(r.error);return};setMModal(false);setMForm({vehicle_id:'',type:'',description:'',cost:'',date:'',status:'scheduled',next_due:''});const nr=await api.get('/maintenance?per_page=50');if(nr.data)setMains(ea(nr.data))}

  const vBadge=(s:string)=>({available:'badge-success',in_use:'badge-warning',maintenance:'badge-danger',retired:'badge-muted'}[s]||'badge-muted')
  const mBadge=(s:string)=>({scheduled:'badge-info',in_progress:'badge-warning',completed:'badge-success',cancelled:'badge-muted'}[s]||'badge-muted')
  const vLbl=(s:string)=>({available:ar('متاح','Available'),in_use:ar('قيد الاستخدام','In Use'),maintenance:ar('صيانة','Maintenance'),retired:ar('متقاعد','Retired')}[s]||s)
  const mLbl=(s:string)=>({scheduled:ar('مجدولة','Scheduled'),in_progress:ar('جارية','In Progress'),completed:ar('مكتملة','Completed'),cancelled:ar('ملغية','Cancelled')}[s]||s)
  const fmt=(n:number)=>new Intl.NumberFormat(lang==='ar'?'ar-EG':'en-US').format(n||0)
  const fmtD=(d:string)=>d?new Date(d).toLocaleDateString(lang==='ar'?'ar-EG':'en-US'):'—'

  const Skel=()=><div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:12}}>{Array(5).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:44}}/>)}</div>
  const Empty=({icon,msg}:{icon:string;msg:string})=><div className="empty-state"><div className="empty-state-icon">{icon}</div><p className="empty-state-text">{msg}</p></div>
  const Del=({onConfirm,onCancel}:{onConfirm:()=>void;onCancel:()=>void})=>(
    <div className="modal-overlay" onClick={onCancel}><div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
      <div className="modal-body" style={{textAlign:'center',padding:'2rem'}}><div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🗑️</div><h3>{t('confirm_delete')}</h3></div>
      <div className="modal-footer"><button className="btn btn-secondary" onClick={onCancel}>{t('cancel')}</button><button className="btn btn-danger" onClick={onConfirm}>{t('delete')}</button></div>
    </div></div>
  )

  return (
    <ERPLayout pageTitle={ar('إدارة الأسطول','Fleet Management')}>
      <div className="tabs" style={{marginBottom:'1rem'}}>
        {TABS.map(tab=>(
          <button key={tab} className={`tab ${activeTab===tab?'active':''}`} onClick={()=>setActiveTab(tab)}>
            {tab==='vehicles'?'🚗 ':tab==='fuel'?'⛽ ':'🔧 '}{tab==='vehicles'?ar('المركبات','Vehicles'):tab==='fuel'?ar('سجل الوقود','Fuel Logs'):ar('الصيانة','Maintenance')}
          </button>
        ))}
      </div>

      {activeTab==='vehicles'&&(<>
        <div className="toolbar">
          <div className="toolbar-actions"><div className="search-bar"><span>🔍</span><input placeholder={ar('بحث...','Search...')} value={vSearch} onChange={e=>setVSearch(e.target.value)}/></div></div>
          <button className="btn btn-primary" onClick={()=>setVModal(true)}>+ {ar('مركبة جديدة','New Vehicle')}</button>
        </div>
        <div className="card" style={{padding:0}}>
          {vLoad?<Skel/>:vehicles.length===0?<Empty icon="🚗" msg={ar('لا توجد مركبات','No vehicles')}/>:(
            <div className="table-container"><table className="table">
              <thead><tr><th>{ar('اللوحة','Plate')}</th><th>{ar('الموديل','Model')}</th><th>{ar('الماركة','Brand')}</th><th>{ar('السائق','Driver')}</th><th>{ar('الكيلومترات','Mileage')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr></thead>
              <tbody>{vehicles.map(v=>(
                <tr key={v.id}>
                  <td className="fw-semibold">{v.plate||v.plate_number||'—'}</td>
                  <td>{v.model||v.name||'—'}</td><td className="text-muted">{v.brand||'—'}</td>
                  <td>{v.assigned_to||v.assigned_driver||'—'}</td>
                  <td>{(v.odometer??v.mileage)?fmt(v.odometer??v.mileage??0):'—'}</td>
                  <td><span className={`badge ${vBadge(v.status)}`}>{vLbl(v.status)}</span></td>
                  <td><button className="btn btn-danger btn-sm" onClick={()=>setVDel(v.id)}>{t('delete')}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </>)}

      {activeTab==='fuel'&&(<>
        <div className="toolbar"><div className="toolbar-actions"/><button className="btn btn-primary" onClick={()=>setFModal(true)}>+ {ar('تسجيل وقود','Log Fuel')}</button></div>
        <div className="card" style={{padding:0}}>
          {fLoad?<Skel/>:fuels.length===0?<Empty icon="⛽" msg={ar('لا توجد سجلات وقود','No fuel logs')}/>:(
            <div className="table-container"><table className="table">
              <thead><tr><th>{ar('المركبة','Vehicle')}</th><th>{ar('التاريخ','Date')}</th><th>{ar('اللترات','Liters')}</th><th>{ar('التكلفة','Cost')}</th><th>{ar('العداد','Odometer')}</th><th>{ar('ملاحظات','Notes')}</th><th>{t('actions')}</th></tr></thead>
              <tbody>{fuels.map(f=>(
                <tr key={f.id}>
                  <td className="fw-semibold">{f.vehicle?.name||f.vehicle?.model||`#${f.vehicle_id}`}</td>
                  <td>{fmtD(f.date)}</td><td>{fmt(f.liters)} L</td><td>{fmt(f.cost)}</td>
                  <td>{f.odometer?fmt(f.odometer):'—'}</td><td className="text-muted">{f.notes||'—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={async()=>{await api.delete(`/fuel/${f.id}`);setFuels(p=>p.filter(x=>x.id!==f.id))}}>{t('delete')}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </>)}

      {activeTab==='maintenance'&&(<>
        <div className="toolbar"><div className="toolbar-actions"/><button className="btn btn-primary" onClick={()=>setMModal(true)}>+ {ar('طلب صيانة','New Maintenance')}</button></div>
        <div className="card" style={{padding:0}}>
          {mLoad?<Skel/>:mains.length===0?<Empty icon="🔧" msg={ar('لا توجد سجلات صيانة','No maintenance records')}/>:(
            <div className="table-container"><table className="table">
              <thead><tr><th>{ar('المركبة','Vehicle')}</th><th>{ar('النوع','Type')}</th><th>{ar('التاريخ','Date')}</th><th>{ar('التكلفة','Cost')}</th><th>{t('status')}</th><th>{ar('القادم','Next Due')}</th><th>{t('actions')}</th></tr></thead>
              <tbody>{mains.map(m=>(
                <tr key={m.id}>
                  <td className="fw-semibold">{m.vehicle?.name||m.vehicle?.model||`#${m.vehicle_id}`}</td>
                  <td>{m.type}</td><td>{fmtD(m.date)}</td><td>{fmt(m.cost)}</td>
                  <td><span className={`badge ${mBadge(m.status)}`}>{mLbl(m.status)}</span></td>
                  <td className="text-muted">{m.next_due?fmtD(m.next_due):'—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={async()=>{await api.delete(`/maintenance/${m.id}`);setMains(p=>p.filter(x=>x.id!==m.id))}}>{t('delete')}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </>)}

      {vModal&&(<div className="modal-overlay" onClick={()=>setVModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">🚗 {ar('مركبة جديدة','New Vehicle')}</h3><button className="btn-icon" onClick={()=>setVModal(false)}>✕</button></div>
        <form onSubmit={saveV}><div className="modal-body"><div className="form-grid form-grid-2">
          <div className="input-group"><label className="input-label">{ar('رقم اللوحة','Plate')} *</label><input className="input" value={vForm.plate_number} onChange={e=>setVForm({...vForm,plate_number:e.target.value})} required/></div>
          <div className="input-group"><label className="input-label">{ar('الموديل','Model')} *</label><input className="input" value={vForm.model} onChange={e=>setVForm({...vForm,model:e.target.value})} required/></div>
          <div className="input-group"><label className="input-label">{ar('الماركة','Brand')}</label><input className="input" value={vForm.brand} onChange={e=>setVForm({...vForm,brand:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">{ar('السنة','Year')}</label><input className="input" type="number" min="1990" max="2030" value={vForm.year} onChange={e=>setVForm({...vForm,year:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">{ar('اللون','Color')}</label><input className="input" value={vForm.color} onChange={e=>setVForm({...vForm,color:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">{ar('الكيلومترات','Mileage')}</label><input className="input" type="number" min="0" value={vForm.mileage} onChange={e=>setVForm({...vForm,mileage:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">{ar('السائق','Driver')}</label><input className="input" value={vForm.assigned_driver} onChange={e=>setVForm({...vForm,assigned_driver:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">{t('status')}</label><select className="input" value={vForm.status} onChange={e=>setVForm({...vForm,status:e.target.value})}>
            <option value="available">{ar('متاح','Available')}</option><option value="in_use">{ar('قيد الاستخدام','In Use')}</option><option value="maintenance">{ar('صيانة','Maintenance')}</option><option value="retired">{ar('متقاعد','Retired')}</option>
          </select></div>
        </div>{vErr&&<div style={{color:'var(--color-danger)',marginTop:'0.75rem',fontSize:'0.875rem'}}>⚠️ {vErr}</div>}</div>
        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>setVModal(false)}>{t('cancel')}</button><button type="submit" className="btn btn-primary" disabled={vSave}>{vSave?t('loading'):t('save')}</button></div>
        </form></div></div>)}

      {fModal&&(<div className="modal-overlay" onClick={()=>setFModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">⛽ {ar('تسجيل وقود','Log Fuel')}</h3><button className="btn-icon" onClick={()=>setFModal(false)}>✕</button></div>
        <form onSubmit={saveF}><div className="modal-body"><div className="form-grid form-grid-2">
          <div className="input-group"><label className="input-label">{ar('المركبة','Vehicle')} *</label><select className="input" value={fForm.vehicle_id} onChange={e=>setFForm({...fForm,vehicle_id:e.target.value})} required>
            <option value="">{ar('اختر','Select')}</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.plate||v.plate_number} - {v.model||v.name}</option>)}
          </select></div>
          <div className="input-group"><label className="input-label">{ar('التاريخ','Date')} *</label><input className="input" type="date" value={fForm.date} onChange={e=>setFForm({...fForm,date:e.target.value})} required/></div>
          <div className="input-group"><label className="input-label">{ar('اللترات','Liters')} *</label><input className="input" type="number" min="0" step="0.01" value={fForm.liters} onChange={e=>setFForm({...fForm,liters:e.target.value})} required/></div>
          <div className="input-group"><label className="input-label">{ar('التكلفة','Cost')} *</label><input className="input" type="number" min="0" step="0.01" value={fForm.cost} onChange={e=>setFForm({...fForm,cost:e.target.value})} required/></div>
          <div className="input-group"><label className="input-label">{ar('العداد','Odometer')}</label><input className="input" type="number" min="0" value={fForm.odometer} onChange={e=>setFForm({...fForm,odometer:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">{ar('ملاحظات','Notes')}</label><input className="input" value={fForm.notes} onChange={e=>setFForm({...fForm,notes:e.target.value})}/></div>
        </div>{fErr&&<div style={{color:'var(--color-danger)',marginTop:'0.75rem',fontSize:'0.875rem'}}>⚠️ {fErr}</div>}</div>
        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>setFModal(false)}>{t('cancel')}</button><button type="submit" className="btn btn-primary" disabled={fSave}>{fSave?t('loading'):t('save')}</button></div>
        </form></div></div>)}

      {mModal&&(<div className="modal-overlay" onClick={()=>setMModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">🔧 {ar('طلب صيانة','New Maintenance')}</h3><button className="btn-icon" onClick={()=>setMModal(false)}>✕</button></div>
        <form onSubmit={saveM}><div className="modal-body"><div className="form-grid form-grid-2">
          <div className="input-group"><label className="input-label">{ar('المركبة','Vehicle')} *</label><select className="input" value={mForm.vehicle_id} onChange={e=>setMForm({...mForm,vehicle_id:e.target.value})} required>
            <option value="">{ar('اختر','Select')}</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.plate||v.plate_number} - {v.model||v.name}</option>)}
          </select></div>
          <div className="input-group"><label className="input-label">{ar('النوع','Type')} *</label><input className="input" placeholder={ar('مثال: تغيير زيت','e.g. Oil Change')} value={mForm.type} onChange={e=>setMForm({...mForm,type:e.target.value})} required/></div>
          <div className="input-group"><label className="input-label">{ar('التاريخ','Date')} *</label><input className="input" type="date" value={mForm.date} onChange={e=>setMForm({...mForm,date:e.target.value})} required/></div>
          <div className="input-group"><label className="input-label">{ar('التكلفة','Cost')}</label><input className="input" type="number" min="0" step="0.01" value={mForm.cost} onChange={e=>setMForm({...mForm,cost:e.target.value})}/></div>
          <div className="input-group"><label className="input-label">{t('status')}</label><select className="input" value={mForm.status} onChange={e=>setMForm({...mForm,status:e.target.value})}>
            <option value="scheduled">{ar('مجدولة','Scheduled')}</option><option value="in_progress">{ar('جارية','In Progress')}</option><option value="completed">{ar('مكتملة','Completed')}</option><option value="cancelled">{ar('ملغية','Cancelled')}</option>
          </select></div>
          <div className="input-group"><label className="input-label">{ar('الموعد القادم','Next Due')}</label><input className="input" type="date" value={mForm.next_due} onChange={e=>setMForm({...mForm,next_due:e.target.value})}/></div>
          <div className="input-group" style={{gridColumn:'1/-1'}}><label className="input-label">{ar('الوصف','Description')}</label><textarea className="input" rows={2} value={mForm.description} onChange={e=>setMForm({...mForm,description:e.target.value})}/></div>
        </div>{mErr&&<div style={{color:'var(--color-danger)',marginTop:'0.75rem',fontSize:'0.875rem'}}>⚠️ {mErr}</div>}</div>
        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>setMModal(false)}>{t('cancel')}</button><button type="submit" className="btn btn-primary" disabled={mSave}>{mSave?t('loading'):t('save')}</button></div>
        </form></div></div>)}

      {vDel&&<Del onConfirm={async()=>{await api.delete(`/fleet/${vDel}`);setVehicles(p=>p.filter(x=>x.id!==vDel));setVDel(null)}} onCancel={()=>setVDel(null)}/>}
    </ERPLayout>
  )
}
