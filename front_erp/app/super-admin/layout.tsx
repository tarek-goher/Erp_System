'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../lib/auth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NAV = [
  { href:'/super-admin',              icon:'📊', label:'لوحة التحكم' },
  { href:'/super-admin/companies',    icon:'🏢', label:'الشركات' },
  { href:'/super-admin/users',        icon:'👤', label:'المستخدمون' },
  { href:'/super-admin/subscriptions',icon:'💳', label:'الاشتراكات' },
  { href:'/super-admin/tickets',      icon:'🎫', label:'تذاكر الدعم' },
  { href:'/super-admin/monitoring',   icon:'📡', label:'مراقبة النظام' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !user.is_super_admin) router.push('/dashboard')
  }, [user])

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-page)', fontFamily:'Cairo, Inter, sans-serif' }}>
      <aside style={{
        width:240, background:'var(--bg-card)', borderInlineEnd:'1px solid var(--border)',
        display:'flex', flexDirection:'column', padding:'1.5rem 0', flexShrink:0,
      }}>
        <div style={{ padding:'0 1.25rem', marginBottom:'1.5rem' }}>
          <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--color-primary)' }}>⚡ Super Admin</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>لوحة الإدارة العليا</div>
        </div>
        <nav style={{ display:'flex', flexDirection:'column', gap:2, padding:'0 0.75rem' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'0.6rem 0.75rem', borderRadius:'var(--radius-md)',
              textDecoration:'none', fontSize:'0.875rem',
              background: pathname===n.href ? 'var(--color-primary-light)' : 'transparent',
              color:       pathname===n.href ? 'var(--color-primary)'       : 'var(--text-secondary)',
              fontWeight:  pathname===n.href ? 700 : 400,
            }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ marginTop:'auto', padding:'1rem 1.25rem' }}>
          <Link href="/dashboard" style={{ fontSize:'0.8rem', color:'var(--text-muted)', textDecoration:'none' }}>
            ← العودة للنظام
          </Link>
        </div>
      </aside>
      <main style={{ flex:1, padding:'2rem', overflowY:'auto' }}>
        {children}
      </main>
    </div>
  )
}
