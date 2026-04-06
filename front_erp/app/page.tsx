// ══════════════════════════════════════════════════════════
// app/page.tsx — الصفحة الجذر (/) → redirect للـ dashboard
// ══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation'

export default function RootPage() {
  // وجّه تلقائياً لـ /dashboard
  // الـ ERPLayout هيتحقق من الـ login ويوجّه لـ /login لو مش logged in
  redirect('/dashboard')
}
