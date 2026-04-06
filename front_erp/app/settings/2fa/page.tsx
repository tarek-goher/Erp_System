'use client'

// ══════════════════════════════════════════════════════════
// app/settings/2fa/page.tsx — إعدادات التحقق الثنائي (2FA)
// API:
//   GET  /api/2fa/setup   → الحصول على الـ secret + QR URL
//   POST /api/2fa/enable  → تفعيل بعد التحقق من الكود
//   POST /api/2fa/disable → إلغاء التفعيل
//   POST /api/2fa/verify  → التحقق من كود TOTP
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../../components/layout/ERPLayout'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'
import { useAuth } from '../../../lib/auth'

type SetupData = { secret: string; qr_url: string }

export default function TwoFactorPage() {
  const { lang } = useI18n()
  const { user, setUser } = useAuth() as any
  const ar = lang === 'ar'

  const [step,     setStep]     = useState<'idle' | 'setup' | 'verify'>('idle')
  const [setup,    setSetup]    = useState<SetupData | null>(null)
  const [code,     setCode]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const [is2FA,    setIs2FA]    = useState<boolean>(user?.two_factor_enabled ?? false)

  const flash = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000) }

  // بدء إعداد الـ 2FA — جيب الـ secret والـ QR
  const handleBeginSetup = async () => {
    setLoading(true)
    const res = await api.get('/2fa/setup')
    setLoading(false)
    if (res.error) { flash(res.error, false); return }
    setSetup(res.data)
    setStep('setup')
  }

  // تفعيل الـ 2FA بعد إدخال الكود
  const handleEnable = async () => {
    if (code.length !== 6) { flash(ar ? 'الكود يجب أن يكون 6 أرقام' : 'Code must be 6 digits', false); return }
    setLoading(true)
    const res = await api.post('/2fa/enable', { code })
    setLoading(false)
    if (res.error) { flash(res.error, false); return }
    setIs2FA(true)
    setStep('idle')
    setCode('')
    flash(ar ? '✅ تم تفعيل التحقق الثنائي بنجاح' : '✅ 2FA enabled successfully')
  }

  // إلغاء الـ 2FA
  const handleDisable = async () => {
    if (!confirm(ar ? 'هل تريد إلغاء التحقق الثنائي؟ سيقل مستوى أمان حسابك.' : 'Disable 2FA? This will reduce your account security.')) return
    setLoading(true)
    const res = await api.post('/2fa/disable', {})
    setLoading(false)
    if (res.error) { flash(res.error, false); return }
    setIs2FA(false)
    flash(ar ? 'تم إلغاء التحقق الثنائي' : '2FA disabled')
  }

  const qrImageUrl = setup?.qr_url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.qr_url)}`
    : null

  return (
    <ERPLayout>
      <div style={{ padding: '24px', maxWidth: 680, margin: '0 auto' }}>

        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: toast.ok ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '13px 22px', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontWeight: 600, fontSize: 14,
          }}>{toast.msg}</div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            🔐 {ar ? 'التحقق الثنائي (2FA)' : 'Two-Factor Authentication'}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>
            {ar
              ? 'أضف طبقة أمان إضافية لحسابك باستخدام تطبيق Google Authenticator'
              : 'Add an extra layer of security using Google Authenticator'}
          </p>
        </div>

        {/* Status Card */}
        <div style={{
          background: is2FA ? '#f0fdf4' : '#fefce8',
          border: `1px solid ${is2FA ? '#86efac' : '#fde047'}`,
          borderRadius: 12, padding: 20, marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 36 }}>{is2FA ? '🛡️' : '⚠️'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: is2FA ? '#166534' : '#92400e' }}>
              {is2FA
                ? (ar ? 'التحقق الثنائي مفعّل' : '2FA is enabled')
                : (ar ? 'التحقق الثنائي غير مفعّل' : '2FA is not enabled')}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
              {is2FA
                ? (ar ? 'حسابك محمي بطبقة أمان إضافية.' : 'Your account is protected with an extra layer.')
                : (ar ? 'نوصي بتفعيل 2FA لحماية حسابك.' : 'We recommend enabling 2FA to protect your account.')}
            </div>
          </div>
        </div>

        {/* ── Step: Idle (not set up yet) ──────────────── */}
        {step === 'idle' && !is2FA && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>
              {ar ? 'كيفية التفعيل' : 'How to enable 2FA'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {[
                { step: '1', text: ar ? 'حمّل تطبيق Google Authenticator أو Authy على هاتفك' : 'Download Google Authenticator or Authy on your phone' },
                { step: '2', text: ar ? 'اضغط "بدء الإعداد" واسمح للسيستم بتوليد مفتاحك' : 'Click "Begin Setup" to generate your secret key' },
                { step: '3', text: ar ? 'امسح رمز QR بالتطبيق' : 'Scan the QR code with the app' },
                { step: '4', text: ar ? 'أدخل الكود المكوّن من 6 أرقام للتأكيد' : 'Enter the 6-digit code to confirm' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#1a56db', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, flexShrink: 0,
                  }}>{item.step}</div>
                  <div style={{ fontSize: 14, color: '#374151', paddingTop: 4 }}>{item.text}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleBeginSetup}
              disabled={loading}
              style={{
                width: '100%', padding: '13px', border: 'none', borderRadius: 8,
                background: loading ? '#93c5fd' : '#1a56db', color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading && <Spinner />}
              {loading ? (ar ? 'جاري التحضير...' : 'Preparing...') : (ar ? '🔐 بدء إعداد 2FA' : '🔐 Begin Setup')}
            </button>
          </div>
        )}

        {/* ── Step: Show QR ─────────────────────────────── */}
        {step === 'setup' && setup && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
              {ar ? '📱 امسح رمز QR' : '📱 Scan QR Code'}
            </h2>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              {qrImageUrl ? (
                <div style={{ padding: 12, border: '2px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrImageUrl} alt="QR Code" width={200} height={200} style={{ display: 'block', borderRadius: 6 }} />
                </div>
              ) : (
                <div style={{ width: 200, height: 200, background: '#f3f4f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  QR unavailable
                </div>
              )}
            </div>

            {/* Manual key */}
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                {ar ? 'أو أدخل المفتاح يدوياً:' : 'Or enter key manually:'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#111827', wordBreak: 'break-all' }}>
                {setup.secret}
              </div>
            </div>

            {/* Code input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                {ar ? 'أدخل الكود من التطبيق (6 أرقام)' : 'Enter the code from the app (6 digits)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{
                  width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: 8,
                  fontSize: 24, textAlign: 'center', letterSpacing: 8, fontWeight: 700,
                  boxSizing: 'border-box', fontFamily: 'monospace',
                  outline: 'none', transition: 'border-color .2s',
                  ...(code.length === 6 ? { borderColor: '#22c55e' } : {}),
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setStep('idle'); setSetup(null); setCode('') }}
                style={{ flex: 1, padding: '11px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleEnable}
                disabled={loading || code.length !== 6}
                style={{
                  flex: 2, padding: '11px', border: 'none', borderRadius: 8,
                  background: (loading || code.length !== 6) ? '#93c5fd' : '#1a56db', color: '#fff',
                  cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading && <Spinner />}
                {loading ? (ar ? 'جاري التفعيل...' : 'Enabling...') : (ar ? '✅ تفعيل 2FA' : '✅ Activate 2FA')}
              </button>
            </div>
          </div>
        )}

        {/* ── Already enabled: Disable option ──────────── */}
        {is2FA && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 700, color: '#dc2626' }}>
              {ar ? '⚠️ إلغاء التحقق الثنائي' : '⚠️ Disable Two-Factor Authentication'}
            </h2>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
              {ar
                ? 'إلغاء التحقق الثنائي سيجعل حسابك أقل أماناً. يُنصح بالاحتفاظ به مفعّلاً في جميع الأوقات.'
                : 'Disabling 2FA will make your account less secure. We recommend keeping it enabled at all times.'}
            </p>
            <button
              onClick={handleDisable}
              disabled={loading}
              style={{
                padding: '11px 24px', border: '1px solid #fca5a5', borderRadius: 8,
                background: loading ? '#fef2f2' : '#fff', color: '#dc2626',
                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {loading && <Spinner />}
              {loading ? (ar ? 'جاري الإلغاء...' : 'Disabling...') : (ar ? '🔓 إلغاء تفعيل 2FA' : '🔓 Disable 2FA')}
            </button>
          </div>
        )}

        {/* Supported apps */}
        <div style={{ marginTop: 24, background: '#f9fafb', borderRadius: 10, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 10 }}>
            {ar ? '📱 تطبيقات المصادقة المدعومة:' : '📱 Supported Authenticator Apps:'}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['Google Authenticator', 'Microsoft Authenticator', 'Authy', 'LastPass Authenticator'].map(app => (
              <span key={app} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 12px', fontSize: 13, color: '#374151' }}>
                {app}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ERPLayout>
  )
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
}
