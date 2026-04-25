'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { api } from '../../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    const res = await api.post('/auth/forgot-password', { email })
    setLoading(false)

    if (res.error) {
      // رسائل أوضح للمستخدم
      if (res.status === 503 || (res.error || '').includes('mail') || (res.error || '').includes('SMTP')) {
        setError('خدمة البريد غير مفعّلة حالياً. تواصل مع مسؤول النظام.')
      } else if (res.status === 404 || (res.error || '').toLowerCase().includes('not found')) {
        setError('البريد الإلكتروني غير مسجّل في النظام')
      } else if (res.status === 429) {
        setError('طلبات كثيرة جداً، انتظر قليلاً ثم حاول مرة أخرى')
      } else {
        setError(res.error)
      }
      return
    }
    setSent(true)
  }

  const INP: React.CSSProperties = { width:'100%',padding:'0.7rem 1rem',background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:'0.9rem',fontFamily:'inherit',outline:'none' }

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg-page)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',fontFamily:'Cairo, Inter, sans-serif' }}>
      <div style={{ width:'100%',maxWidth:400,background:'var(--bg-card)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-xl)',padding:'2.5rem' }}>
        {sent ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'3rem',marginBottom:'1rem' }}>📧</div>
            <h2 style={{ fontWeight:800,color:'var(--text-primary)',marginBottom:8 }}>تم الإرسال!</h2>
            <p style={{ color:'var(--text-muted)',fontSize:'0.9rem',marginBottom:'1.5rem' }}>تحقق من بريدك الإلكتروني <strong>{email}</strong> واتبع التعليمات.</p>
            <Link href="/login" style={{ display:'block',padding:'0.75rem',background:'var(--color-primary)',color:'#fff',borderRadius:'var(--radius-md)',fontWeight:700,textDecoration:'none',textAlign:'center' }}>العودة لتسجيل الدخول</Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign:'center',marginBottom:'2rem' }}>
              <div style={{ fontSize:'2.5rem',marginBottom:'0.5rem' }}>🔑</div>
              <h1 style={{ fontSize:'1.4rem',fontWeight:800,color:'var(--text-primary)',marginBottom:4 }}>نسيت كلمة المرور؟</h1>
              <p style={{ color:'var(--text-muted)',fontSize:'0.875rem' }}>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
              <div><label style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:4 }}>البريد الإلكتروني</label>
                <input style={INP} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@company.com" dir="ltr" required /></div>
              {error && <div style={{ padding:'0.65rem 1rem',background:'var(--color-danger-light)',color:'var(--color-danger)',borderRadius:'var(--radius-md)',fontSize:'0.875rem' }}>⚠️ {error}</div>}
              <button type="submit" disabled={loading} style={{ padding:'0.75rem',background:'var(--color-primary)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontSize:'0.9rem',fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,fontFamily:'inherit' }}>
                {loading?'⏳ جارٍ الإرسال...':'📨 إرسال رابط الاستعادة'}
              </button>
            </form>
            <p style={{ textAlign:'center',marginTop:'1.5rem',fontSize:'0.875rem' }}>
              <Link href="/login" style={{ color:'var(--color-primary)',fontWeight:700,textDecoration:'none' }}>← العودة لتسجيل الدخول</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
