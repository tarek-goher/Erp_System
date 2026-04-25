'use client'

// ══════════════════════════════════════════════════════════
// app/login/page.tsx — صفحة تسجيل الدخول
// ══════════════════════════════════════════════════════════
// POST /api/auth/login → { token, user }
// بعد النجاح بيوجّه لـ /dashboard أو /super-admin
// ══════════════════════════════════════════════════════════

import { useState, FormEvent } from 'react'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'
import { useTheme } from '../../lib/theme'
import './login.css'

export default function LoginPage() {
  const { login }           = useAuth()
  const { t, lang, toggleLang, dir } = useI18n()
  const { isDark, toggleTheme }      = useTheme()

  // ─── حالة الفورم ──────────────────────────────────────
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  // ─── Submit الفورم → POST /api/auth/login ─────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // تحقق بسيط قبل الإرسال
    if (!email || !password) {
      setError(t('required_field'))
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    // لو رجع خطأ اعرضه
    if (result.error) {
      setError(result.error)
    }
    // لو نجح → login() هيعمل redirect تلقائي
  }

  return (
    <div className="login-wrapper" dir={dir}>
      {/* ── خلفية ديكورية ──────────────────────────────── */}
      <div className="login-bg">
        <div className="login-bg-blob login-bg-blob-1" />
        <div className="login-bg-blob login-bg-blob-2" />
      </div>

      {/* ── الكرت الرئيسي ──────────────────────────────── */}
      <div className="login-card">

        {/* ── أزرار الأعلى (لغة + ثيم) ─────────────────── */}
        <div className="login-top-actions">
          <button className="btn-icon login-action-btn" onClick={toggleLang}>
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
          <button className="btn-icon login-action-btn" onClick={toggleTheme}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* ── اللوغو ─────────────────────────────────────── */}
        <div className="login-logo">
          <span className="login-logo-icon">⚡</span>
          <h1 className="login-logo-text">ERP System</h1>
        </div>

        {/* ── العنوان ──────────────────────────────────── */}
        <div className="login-heading">
          <h2 className="login-title">{t('login')}</h2>
          <p className="login-subtitle">
            {lang === 'ar' ? 'أدخل بياناتك للدخول إلى نظام الـ ERP' : 'Enter your credentials to access the ERP system'}
          </p>
        </div>

        {/* ── الفورم ────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>

          {/* البريد الإلكتروني */}
          <div className="input-group">
            <label className="input-label">{t('email')}</label>
            <input
              className="input"
              type="email"
              placeholder={lang === 'ar' ? 'example@company.com' : 'example@company.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          {/* كلمة المرور */}
          <div className="input-group">
            <label className="input-label">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
            <div className="login-pass-wrapper">
              <input
                className="input login-pass-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              {/* زرار إظهار/إخفاء كلمة المرور */}
              <button
                type="button"
                className="login-pass-toggle"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* زرار تسجيل الدخول */}
          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> {t('loading')}</>
              : t('login')
            }
          </button>

          {/* رابط نسيت كلمة المرور */}
          <div className="login-footer">
            <a href="/forgot-password" className="login-forgot">
              {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
