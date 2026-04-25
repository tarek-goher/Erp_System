'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name:'',email:'',phone:'',password:'',password_confirmation:'',plan:'starter',country:'مصر' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (form.password !== form.password_confirmation) { setError('كلمتا المرور غير متطابقتين'); return }
    if (form.password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setLoading(true)
    const res = await api.post('/register', form)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    router.push('/login?registered=1')
  }

  const INP: React.CSSProperties = { width:'100%',padding:'0.7rem 1rem',background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:'0.9rem',fontFamily:'inherit',outline:'none' }

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg-page)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',fontFamily:'Cairo, Inter, sans-serif' }}>
      <div style={{ width:'100%',maxWidth:520,background:'var(--bg-card)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-xl)',padding:'2.5rem' }}>
        <div style={{ textAlign:'center',marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.5rem',marginBottom:'0.5rem' }}>⚡</div>
          <h1 style={{ fontSize:'1.5rem',fontWeight:800,color:'var(--text-primary)',marginBottom:4 }}>إنشاء حساب جديد</h1>
          <p style={{ color:'var(--text-muted)',fontSize:'0.875rem' }}>سجّل شركتك وابدأ الإدارة الذكية</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem' }}>
            <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>اسم الشركة *</label>
              <input style={INP} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="شركة النيل" required /></div>
            <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>الهاتف</label>
              <input style={INP} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} dir="ltr" /></div>
          </div>
          <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>البريد الإلكتروني *</label>
            <input style={INP} type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} dir="ltr" required /></div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem' }}>
            <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>كلمة المرور *</label>
              <input style={INP} type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} dir="ltr" required /></div>
            <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>تأكيد كلمة المرور *</label>
              <input style={INP} type="password" value={form.password_confirmation} onChange={e=>setForm(p=>({...p,password_confirmation:e.target.value}))} dir="ltr" required /></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem' }}>
            <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>الخطة</label>
              <select style={INP} value={form.plan} onChange={e=>setForm(p=>({...p,plan:e.target.value}))}>
                <option value="starter">Starter — مجاني</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option>
              </select></div>
            <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>البلد</label>
              <select style={INP} value={form.country} onChange={e=>setForm(p=>({...p,country:e.target.value}))}>
                {['مصر','السعودية','الإمارات','الكويت','الأردن','البحرين','عُمان','قطر','ليبيا','المغرب','تونس','الجزائر'].map(c=><option key={c}>{c}</option>)}
              </select></div>
          </div>
          {error && <div style={{ padding:'0.7rem 1rem',background:'var(--color-danger-light)',color:'var(--color-danger)',borderRadius:'var(--radius-md)',fontSize:'0.875rem' }}>⚠️ {error}</div>}
          <button type="submit" disabled={loading} style={{ padding:'0.8rem',background:'var(--color-primary)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontSize:'0.95rem',fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,fontFamily:'inherit' }}>
            {loading?'⏳ جارٍ إنشاء الحساب...':'🚀 إنشاء الحساب'}
          </button>
        </form>
        <p style={{ textAlign:'center',marginTop:'1.5rem',fontSize:'0.875rem',color:'var(--text-muted)' }}>
          لديك حساب بالفعل؟{' '}
          <Link href="/login" style={{ color:'var(--color-primary)',fontWeight:700,textDecoration:'none' }}>تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  )
}
