'use client'
import { useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token  = params.get('token') ?? ''
  const email  = params.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return }
    if (password.length < 8)  { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setLoading(true)
    const res = await api.post('/auth/reset-password', { token, email, password, password_confirmation: confirm })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setDone(true); setTimeout(() => router.push('/login'), 2000)
  }

  const INP: React.CSSProperties = { width:'100%',padding:'0.7rem 1rem',background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:'0.9rem',fontFamily:'inherit',outline:'none' }

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg-page)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',fontFamily:'Cairo, Inter, sans-serif' }}>
      <div style={{ width:'100%',maxWidth:400,background:'var(--bg-card)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-xl)',padding:'2.5rem' }}>
        {done ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'3rem',marginBottom:'1rem' }}>✅</div>
            <h2 style={{ fontWeight:800,color:'var(--text-primary)',marginBottom:8 }}>تم بنجاح!</h2>
            <p style={{ color:'var(--text-muted)',fontSize:'0.9rem' }}>تم تغيير كلمة المرور. جارٍ تحويلك لصفحة الدخول...</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign:'center',marginBottom:'2rem' }}>
              <div style={{ fontSize:'2.5rem',marginBottom:'0.5rem' }}>🔐</div>
              <h1 style={{ fontSize:'1.4rem',fontWeight:800,color:'var(--text-primary)',marginBottom:4 }}>تعيين كلمة مرور جديدة</h1>
              {email && <p style={{ color:'var(--text-muted)',fontSize:'0.8rem' }}>{email}</p>}
            </div>
            <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
              <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>كلمة المرور الجديدة</label>
                <input style={INP} type="password" value={password} onChange={e=>setPassword(e.target.value)} dir="ltr" required /></div>
              <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>تأكيد كلمة المرور</label>
                <input style={INP} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} dir="ltr" required /></div>
              {error && <div style={{ padding:'0.65rem 1rem',background:'var(--color-danger-light)',color:'var(--color-danger)',borderRadius:'var(--radius-md)',fontSize:'0.875rem' }}>⚠️ {error}</div>}
              <button type="submit" disabled={loading} style={{ padding:'0.75rem',background:'var(--color-primary)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontSize:'0.9rem',fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,fontFamily:'inherit' }}>
                {loading?'⏳ جارٍ التغيير...':'✅ تعيين كلمة المرور'}
              </button>
            </form>
            <p style={{ textAlign:'center',marginTop:'1.5rem',fontSize:'0.875rem' }}>
              <Link href="/login" style={{ color:'var(--color-primary)',fontWeight:700,textDecoration:'none' }}>← تسجيل الدخول</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>
}
