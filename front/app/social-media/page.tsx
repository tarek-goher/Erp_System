'use client'

// ══════════════════════════════════════════════════════════
// app/social-media/page.tsx — Social Media / Multi-Channel
// API: GET/POST/PUT /api/channel-integrations
//      Channels: whatsapp, facebook, instagram
// ══════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api, extractArray } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui'

type Channel = {
  id?: number
  type: 'whatsapp' | 'facebook' | 'instagram'
  name: string
  is_active: boolean
  config: Record<string, any>
}

const CHANNELS = [
  { key: 'whatsapp', ar: 'واتساب',    en: 'WhatsApp',  icon: '💬', color: '#25D366' },
  { key: 'facebook', ar: 'فيسبوك',    en: 'Facebook',  icon: '📘', color: '#1877F2' },
  { key: 'instagram', ar: 'إنستغرام', en: 'Instagram', icon: '📸', color: '#E1306C' },
]

const CHANNEL_FIELDS: Record<string, { key: string; ar: string; en: string; type?: string }[]> = {
  whatsapp: [
    { key: 'phone_number_id', ar: 'معرف رقم الهاتف', en: 'Phone Number ID' },
    { key: 'access_token', ar: 'رمز الوصول', en: 'Access Token', type: 'password' },
    { key: 'verify_token', ar: 'رمز التحقق', en: 'Verify Token' },
    { key: 'waba_id', ar: 'معرف حساب واتساب للأعمال', en: 'WABA ID' },
  ],
  facebook: [
    { key: 'page_id', ar: 'معرف الصفحة', en: 'Page ID' },
    { key: 'page_access_token', ar: 'رمز وصول الصفحة', en: 'Page Access Token', type: 'password' },
    { key: 'app_id', ar: 'معرف التطبيق', en: 'App ID' },
    { key: 'app_secret', ar: 'سر التطبيق', en: 'App Secret', type: 'password' },
  ],
  instagram: [
    { key: 'instagram_account_id', ar: 'معرف حساب إنستغرام', en: 'Instagram Account ID' },
    { key: 'access_token', ar: 'رمز الوصول', en: 'Access Token', type: 'password' },
    { key: 'app_id', ar: 'معرف التطبيق', en: 'App ID' },
    { key: 'app_secret', ar: 'سر التطبيق', en: 'App Secret', type: 'password' },
  ],
}

export default function SocialMediaPage() {
  const { lang } = useI18n()
  const { toasts, show, remove } = useToast()
  const [channels, setChannels]     = useState<Channel[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeChannel, setActiveChannel] = useState<string>('whatsapp')
  const [form, setForm]             = useState<Record<string, any>>({ name: '', is_active: true, config: {} })
  const [saving, setSaving]         = useState(false)
  const [testing, setTesting]       = useState(false)

  const loadChannels = () => {
    setLoading(true)
    api.get('/channel-integrations').then(res => {
      setChannels(extractArray(res.data))
      setLoading(false)
    })
  }

  useEffect(() => { loadChannels() }, [])

  useEffect(() => {
    const existing = channels.find(c => c.type === activeChannel)
    if (existing) {
      setForm({ name: existing.name, is_active: existing.is_active, config: existing.config || {} })
    } else {
      setForm({ name: '', is_active: true, config: {} })
    }
  }, [activeChannel, channels])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true)
    const existing = channels.find(c => c.type === activeChannel)
    const payload = { type: activeChannel, name: form.name, is_active: form.is_active, config: form.config }
    const res = existing
      ? await api.put(`/channel-integrations/${existing.id}`, payload)
      : await api.post('/channel-integrations', payload)
    setSaving(false)
    if (res.data) {
      show(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully', 'success')
      loadChannels()
    } else {
      show(res.error || (lang === 'ar' ? 'فشل الحفظ' : 'Save failed'), 'error')
    }
  }

  const handleTest = async () => {
    const existing = channels.find(c => c.type === activeChannel)
    if (!existing) { show(lang === 'ar' ? 'احفظ الإعدادات أولاً' : 'Save settings first', 'warning'); return }
    setTesting(true)
    const res = await api.post(`/channel-integrations/${existing.id}/test`, {})
    setTesting(false)
    if (res.data?.success) show(lang === 'ar' ? 'الاتصال ناجح ✓' : 'Connection successful ✓', 'success')
    else show(res.error || res.data?.message || (lang === 'ar' ? 'فشل الاتصال' : 'Connection failed'), 'error')
  }

  const setConfigField = (key: string, val: string) => {
    setForm(prev => ({ ...prev, config: { ...prev.config, [key]: val } }))
  }

  const channelMeta = CHANNELS.find(c => c.key === activeChannel)!
  const fields = CHANNEL_FIELDS[activeChannel] || []
  const existing = channels.find(c => c.type === activeChannel)

  return (
    <ERPLayout pageTitle={lang === 'ar' ? 'وسائل التواصل الاجتماعي' : 'Social Media / Multi-Channel'}>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Channel Status Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {CHANNELS.map(ch => {
          const ch_data = channels.find(c => c.type === ch.key)
          return (
            <div key={ch.key} className="card stat-card" style={{ cursor: 'pointer', border: activeChannel === ch.key ? `2px solid ${ch.color}` : undefined }}
              onClick={() => setActiveChannel(ch.key)}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{ch.icon}</div>
              <div className="stat-label">{lang === 'ar' ? ch.ar : ch.en}</div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className={`badge ${ch_data?.is_active ? 'badge-success' : 'badge-muted'}`}>
                  {ch_data ? (ch_data.is_active ? (lang === 'ar' ? 'مفعّل' : 'Active') : (lang === 'ar' ? 'معطّل' : 'Inactive')) : (lang === 'ar' ? 'غير مضبوط' : 'Not configured')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Configuration Form */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h3 className="fw-bold">
            {channelMeta.icon} {lang === 'ar' ? `إعداد ${channelMeta.ar}` : `${channelMeta.en} Setup`}
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {existing && (
              <button className="btn btn-secondary btn-sm" onClick={handleTest} disabled={testing}>
                🔌 {testing ? '...' : (lang === 'ar' ? 'اختبار الاتصال' : 'Test Connection')}
              </button>
            )}
            <span className={`badge ${existing ? 'badge-success' : 'badge-muted'}`}>
              {existing ? (lang === 'ar' ? 'مضبوط' : 'Configured') : (lang === 'ar' ? 'جديد' : 'New')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-grid form-grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'الاسم' : 'Integration Name'}</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={lang === 'ar' ? `مثال: ${channelMeta.ar} الرسمي` : `e.g. Official ${channelMeta.en}`} required />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'الحالة' : 'Status'}</label>
              <select className="input" value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                <option value="true">{lang === 'ar' ? 'مفعّل' : 'Active'}</option>
                <option value="false">{lang === 'ar' ? 'معطّل' : 'Inactive'}</option>
              </select>
            </div>
          </div>

          <h4 className="fw-bold" style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {lang === 'ar' ? 'إعدادات API' : 'API Configuration'}
          </h4>

          <div className="form-grid form-grid-2" style={{ marginBottom: '1.5rem' }}>
            {fields.map(field => (
              <div key={field.key} className="input-group">
                <label className="input-label">{lang === 'ar' ? field.ar : field.en}</label>
                <input
                  className="input"
                  type={field.type || 'text'}
                  value={form.config?.[field.key] || ''}
                  onChange={e => setConfigField(field.key, e.target.value)}
                  placeholder={field.key}
                />
              </div>
            ))}
          </div>

          {/* Webhook Info */}
          <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
            <h4 className="fw-bold" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              🔗 {lang === 'ar' ? 'عنوان Webhook' : 'Webhook URL'}
            </h4>
            <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host.replace('3000', '8000')}/api/webhook/${activeChannel}` : `/api/webhook/${activeChannel}`}
            </code>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {lang === 'ar'
                ? 'استخدم هذا العنوان في إعدادات المنصة لاستقبال الرسائل تلقائياً'
                : 'Use this URL in the platform settings to receive messages automatically'}
            </p>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
          </button>
        </form>
      </div>

      {/* Existing Channels Table */}
      {channels.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', padding: 0 }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <h3 className="fw-bold">{lang === 'ar' ? 'القنوات المضبوطة' : 'Configured Channels'}</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'القناة' : 'Channel'}</th>
                  <th>{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{lang === 'ar' ? 'آخر تحديث' : 'Updated'}</th>
                </tr>
              </thead>
              <tbody>
                {channels.map(ch => {
                  const meta = CHANNELS.find(c => c.key === ch.type)
                  return (
                    <tr key={ch.id} style={{ cursor: 'pointer' }} onClick={() => setActiveChannel(ch.type)}>
                      <td><span style={{ fontSize: '1.2rem' }}>{meta?.icon}</span> {lang === 'ar' ? meta?.ar : meta?.en}</td>
                      <td className="fw-semibold">{ch.name}</td>
                      <td><span className={`badge ${ch.is_active ? 'badge-success' : 'badge-muted'}`}>{ch.is_active ? (lang === 'ar' ? 'مفعّل' : 'Active') : (lang === 'ar' ? 'معطّل' : 'Inactive')}</span></td>
                      <td className="text-muted">{(ch as any).updated_at ? new Date((ch as any).updated_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ERPLayout>
  )
}
